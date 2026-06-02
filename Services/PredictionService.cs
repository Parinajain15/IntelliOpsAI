using System;
using System.Collections.Generic;
using System.Linq;
using IntelliOps.Models;

namespace IntelliOps.Services
{
    public class PredictionService
    {
        public List<PredictionResult> PredictRisks(
            List<Employee> employees, 
            List<TaskRecord> tasks, 
            List<Department> departments)
        {
            var predictions = new List<PredictionResult>();

            if (employees == null || tasks == null || departments == null) return predictions;

            // Prediction 1: Future SLA Breaches based on High Priority pending backlog
            foreach (var dept in departments)
            {
                int pendingHigh = tasks.Count(t => t.Department == dept.Name && t.Status != "Completed" && (t.Priority == "High" || t.Priority == "Critical"));
                int staffCount = employees.Count(e => e.Department == dept.Name);

                if (pendingHigh > 0 && staffCount > 0)
                {
                    double loadRatio = (double)pendingHigh / staffCount;
                    int probability = (int)Math.Round(Math.Min(98, loadRatio * 35 + 20));

                    if (probability > 40)
                    {
                        predictions.Add(new PredictionResult
                        {
                            Id = $"pred_sla_{dept.Id}",
                            TargetType = "SLA Breach",
                            TargetName = dept.Name,
                            Probability = probability,
                            Timeframe = "Next 5 Days",
                            KeyFactor = $"Unresolved high-priority backlog of {pendingHigh} active tasks across {staffCount} department resources",
                            CalculationExplanation = "Formula: P = min(98, (HighPriorityTaskCount / CapacityCount) * 35 + BaseModifier[20%]). Imbalanced backlog pressure."
                        });
                    }
                }
            }

            // Prediction 2: Completion Rate Decline due to over-allocated units
            foreach (var emp in employees)
            {
                if (emp.ActiveTasks >= 4 && emp.TotalHours > 42)
                {
                    int prob = (int)Math.Round(Math.Min(95.0, (emp.ActiveTasks * 15.0) + (emp.TotalHours - 40.0) * 2.0));
                    predictions.Add(new PredictionResult
                    {
                        Id = $"pred_comp_{emp.Id}",
                        TargetType = "Completion Decline",
                        TargetName = emp.Department,
                        Probability = prob,
                        Timeframe = "Next 14 Days",
                        KeyFactor = $"{emp.Name} is severely multi-tasked ({emp.ActiveTasks} active tasks) with high work fatigue ({emp.TotalHours} hrs)",
                        CalculationExplanation = "Formula: P = min(95, (ActiveTasks * 15) + (FatigueDelta * 2)). Individual task overloading causes scheduling logjams."
                    });
                }
            }

            // Prediction 3: Backlog escalation probability
            int criticalPending = tasks.Count(t => t.Status != "Completed" && t.Priority == "Critical");
            if (criticalPending >= 2)
            {
                predictions.Add(new PredictionResult
                {
                    Id = "pred_escalation_global",
                    TargetType = "Escalation Probability",
                    TargetName = "Enterprise-wide",
                    Probability = Math.Min(90, criticalPending * 25),
                    Timeframe = "72 Hours",
                    KeyFactor = $"{criticalPending} global critical items currently flagged as Pending/In Progress",
                    CalculationExplanation = "Formula: P = min(90, CriticalPendingCount * 25). Accumulation of unmitigated high-impact alerts."
                });
            }

            return predictions;
        }
    }
}
