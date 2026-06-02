using System;
using System.Collections.Generic;
using System.Linq;
using IntelliOps.Models;

namespace IntelliOps.Services
{
    public class OperationalHealthService
    {
        public (int Score, string Category) CalculateHealthScore(
            List<TaskRecord> tasks, 
            List<Alert> alerts, 
            List<Employee> employees, 
            List<SapConnector> saps)
        {
            if (tasks == null || !tasks.Any())
            {
                return (100, "Healthy");
            }

            // 1. Completion Rate Factor (out of 35)
            int completedCount = tasks.Count(t => t.Status == "Completed");
            double completionRate = (double)completedCount / tasks.Count;
            double completionFactor = completionRate * 35;

            // 2. SLA Breach Penalties (max -25)
            int slaBreachedTasksCount = tasks.Count(t => t.SlaBreached && t.Status != "Completed");
            double slaBreachRate = (double)slaBreachedTasksCount / tasks.Count;
            double slaPenalty = Math.Min(25, slaBreachRate * 100);

            // 3. Active Alert Severity Penalty (max -20)
            int alertPenalty = 0;
            var activeAlerts = alerts.Where(a => a.Status != "Resolved").ToList();
            foreach (var alert in activeAlerts)
            {
                if (alert.Severity == "Critical") alertPenalty += 10;
                else if (alert.Severity == "High") alertPenalty += 6;
                else if (alert.Severity == "Moderate") alertPenalty += 3;
                else if (alert.Severity == "Low") alertPenalty += 1;
            }
            alertPenalty = Math.Min(20, alertPenalty);

            // 4. Workload Imbalance (max -10)
            int imbalancePenalty = 0;
            if (employees != null && employees.Any())
            {
                var hours = employees.Select(e => e.TotalHours).ToList();
                int maxHours = hours.Max();
                int minHours = hours.Min();
                if (maxHours - minHours > 35)
                {
                    imbalancePenalty = 10;
                }
                else if (maxHours - minHours > 20)
                {
                    imbalancePenalty = 5;
                }
            }

            // 5. Connection failures (max -10)
            int connPenalty = 0;
            if (saps != null)
            {
                int sapFails = saps.Count(s => s.Status == "Error");
                connPenalty = Math.Min(10, sapFails * 5);
            }

            // Aggregate Health Score
            int finalScore = (int)Math.Round(100 - slaPenalty - alertPenalty - imbalancePenalty - connPenalty);
            finalScore = Math.Max(12, Math.Min(100, finalScore));

            string category = "Healthy";
            if (finalScore >= 85) category = "Healthy";
            else if (finalScore >= 65) category = "Moderate";
            else if (finalScore >= 45) category = "Degraded";
            else category = "Critical";

            return (finalScore, category);
        }
    }
}
