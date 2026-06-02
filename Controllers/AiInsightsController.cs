using System;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using IntelliOps.Data;
using IntelliOps.Models;
using IntelliOps.Services;

namespace IntelliOps.Controllers
{
    [Authorize(Roles = "Director")]
    public class AiInsightsController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly OpenRouterAiService _aiService;
        private readonly OperationalHealthService _healthService;
        private readonly AuditLogService _auditService;

        public AiInsightsController(
            ApplicationDbContext context, 
            OpenRouterAiService aiService,
            OperationalHealthService healthService,
            AuditLogService auditService)
        {
            _context = context;
            _aiService = aiService;
            _healthService = healthService;
            _auditService = auditService;
        }

        public async Task<IActionResult> Index()
        {
            ViewBag.ActiveRole = "Director";

            var briefings = await _context.AiInsightLogs
                .OrderByDescending(b => b.Timestamp)
                .ToListAsync();

            return View(briefings);
        }

        [HttpPost]
        public async Task<IActionResult> GenerateBriefing()
        {
            var employees = await _context.Employees.ToListAsync();
            var tasks = await _context.Tasks.ToListAsync();
            var alerts = await _context.Alerts.ToListAsync();
            var saps = await _context.SapConnectors.ToListAsync();

            // 1. Calculate health score context
            var health = _healthService.CalculateHealthScore(tasks, alerts, employees, saps);
            int breachRate = tasks.Any() ? (int)Math.Round((double)tasks.Count(t => t.SlaBreached && t.Status != "Completed") / tasks.Count * 100) : 0;
            int alertCount = alerts.Count(a => a.Status != "Resolved");

            // Build dynamic telemetry object to pass to the model as context
            var calculatedContext = new
            {
                healthScore = health.Score,
                healthCategory = health.Category,
                slaBreachRate = breachRate,
                activeAlertsCount = alertCount,
                tasksCount = tasks.Count,
                completedRate = tasks.Any() ? (int)Math.Round((double)tasks.Count(t => t.Status == "Completed") / tasks.Count * 100) : 0,
                sapFails = saps.Count(s => s.Status == "Error"),
                connectors = saps.Select(s => new { s.Name, s.Status, s.Module }),
                employeesOverload = employees.Where(e => e.TotalHours > 45).Select(e => new { e.Name, e.TotalHours, e.Department })
            };

            // Fetch key from environment or default file configuration
            string? apiKey = Environment.GetEnvironmentVariable("GEMINI_API_KEY");
            if (string.IsNullOrWhiteSpace(apiKey))
            {
                apiKey = Environment.GetEnvironmentVariable("OPENROUTER_API_KEY");
            }

            TempData["Compiling"] = "Constructing live telemetry context... Triggering model...";

            var briefing = await _aiService.GenerateExecutiveBriefingAsync(
                health.Score,
                breachRate,
                alertCount,
                employees,
                tasks,
                alerts,
                saps,
                apiKey
            );

            // Add to database
            await _context.AiInsightLogs.AddAsync(briefing);
            await _context.SaveChangesAsync();

            string userRole = "Director";
            await _auditService.AddAuditLogAsync(
                "AI_GENERATE", 
                User.Identity?.Name ?? "Director User", 
                userRole, 
                $"Generated corporate C-Suite AI Briefing. Summary state calculated: {health.Score}/100 Health."
            );

            TempData["Success"] = "AI Executive briefing synthesized successfully using live metrics compilation.";
            return RedirectToAction("Index");
        }

        [HttpPost]
        public async Task<IActionResult> DeleteBriefing(string id)
        {
            var briefing = await _context.AiInsightLogs.FindAsync(id);
            if (briefing != null)
            {
                _context.AiInsightLogs.Remove(briefing);
                await _context.SaveChangesAsync();
                TempData["Success"] = "Briefing note deleted.";
            }
            return RedirectToAction("Index");
        }
    }
}
