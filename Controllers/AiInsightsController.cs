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
        private readonly AnalyticsPipelineService _analyticsPipeline;
        private readonly OperationalMetricsService _metricsService;

        public AiInsightsController(
            ApplicationDbContext context, 
            OpenRouterAiService aiService,
            OperationalHealthService healthService,
            AuditLogService auditService,
            AnalyticsPipelineService analyticsPipeline,
            OperationalMetricsService metricsService)
        {
            _context = context;
            _aiService = aiService;
            _healthService = healthService;
            _auditService = auditService;
            _analyticsPipeline = analyticsPipeline;
            _metricsService = metricsService;
        }

        public async Task<IActionResult> Index()
        {
            ViewBag.ActiveRole = "Director";
            
            // Check if uploaded data exists: if empty, flag empty-state
            ViewBag.IsEmptyState = !await _context.Tasks.AnyAsync();

            var metricsState = await _metricsService.GetLiveMetricsStateAsync();

            ViewBag.HealthScore = metricsState.HealthScore;
            ViewBag.HealthCategory = metricsState.HealthCategory;
            ViewBag.AverageWorkload = metricsState.AverageWorkload;
            ViewBag.ActiveIncidentCount = metricsState.ActiveIncidentCount;
            ViewBag.RawSignalsCount = metricsState.RawSignalsCount;
            ViewBag.SlaBreachRate = metricsState.SlaBreachRate;
            
            ViewBag.TotalTasksCount = metricsState.TotalTasksCount;
            ViewBag.CompletedTasksCount = metricsState.CompletedTasksCount;
            ViewBag.InProgressTasksCount = metricsState.InProgressTasksCount;
            ViewBag.PendingTasksCount = metricsState.PendingTasksCount;
            ViewBag.SlaBreachesCount = metricsState.SlaBreachesCount;

            var briefings = await _context.AiInsightLogs
                .OrderByDescending(b => b.Timestamp)
                .ToListAsync();

            return View(briefings);
        }

        [HttpPost]
        public async Task<IActionResult> GenerateBriefing()
        {
            // 0. Ensure user has uploaded data
            var taskCheck = await _context.Tasks.AnyAsync();
            if (!taskCheck)
            {
                TempData["Error"] = "No uploaded operational data exists. Please import a CSV dataset under the Sync Integration panel to generate insights.";
                return RedirectToAction("Index");
            }

            // 1. Recalculate metrics across all tables (Employees, Departments, Alerts, OperationalLogs) dynamically
            await _analyticsPipeline.RecalculatePipelineAsync();

            // 2. Erase the generic system-generated briefing created during pipeline recalculation to load the upgraded AI-mode report
            var genericBriefings = await _context.AiInsightLogs.ToListAsync();
            _context.AiInsightLogs.RemoveRange(genericBriefings);
            await _context.SaveChangesAsync();

            // 3. Re-query fresh data models
            var employees = await _context.Employees.ToListAsync();
            var tasks = await _context.Tasks.ToListAsync();
            var alerts = await _context.Alerts.ToListAsync();
            var saps = await _context.SapConnectors.ToListAsync();
            var departments = await _context.Departments.ToListAsync();

            // Calculate current metrics for API prompt context
            var unresolvedAlerts = alerts.Where(a => a.Status != "Resolved").ToList();
            var consolidated = ConsolidatedIncident.Consolidate(unresolvedAlerts, employees);
            var health = _healthService.CalculateHealthScore(tasks, alerts, employees, saps);
            int breachRate = tasks.Any() ? (int)Math.Round((double)tasks.Count(t => t.SlaBreached && t.Status != "Completed") / tasks.Count * 100) : 0;
            int alertCount = consolidated.Count;

            // Fetch key from environment or default file configuration
            string? apiKey = Environment.GetEnvironmentVariable("GEMINI_API_KEY");
            if (string.IsNullOrWhiteSpace(apiKey))
            {
                apiKey = Environment.GetEnvironmentVariable("OPENROUTER_API_KEY");
            }

            TempData["Compiling"] = "Recalculating live telemetry datasets... Generating Operations briefing... Logging audits...";

            var briefing = await _aiService.GenerateExecutiveBriefingAsync(
                health.Score,
                breachRate,
                alertCount,
                employees,
                tasks,
                alerts,
                saps,
                departments,
                apiKey
            );

            // Add upgraded briefing to database
            await _context.AiInsightLogs.AddAsync(briefing);
            await _context.SaveChangesAsync();

            string userRole = "Director";
            await _auditService.AddAuditLogAsync(
                "AI_GENERATE", 
                User.Identity?.Name ?? "Director User", 
                userRole, 
                $"Triggered operational health recalculation. Executed executive AI-briefing parsing, health calculated at {health.Score}/100."
            );

            TempData["Success"] = "Operations metrics recalculated and deep executive AI intelligence report compiled successfully.";
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
                TempData["Success"] = "Executive operational briefing deleted from archive.";
            }
            return RedirectToAction("Index");
        }
    }
}
