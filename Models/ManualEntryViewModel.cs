using System.Collections.Generic;

namespace IntelliOps.Models
{
    public class ManualEntryViewModel
    {
        public List<string> Departments { get; set; } = new();
        public List<string> Employees { get; set; } = new();
        public List<ManualTaskViewModel> Tasks { get; set; } = new();
    }

    public class ManualTaskViewModel
    {
        public string Id { get; set; } = string.Empty;
        public string Notes { get; set; } = string.Empty;
        public string AssignedEmployeeName { get; set; } = string.Empty;
        public string DepartmentName { get; set; } = string.Empty;
        public string PriorityLevel { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public int HoursWorked { get; set; }
    }
}
