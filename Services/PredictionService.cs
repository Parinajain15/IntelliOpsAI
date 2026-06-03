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

        public List<ProjectedRiskPoint> GenerateRiskProjections(
            List<DepartmentRiskForecast> depts,
            List<EmployeeBurnoutForecast> employees,
            List<SlaFailureForecast> slas,
            List<DeliveryDelayForecast> delays,
            int activeAlertsCount,
            bool hasLiveData)
        {
            var points = new List<ProjectedRiskPoint>();

            double avgDeptProb = depts != null && depts.Any() ? depts.Average(d => d.Probability) : 45.0;
            double avgBurnoutProb = employees != null && employees.Any() ? employees.Average(e => e.Probability) : 38.0;
            double avgSlaProb = slas != null && slas.Any() ? slas.Average(s => s.Probability) : 42.0;
            double avgDelayProb = delays != null && delays.Any() ? delays.Average(d => d.Probability) : 35.0;

            if (!hasLiveData)
            {
                activeAlertsCount = 4;
            }

            for (int i = 1; i <= 7; i++)
            {
                var dt = DateTime.UtcNow.AddDays(i);

                // Simulation projection trends: Unresolved issues increase risk, clean registers drop it
                double trendShift = 1.0 + (i * 0.02 * activeAlertsCount) - (activeAlertsCount == 0 ? i * 0.012 : 0);

                // Weekday Stress Multipliers
                double weekdayBurnoutMult = GetWeekdayBurnoutFactor(dt.DayOfWeek);
                double weekdaySlaMult = GetWeekdaySlaFactor(dt.DayOfWeek);
                double weekdayDelayMult = GetWeekdayDelayFactor(dt.DayOfWeek);
                double weekdayDeptMult = GetWeekdayDeptFactor(dt.DayOfWeek);

                // Fatigue accrual
                double fatigueAccrual = 1.0 + (i * 0.010);

                // SLA triage cycle
                double slaTriageCycle = 1.0 + 0.07 * Math.Sin(i * 0.85);

                int rIndex = (int)Math.Clamp(avgDeptProb * trendShift * weekdayDeptMult, 10, 97);
                int bIndex = (int)Math.Clamp(avgBurnoutProb * trendShift * weekdayBurnoutMult * fatigueAccrual, 10, 97);
                int sIndex = (int)Math.Clamp(avgSlaProb * trendShift * weekdaySlaMult * slaTriageCycle, 10, 97);
                int dIndex = (int)Math.Clamp(avgDelayProb * trendShift * weekdayDelayMult * (1.1 - (i * 0.01)), 10, 97);

                points.Add(new ProjectedRiskPoint
                {
                    DayName = dt.ToString("ddd dd MMM") + $" (D+{i})",
                    ProjectedDate = dt,
                    RiskIndex = rIndex,
                    BurnoutIndex = bIndex,
                    SlaIndex = sIndex,
                    DelayIndex = dIndex
                });
            }

            return points;
        }

        private double GetWeekdayBurnoutFactor(DayOfWeek day)
        {
            return day switch
            {
                DayOfWeek.Monday => 0.88,
                DayOfWeek.Tuesday => 0.96,
                DayOfWeek.Wednesday => 1.04,
                DayOfWeek.Thursday => 1.12,
                DayOfWeek.Friday => 1.20,
                DayOfWeek.Saturday => 0.65,
                DayOfWeek.Sunday => 0.72,
                _ => 1.0
            };
        }

        private double GetWeekdaySlaFactor(DayOfWeek day)
        {
            return day switch
            {
                DayOfWeek.Monday => 1.02,
                DayOfWeek.Tuesday => 1.08,
                DayOfWeek.Wednesday => 1.14,
                DayOfWeek.Thursday => 1.05,
                DayOfWeek.Friday => 0.95,
                DayOfWeek.Saturday => 0.70,
                DayOfWeek.Sunday => 0.85,
                _ => 1.0
            };
        }

        private double GetWeekdayDelayFactor(DayOfWeek day)
        {
            return day switch
            {
                DayOfWeek.Monday => 0.95,
                DayOfWeek.Tuesday => 1.10,
                DayOfWeek.Wednesday => 1.15,
                DayOfWeek.Thursday => 1.08,
                DayOfWeek.Friday => 0.90,
                DayOfWeek.Saturday => 0.60,
                DayOfWeek.Sunday => 0.75,
                _ => 1.0
            };
        }

        private double GetWeekdayDeptFactor(DayOfWeek day)
        {
            return day switch
            {
                DayOfWeek.Monday => 0.90,
                DayOfWeek.Tuesday => 1.02,
                DayOfWeek.Wednesday => 1.08,
                DayOfWeek.Thursday => 1.10,
                DayOfWeek.Friday => 1.05,
                DayOfWeek.Saturday => 0.60,
                DayOfWeek.Sunday => 0.70,
                _ => 1.0
            };
        }
    }
}
