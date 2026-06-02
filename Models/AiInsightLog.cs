using System;
using System.Collections.Generic;

namespace IntelliOps.Models
{
    public class AiInsightLog
    {
        public string Id { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string ExecutiveSummary { get; set; } = string.Empty;
        public List<string> TopRisks { get; set; } = new List<string>();
        public List<string> DepartmentIssues { get; set; } = new List<string>();
        public List<string> SapConcerns { get; set; } = new List<string>();
        public List<string> SlaConcerns { get; set; } = new List<string>();
        public List<string> Bottlenecks { get; set; } = new List<string>();
        public List<string> RecommendedActions { get; set; } = new List<string>();
        public List<string> PriorityPlan24h { get; set; } = new List<string>();
    }
}
