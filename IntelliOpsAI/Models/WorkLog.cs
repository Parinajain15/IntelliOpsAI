using System;

namespace IntelliOpsAI.Models
{
    public class WorkLog
    {
        public int Id { get; set; }

        public string EmployeeName { get; set; }

        // NEW
        public string Department { get; set; }

        public string TaskName { get; set; }

        public string System { get; set; }

        public int HoursWorked { get; set; }

        public string Status { get; set; }

        public DateTime Date { get; set; }
    }
}