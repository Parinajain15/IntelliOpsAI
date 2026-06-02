using System;
using System.Collections.Generic;

namespace IntelliOps.Models
{
    public class Alert
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public string Severity { get; set; } = "Moderate"; // Low, Moderate, High, Critical
        public string Description { get; set; } = string.Empty;
        public string AssignedOwner { get; set; } = string.Empty;
        public string Status { get; set; } = "Open"; // Open, In Progress, Resolved
        public List<AlertComment> Comments { get; set; } = new List<AlertComment>();
        public string ResolutionNotes { get; set; } = string.Empty;
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        public DateTime? ResolvedDate { get; set; }
    }

    public class AlertComment
    {
        public string User { get; set; } = string.Empty;
        public string Text { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}
