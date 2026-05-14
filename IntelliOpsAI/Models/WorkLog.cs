namespace IntelliOpsAI.Models
{
    public class WorkLog
    {
        public int Id { get; set; }

        public string EmployeeName { get; set; } = string.Empty;

        public string TaskName { get; set; } = string.Empty;

        public int HoursWorked { get; set; }

        public string Status { get; set; } = string.Empty;

        public DateTime Date { get; set; }
    }
}