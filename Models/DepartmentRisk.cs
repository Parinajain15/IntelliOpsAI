using System;

namespace IntelliOps.Models
{
    public class DepartmentRisk
    {
        public string Id { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public int Score { get; set; }
        public string Description { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty; // SLA, Workload, Resources
        public string Status { get; set; } = "Stable"; // Stable, Warning, Critical
    }
}
