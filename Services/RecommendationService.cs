using System;
using System.Collections.Generic;
using System.Linq;
using IntelliOps.Models;

namespace IntelliOps.Services
{
    public class RecommendationService
    {
        public List<Recommendation> GenerateRecommendations(
            List<Employee> employees, 
            List<TaskRecord> tasks, 
            List<Anomaly> anomalies)
        {
            var recommendations = new List<Recommendation>();

            if (employees == null || tasks == null) return recommendations;

            var seededTaskIds = new HashSet<string> {
                "task_01", "task_02", "task_03", "task_04", "task_05", "task_06", "task_07", "task_08", "task_09", "task_10", "task_11", "task_12", "task_13", "task_14", "task_15", "task_16", "task_17"
            };
            bool hasCustomTasks = tasks.Any(t => !seededTaskIds.Contains(t.Id));

            // Only generate from organic data if custom tasks exist, or if we want beautiful complete data
            // Let's filter out any seeded tasks/employees if custom tasks exist to maintain single source of truth
            var activeTasks = hasCustomTasks ? tasks.Where(t => !seededTaskIds.Contains(t.Id)).ToList() : tasks;
            var activeEmployees = hasCustomTasks ? employees.Where(e => activeTasks.Any(t => t.EmployeeName == e.Name)).ToList() : employees;

            // 1. Burnout & Load Rebalancing Recommendations
            var overloadedEmployees = activeEmployees.Where(e => e.TotalHours > 40).OrderByDescending(e => e.TotalHours).ToList();
            foreach (var emp in overloadedEmployees)
            {
                // Find potential underloaded employees in the same department
                var helpers = activeEmployees
                    .Where(e => e.Department == emp.Department && e.Name != emp.Name && e.TotalHours < 35)
                    .OrderBy(e => e.TotalHours)
                    .ToList();

                var pendingTasks = activeTasks.Where(t => t.EmployeeName == emp.Name && t.Status != "Completed").ToList();
                if (pendingTasks.Any() && helpers.Any())
                {
                    var targetTask = pendingTasks.First();
                    var bestHelper = helpers.First();

                    recommendations.Add(new Recommendation
                    {
                        Id = $"rec_burnout_{emp.Name.Replace(" ", "_").ToLower()}",
                        Title = $"Load Rebalancing: Offload {emp.Name}",
                        Department = emp.Department,
                        MetricReference = $"{emp.Name} is logging {emp.TotalHours} weekly hours (exceeding safety limits)",
                        ActionablePlan = $"Reallocate active work order '{targetTask.Notes}' from {emp.Name} ({emp.TotalHours} hrs) to {bestHelper.Name} ({bestHelper.TotalHours} hrs) inside the {emp.Department} queue. This immediately mitigates operational fatigue and reduces department delivery risk.",
                        Severity = emp.TotalHours > 60 ? "Critical" : "High",
                        Status = "Open"
                    });
                }
                else if (pendingTasks.Any())
                {
                    var targetTask = pendingTasks.First();
                    // Just recommend workload redistribution generally even if helper is in other dept
                    var crossHelpers = activeEmployees
                        .Where(e => e.Name != emp.Name && e.TotalHours < 35)
                        .OrderBy(e => e.TotalHours)
                        .ToList();

                    if (crossHelpers.Any())
                    {
                        var bestHelper = crossHelpers.First();
                        recommendations.Add(new Recommendation
                        {
                            Id = $"rec_cross_burnout_{emp.Name.Replace(" ", "_").ToLower()}",
                            Title = $"Cross-Department Load Balancing: Support {emp.Name}",
                            Department = emp.Department,
                            MetricReference = $"{emp.Name} workload at {emp.TotalHours} capacity hours",
                            ActionablePlan = $"Assign cross-trained resource {bestHelper.Name} from {bestHelper.Department} department to assist {emp.Name} on active operation '{targetTask.Notes}' to clear queue congestion.",
                            Severity = "High",
                            Status = "Open"
                        });
                    }
                }
            }

            // 2. SLA Mitigation Recommendations
            var breachedTasks = activeTasks.Where(t => t.SlaBreached && t.Status != "Completed").ToList();
            foreach (var task in breachedTasks)
            {
                recommendations.Add(new Recommendation
                {
                    Id = $"rec_sla_mit_{task.Id}",
                    Title = $"SLA Recovery Action: Re-prioritize Task for {task.EmployeeName}",
                    Department = task.Department,
                    MetricReference = $"SLA Timeline violated: Cumulative hours {task.HoursWorked} logged",
                    ActionablePlan = $"Deploy immediate supervision/backup to assist {task.EmployeeName} in completing pending ticket '{task.Notes}'. Recommend direct contact with core clients to push deliverable windows.",
                    Severity = task.Priority == "Critical" ? "Critical" : "High",
                    Status = "Open"
                });
            }

            // 3. Departmental Risk Remediation
            var uniqueDepts = activeTasks.Select(t => t.Department).Where(d => !string.IsNullOrEmpty(d)).Distinct().ToList();
            foreach (var dept in uniqueDepts)
            {
                var deptTasks = activeTasks.Where(t => t.Department == dept).ToList();
                int incompleteCount = deptTasks.Count(t => t.Status != "Completed");
                int totalHours = deptTasks.Sum(t => t.HoursWorked);

                if (totalHours > 100 && incompleteCount > 3)
                {
                    recommendations.Add(new Recommendation
                    {
                        Id = $"rec_dept_risk_{dept.Replace(" ", "_").ToLower()}",
                        Title = $"Operational Reinforcements: {dept} Queue",
                        Department = dept,
                        MetricReference = $"{incompleteCount} active tasks logging {totalHours} total effort hours in department",
                        ActionablePlan = $"Establish a dedicated daily operations review for the {dept} department. Authorize secondary supervisor oversight or approve auxiliary staff overtime to address the capacity deficit.",
                        Severity = "High",
                        Status = "Open"
                    });
                }
            }

            // Fallback default recommendations if empty
            if (!recommendations.Any())
            {
                recommendations.Add(new Recommendation
                {
                    Id = "rec_default_general",
                    Title = "Active Systems Alignment & Queue Monitoring",
                    Department = "Operations",
                    MetricReference = "All queues operating within nominal enterprise SLA parameters",
                    ActionablePlan = "Validate active sync paths across all ERP endpoints and run system log optimizations. Staff allocations are currently balanced perfectly.",
                    Severity = "Low",
                    Status = "Open"
                });
            }

            return recommendations;
        }
    }
}
