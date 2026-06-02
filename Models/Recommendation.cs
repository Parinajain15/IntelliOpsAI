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
        public string Status { get; set; } = "Open"; // Open, Executed, Dismissed
    }
}
