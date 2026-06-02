using System;

namespace IntelliOps.Models
{
    public class AuditLog
    {
        public string Id { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string Action { get; set; } = string.Empty; // GET_METRICS, ALERT_UPDATE, SAP_SYNC, CSV_UPLOAD, etc.
        public string User { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty; // Director, Operations Manager, Team Lead
        public string Details { get; set; } = string.Empty;
    }
}
