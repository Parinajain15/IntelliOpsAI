using System;

namespace IntelliOps.Models
{
    public class OperationalLog
    {
        public string Id { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string Type { get; set; } = "issue"; // incident, delay, overload, issue, escalation, risk note
        public string Message { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public string Priority { get; set; } = "Medium";
        public string ReportedBy { get; set; } = string.Empty;
    }
}
