using System;
using System.Collections.Generic;
using System.Linq;
using IntelliOps.Models;

namespace IntelliOps.Services
{
    public class RecommendationService
    {
        private static readonly Dictionary<string, string> StatusStore = new Dictionary<string, string>();
        private static readonly object LockObj = new object();

        public static void UpdateStatus(string id, string status)
        {
            lock (LockObj)
            {
                StatusStore[id] = status;
            }
        }

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

            var activeTasks = hasCustomTasks ? tasks.Where(t => !seededTaskIds.Contains(t.Id)).ToList() : tasks;
            var activeEmployees = hasCustomTasks ? employees.Where(e => activeTasks.Any(t => t.EmployeeName == e.Name)).ToList() : employees;

            // 1. Reassign overloaded employee tasks
            var overloadedEmployees = activeEmployees.Where(e => e.TotalHours > 40).OrderByDescending(e => e.TotalHours).ToList();
            foreach (var emp in overloadedEmployees)
            {
                var helpers = activeEmployees
                    .Where(e => e.Department == emp.Department && e.Name != emp.Name && e.TotalHours < 35)
                    .OrderBy(e => e.TotalHours)
                    .ToList();

                var pendingTasks = activeTasks.Where(t => t.EmployeeName == emp.Name && t.Status != "Completed").ToList();
                if (pendingTasks.Any() && helpers.Any())
                {
                    var targetTask = pendingTasks.First();
                    var bestHelper = helpers.First();
                    var recId = $"rec_burnout_{emp.Name.Replace(" ", "_").ToLower()}";

                    recommendations.Add(new Recommendation
                    {
                        Id = recId,
                        Title = $"Load Rebalancing: Offload {emp.Name}",
                        Department = emp.Department,
                        MetricReference = $"{emp.Name} is logging {emp.TotalHours} weekly hours",
                        ActionablePlan = $"Reallocate active work order '{targetTask.Notes}' from {emp.Name} ({emp.TotalHours} hrs) to {bestHelper.Name} ({bestHelper.TotalHours} hrs) inside the {emp.Department} queue. This immediately mitigates fatigue and reduces department delivery risk.",
                        Severity = emp.TotalHours > 50 ? "Critical" : "High",
                        Status = GetStoredStatus(recId, "Pending"),
                        RiskSource = $"Overloaded Employee - {emp.Name} ({emp.TotalHours} hrs, {emp.ActiveTasks} tasks)",
                        RecommendedAction = $"Reassign task '{targetTask.Notes}' to {bestHelper.Name}",
                        Owner = bestHelper.Name,
                        ExpectedImpactPercent = Math.Min(45, (int)Math.Round((double)targetTask.HoursWorked / emp.TotalHours * 100)),
                        Category = "Reassign overloaded employee tasks"
                    });
                }
            }

            // 2. Resolve SLA breach incidents
            var breachedTasks = activeTasks.Where(t => t.SlaBreached && t.Status != "Completed").ToList();
            foreach (var task in breachedTasks)
            {
                var recId = $"rec_sla_mit_{task.Id}";
                recommendations.Add(new Recommendation
                {
                    Id = recId,
                    Title = $"SLA Recovery Action: Re-prioritize Task for {task.EmployeeName}",
                    Department = task.Department,
                    MetricReference = $"SLA Timeline violated: Cumulative hours {task.HoursWorked} logged",
                    ActionablePlan = $"Deploy immediate supervision/backup to assist {task.EmployeeName} in completing pending ticket '{task.Notes}'. Recommend direct contact with core clients to push deliverable windows.",
                    Severity = task.Priority == "Critical" ? "Critical" : "High",
                    Status = GetStoredStatus(recId, "Pending"),
                    RiskSource = $"SLA Breach - Ticket #{task.Id} assigned to {task.EmployeeName}",
                    RecommendedAction = $"Prioritize and support ticket completion with expert backup for {task.EmployeeName}",
                    Owner = task.EmployeeName,
                    ExpectedImpactPercent = 75,
                    Category = "Resolve SLA breach incidents"
                });
            }

