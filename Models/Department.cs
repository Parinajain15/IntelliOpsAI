using System;

namespace IntelliOps.Models
{
    public class Department
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public int HealthScore { get; set; }
        public string RiskLevel { get; set; } = "Low";
        public string Manager { get; set; } = string.Empty;
        public int CompletionRate { get; set; }
        public int ActiveAlertsCount { get; set; }
        public int WorkloadScore { get; set; }
    }
}
