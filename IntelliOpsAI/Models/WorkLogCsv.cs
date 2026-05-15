namespace IntelliOpsAI.Models
{
    public class WorkLogCsv
    {
        public string EmployeeName { get; set; }

        public string Department { get; set; }

        public string System { get; set; }

        public string TaskType { get; set; }

        public int HoursWorked { get; set; }

        public string Status { get; set; }

        public string Location { get; set; }

        public DateTime Date { get; set; }
    }
}