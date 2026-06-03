using System;

namespace IntelliOps.Models
{
    public class PredictionResult
    {
        public string Id { get; set; } = string.Empty;
        public string TargetType { get; set; } = string.Empty; // SLA Breach, Completion Decline, Escalation
        public string TargetName { get; set; } = string.Empty; // Dept or Enterprise
        public int Probability { get; set; } // 0 - 100%
        public string Timeframe { get; set; } = string.Empty; // Next 5 Days, etc.
        public string KeyFactor { get; set; } = string.Empty;
        public string CalculationExplanation { get; set; } = string.Empty;
    }
}
