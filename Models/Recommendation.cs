using System;

namespace IntelliOps.Models
{
    public class Recommendation
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public string MetricReference { get; set; } = string.Empty;
        public string ActionablePlan { get; set; } = string.Empty;
        public string Severity { get; set; } = "High"; // Low, Medium, High, Critical
        public string Status { get; set; } = "Open"; // Open, Executed, Dismissed, Pending, In Progress, Completed
        public string RiskSource { get; set; } = string.Empty;
        public string RecommendedAction { get; set; } = string.Empty;
        public string Owner { get; set; } = string.Empty;
        public int ExpectedImpactPercent { get; set; } = 0;
        public string Category { get; set; } = string.Empty;
    }
}
