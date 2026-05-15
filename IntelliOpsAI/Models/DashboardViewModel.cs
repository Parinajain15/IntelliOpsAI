namespace IntelliOpsAI.Models
{
    public class DashboardViewModel
    {
        public int TotalLogs { get; set; }
        public int TotalHours { get; set; }
        public int Completed { get; set; }
        public int Pending { get; set; }

        public string[] SystemLabels { get; set; }
        public int[] SystemValues { get; set; }

        public string AIInsight { get; set; }
    }
}