            // 3. Reduce delivery delay risk
            var deliveryRiskTasks = activeTasks.Where(t => t.Priority == "Critical" && t.Status != "Completed").ToList();
            foreach (var task in deliveryRiskTasks)
            {
                var recId = $"rec_delay_{task.Id}";
                recommendations.Add(new Recommendation
                {
                    Id = recId,
                    Title = $"Mitigate Delay Risk: {task.Notes}",
                    Department = task.Department,
                    MetricReference = $"Pending Critical Item: {task.HoursWorked} hours logged",
                    ActionablePlan = $"Set up hourly checkpoint reviews for task '{task.Notes}' owned by {task.EmployeeName} to preempt project delays inside the {task.Department} pipeline.",
                    Severity = "High",
                    Status = GetStoredStatus(recId, "Pending"),
                    RiskSource = $"High Delay Threat - {task.Notes} (Critical Priority)",
                    RecommendedAction = $"Introduce milestone tracking checkpoints and optimize query/network states if blocking.",
                    Owner = "Operations Manager",
                    ExpectedImpactPercent = 60,
                    Category = "Reduce delivery delay risk"
                });
            }

            // 4. Stabilize department workload
            var uniqueDepts = activeTasks.Select(t => t.Department).Where(d => !string.IsNullOrEmpty(d)).Distinct().ToList();
            foreach (var dept in uniqueDepts)
            {
                var deptTasks = activeTasks.Where(t => t.Department == dept).ToList();
                int incompleteCount = deptTasks.Count(t => t.Status != "Completed");
                int totalHours = deptTasks.Sum(t => t.HoursWorked);

                if (totalHours > 80 && incompleteCount > 2)
                {
                    var recId = $"rec_dept_risk_{dept.Replace(" ", "_").ToLower()}";
                    recommendations.Add(new Recommendation
                    {
                        Id = recId,
                        Title = $"Operational Reinforcements: {dept} Queue",
                        Department = dept,
                        MetricReference = $"{incompleteCount} active tasks logging {totalHours} total effort hours in department",
                        ActionablePlan = $"Establish a dedicated daily operations review for the {dept} department. Authorize secondary supervisor oversight or approve auxiliary staff overtime to address the capacity deficit.",
                        Severity = "High",
                        Status = GetStoredStatus(recId, "Pending"),
                        RiskSource = $"Department Congestion - {dept} ({totalHours} total hours)",
                        RecommendedAction = $"Redistribute department workload or deploy temporary auxiliary staff.",
                        Owner = "Operations Lead",
                        ExpectedImpactPercent = 40,
                        Category = "Stabilize department workload"
                    });
                }
            }

            // Fallback default recommendation if empty
            if (!recommendations.Any())
            {
                var recId = "rec_def_general";
                recommendations.Add(new Recommendation
                {
                    Id = recId,
                    Title = "Active Systems Alignment & Queue Monitoring",
                    Department = "Operations",
                    MetricReference = "All queues operating within nominal enterprise SLA parameters",
                    ActionablePlan = "Validate active sync paths across all ERP endpoints and run system log optimizations. Staff allocations are currently balanced perfectly.",
                    Severity = "Low",
                    Status = GetStoredStatus(recId, "Pending"),
                    RiskSource = "System Calibrated Stable State",
                    RecommendedAction = "Standard maintenance review on ERP task records database",
                    Owner = "Operations Manager",
                    ExpectedImpactPercent = 105,
                    Category = "Stabilize department workload"
                });
            }

            return recommendations.OrderBy(r => GetSeverityRank(r.Severity)).ToList();
        }

        private static string GetStoredStatus(string id, string defaultStatus)
        {
            lock (LockObj)
            {
                return StatusStore.TryGetValue(id, out var status) ? status : defaultStatus;
            }
        }

        private static int GetSeverityRank(string severity)
        {
            return severity switch
            {
                "Critical" => 1,
                "High" => 2,
                "Medium" => 3,
                "Low" => 4,
                _ => 5
            };
        }
    }
}
