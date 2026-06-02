using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using IntelliOps.Data;
using IntelliOps.Models;
using IntelliOps.Services;

namespace IntelliOps.Controllers
{
    [Authorize]
    public class HomeController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly OperationalHealthService _healthService;
        private readonly AnomalyDetectionService _anomalyService;
        private readonly PredictionService _predictionService;
        private readonly RecommendationService _recommendationService;
        private readonly RiskEngineService _riskService;
        private readonly AuditLogService _auditService;

        public HomeController(
            ApplicationDbContext context,
            OperationalHealthService healthService,
            AnomalyDetectionService anomalyService,
            PredictionService predictionService,
            RecommendationService recommendationService,
            RiskEngineService riskService,
            AuditLogService auditService)
        {
            _context = context;
            _healthService = healthService;
            _anomalyService = anomalyService;
            _predictionService = predictionService;
            _recommendationService = recommendationService;
            _riskService = riskService;
            _auditService = auditService;
        }

        public async Task<IActionResult> Index()
        {
            // Resolve role from standard ASP.NET Identity claims
            string role = "Team Lead";
            if (User.IsInRole("Director")) role = "Director";
            else if (User.IsInRole("Operations Manager")) role = "Operations Manager";
            ViewBag.ActiveRole = role;

            var employees = await _context.Employees.ToListAsync();
            var tasks = await _context.Tasks.ToListAsync();
            var alerts = await _context.Alerts.ToListAsync();
            var departments = await _context.Departments.ToListAsync();
            var saps = await _context.SapConnectors.ToListAsync();
            var operationalLogs = await _context.OperationalLogs.OrderByDescending(l => l.Timestamp).Take(8).ToListAsync();
            var dataSources = await _context.DataSources.ToListAsync();

            // Run Core Engines
            var health = _healthService.CalculateHealthScore(tasks, alerts, employees, saps);
            var anomalies = _anomalyService.DetectAnomalies(employees, tasks, saps);
            var predictions = _predictionService.PredictRisks(employees, tasks, departments);
            var recommendations = _recommendationService.GenerateRecommendations(employees, tasks, anomalies);
            var risks = _riskService.GetDepartmentRisks(departments, tasks, alerts);

            // Audit
            await _auditService.AddAuditLogAsync(
                "GET_METRICS", 
                User.Identity?.Name ?? "System User", 
                role, 
                $"Rendered executive dashboard index. Health rating is {health.Score}/100."
            );

            // Setup Dashboard View Model
            var viewModel = new ExecutiveDashboardViewModel
            {
                OperationalHealthScore = health.Score,
                HealthCategory = health.Category,
                EmployeesCount = employees.Count,
                TasksCount = tasks.Count,
                CompletionRate = tasks.Any() ? (int)Math.Round((double)tasks.Count(t => t.Status == "Completed") / tasks.Count * 100) : 0,
                SlaBreachRate = tasks.Any() ? (int)Math.Round((double)tasks.Count(t => t.SlaBreached && t.Status != "Completed") / tasks.Count * 100) : 0,
                ActiveAlertsCount = alerts.Count(a => a.Status != "Resolved"),
                AverageHours = employees.Any() ? (int)Math.Round(employees.Average(e => e.TotalHours)) : 0,
                OverloadedDepartments = employees.Where(e => e.TotalHours > 45).Select(e => e.Department).Distinct().ToList(),
                TopRisks = risks,
                ActiveAnomalies = anomalies,
                PredictedSlaRisks = predictions,
                RecommendationQueue = recommendations,
                Departments = departments,
                Employees = employees,
                OperationalLogs = operationalLogs,
                ActiveAlerts = alerts.Where(a => a.Status != "Resolved").ToList(),
                SapConnectors = saps,
                DataSources = dataSources,
                ActiveUserRole = role
            };

            var latestBriefing = await _context.AiInsightLogs.OrderByDescending(b => b.Timestamp).FirstOrDefaultAsync();
            ViewBag.LatestBriefing = latestBriefing;

            return View(viewModel);
        }
    }
}
