using System;
using System.Collections.Generic;

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

        public string SelectedDepartment { get; set; }

        public DateTime? StartDate { get; set; }

        public DateTime? EndDate { get; set; }

        public List<string> Departments { get; set; }

        public List<EmployeePerformance> TopEmployees { get; set; }

        // NEW TREND GRAPH DATA

        public List<string> TrendLabels { get; set; }

        public List<int> TrendValues { get; set; }
    }
}