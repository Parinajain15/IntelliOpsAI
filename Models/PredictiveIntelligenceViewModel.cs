using System;
using System.Collections.Generic;

namespace IntelliOps.Models
{
    public class PredictiveIntelligenceViewModel
    {
        public List<DepartmentRiskForecast> DepartmentForecasts { get; set; } = new();
        public List<EmployeeBurnoutForecast> EmployeeForecasts { get; set; } = new();
        public List<SlaFailureForecast> SlaForecasts { get; set; } = new();
        public List<DeliveryDelayForecast> DeliveryForecasts { get; set; } = new();

        public List<FutureRiskRecord> TopFutureRisks { get; set; } = new();
        public List<ProjectedRiskPoint> ProjectedRiskTrend { get; set; } = new();
        public ExecutivePredictionSummary ExecutiveSummary { get; set; } = new();
        public string ActiveUserRole { get; set; } = "Team Lead";
    }

    public class ForecastBase
    {
        public string TargetName { get; set; } = string.Empty;
        public string RiskLevel { get; set; } = "Low"; // Low, Medium, High, Critical
        public int Probability { get; set; } // % 0-100
        public int Confidence { get; set; } // % 0-100
        public string PrimaryDriver { get; set; } = string.Empty;
        public string RecommendedAction { get; set; } = string.Empty;
    }

    public class DepartmentRiskForecast : ForecastBase
    {
        public int ActiveAlerts { get; set; }
        public int WorkloadScore { get; set; }
        public int AverageHours { get; set; }
    }

    public class EmployeeBurnoutForecast : ForecastBase
    {
        public string EmployeeId { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public int HoursWorked { get; set; }
        public int ActiveTasks { get; set; }
    }

    public class SlaFailureForecast : ForecastBase
    {
        public string DepartmentName { get; set; } = string.Empty;
        public int PendingTasks { get; set; }
        public int SlaBreaches { get; set; }
    }

    public class DeliveryDelayForecast : ForecastBase
    {
        public string DepartmentName { get; set; } = string.Empty;
        public int TotalActiveHours { get; set; }
        public int TaskCount { get; set; }
        public int LongRunningTaskCount { get; set; }
    }

    public class FutureRiskRecord
    {
        public string Type { get; set; } = string.Empty; // e.g., Employee Burnout, SLA Failure, Delivery Delay, Department Risk
        public string Target { get; set; } = string.Empty;
        public string RiskLevel { get; set; } = "Low";
        public int Probability { get; set; }
        public int DaysUntilImpact { get; set; } // (e.g. 1 to 7)
        public string Description { get; set; } = string.Empty;
    }

    public class ProjectedRiskPoint
    {
        public string DayName { get; set; } = string.Empty; // e.g., "Day +1", "Day +2", etc.
        public DateTime ProjectedDate { get; set; }
        public int RiskIndex { get; set; } // 0-100 scale overall
        public int BurnoutIndex { get; set; }
        public int SlaIndex { get; set; }
        public int DelayIndex { get; set; }
    }

    public class ExecutivePredictionSummary
    {
        public string Headline { get; set; } = string.Empty;
        public string Narrative { get; set; } = string.Empty;
        public string KeyStrategicTactics { get; set; } = string.Empty;
        public int CriticalRiskCount { get; set; }
        public int HighRiskCount { get; set; }
        public string OverallTrend { get; set; } = "Stable"; // "Stable", "Deteriorating", "Improving"
    }
}
