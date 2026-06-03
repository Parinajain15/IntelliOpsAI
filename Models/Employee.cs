using System;

namespace IntelliOps.Models
{
    public class Employee
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public string Status { get; set; } = "Active";
        public int TotalHours { get; set; }
        public int ActiveTasks { get; set; }
    }
}
