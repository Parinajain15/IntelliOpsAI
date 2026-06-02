using System;
using System.Collections.Generic;

namespace IntelliOps.Models
{
    public class ExecutiveDashboardViewModel
    {
        public int OperationalHealthScore { get; set; }
        public string HealthCategory { get; set; } = "Healthy";
        public int EmployeesCount { get; set; }
        public int TasksCount { get; set; }
        public int CompletionRate { get; set; }
        public int SlaBreachRate { get; set; }
        public int ActiveAlertsCount { get; set; }
        public int AverageHours { get; set; }
        public List<string> OverloadedDepartments { get; set; } = new List<string>();
        public List<DepartmentRisk> TopRisks { get; set; } = new List<DepartmentRisk>();
        public List<Anomaly> ActiveAnomalies { get; set; } = new List<Anomaly>();
        public List<PredictionResult> PredictedSlaRisks { get; set; } = new List<PredictionResult>();
        public List<Recommendation> RecommendationQueue { get; set; } = new List<Recommendation>();
        public List<Department> Departments { get; set; } = new List<Department>();
        public List<Employee> Employees { get; set; } = new List<Employee>();
        public List<OperationalLog> OperationalLogs { get; set; } = new List<OperationalLog>();
        public List<Alert> ActiveAlerts { get; set; } = new List<Alert>();
        public List<SapConnector> SapConnectors { get; set; } = new List<SapConnector>();
        public List<DataSource> DataSources { get; set; } = new List<DataSource>();
        public string ActiveUserRole { get; set; } = "Director"; // Director, Operations Manager, Team Lead
    }
}
