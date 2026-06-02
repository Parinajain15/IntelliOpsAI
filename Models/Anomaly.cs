using System;

namespace IntelliOps.Models
{
    public class Anomaly
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public string Severity { get; set; } = "High"; // Low, Moderate, High, Critical
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string MetricName { get; set; } = string.Empty;
        public string DeviationValue { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }
}
