using System;

namespace IntelliOps.Models
{
    public class TaskRecord
    {
        public string Id { get; set; } = string.Empty;
        public string EmployeeName { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public string Status { get; set; } = "Pending"; // Pending, In Progress, Completed
        public int HoursWorked { get; set; }
        public bool SlaBreached { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string Priority { get; set; } = "Medium"; // Low, Medium, High, Critical
        public DateTime DueDate { get; set; } = DateTime.UtcNow.AddDays(2);
        public string Notes { get; set; } = string.Empty;
    }
}
