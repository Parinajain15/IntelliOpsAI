using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using IntelliOps.Data;
using IntelliOps.Models;

namespace IntelliOps.Services
{
    public class LiveMetricsState
    {
        public int HealthScore { get; set; }
        public string HealthCategory { get; set; } = string.Empty;
        public double AverageWorkload { get; set; }
        public int ActiveIncidentCount { get; set; }
        public int RawSignalsCount { get; set; }
        public int SlaBreachRate { get; set; }
        
        public int TotalTasksCount { get; set; }
        public int CompletedTasksCount { get; set; }
        public int InProgressTasksCount { get; set; }
        public int PendingTasksCount { get; set; }
        public int SlaBreachesCount { get; set; }
        
        public int CompletionRate { get; set; }
    }

    public class OperationalMetricsService
    {
        private readonly ApplicationDbContext _context;
        private readonly OperationalHealthService _healthService;

        public OperationalMetricsService(ApplicationDbContext context, OperationalHealthService healthService)
        {
            _context = context;
            _healthService = healthService;
        }

        public async Task<LiveMetricsState> GetLiveMetricsStateAsync()
        {
            var tasks = await _context.Tasks.ToListAsync();
            var employees = await _context.Employees.ToListAsync();
            var alerts = await _context.Alerts.ToListAsync();
            var saps = await _context.SapConnectors.ToListAsync();

            if (!tasks.Any())
            {
                return new LiveMetricsState
                {
                    HealthScore = 100,
                    HealthCategory = "Nominal",
                    AverageWorkload = 0.0,
                    ActiveIncidentCount = 0,
                    RawSignalsCount = 0,
                    SlaBreachRate = 0,
                    TotalTasksCount = 0,
                    CompletedTasksCount = 0,
                    InProgressTasksCount = 0,
                    PendingTasksCount = 0,
                    SlaBreachesCount = 0,
                    CompletionRate = 0
                };
            }

            var unresolvedAlerts = alerts.Where(a => a.Status != "Resolved").ToList();
            var consolidated = ConsolidatedIncident.Consolidate(unresolvedAlerts, employees);
            var health = _healthService.CalculateHealthScore(tasks, alerts, employees, saps);

            double averageHours = employees.Any() ? Math.Round(employees.Average(e => e.TotalHours), 1) : 0.0;
            int completionRate = (int)Math.Round((double)tasks.Count(t => t.Status == "Completed") / tasks.Count * 100);
            int slaBreachedActive = tasks.Count(t => t.SlaBreached && t.Status != "Completed");
            int slaBreachRate = (int)Math.Round((double)slaBreachedActive / tasks.Count * 100);

            return new LiveMetricsState
            {
                HealthScore = health.Score,
                HealthCategory = health.Category,
                AverageWorkload = averageHours,
                ActiveIncidentCount = consolidated.Count,
                RawSignalsCount = unresolvedAlerts.Count,
                SlaBreachRate = slaBreachRate,
                TotalTasksCount = tasks.Count,
                CompletedTasksCount = tasks.Count(t => t.Status == "Completed"),
                InProgressTasksCount = tasks.Count(t => t.Status == "In Progress"),
                PendingTasksCount = tasks.Count(t => t.Status == "Pending"),
                SlaBreachesCount = slaBreachedActive,
                CompletionRate = completionRate
            };
        }
    }
}
