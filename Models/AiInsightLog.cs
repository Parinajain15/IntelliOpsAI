using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

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

        // High-level C-Suite dynamic attributes persisted within ExecutiveSummary
        [NotMapped]
        public string Severity { get; set; } = "Medium";

        [NotMapped]
        public int ConfidenceScore { get; set; } = 85;

        [NotMapped]
        public string BusinessImpactAnalysis { get; set; } = string.Empty;

        public static string StripMarkdown(string text)
        {
            if (string.IsNullOrEmpty(text)) return string.Empty;
            // Remove markdown multi-asterisks (bold, italic, etc)
            text = text.Replace("**", "").Replace("*", "");
            // Remove markdown header prefixes
            text = text.Replace("###", "").Replace("##", "").Replace("#", "");
            // Remove markdown code blocks and ticks
            text = text.Replace("`", "");
            // Remove Markdown horizontal lines
            text = text.Replace("---", "");
            // Clean starting bullet markers like '- ', '* ', '+ '
            text = System.Text.RegularExpressions.Regex.Replace(text, @"^\s*[-*+]\s+", "", System.Text.RegularExpressions.RegexOptions.Multiline);
            return text.Trim();
        }

        private string _parsedSummary = string.Empty;
        private bool _isParsed = false;

        private void ParseData()
        {
            if (_isParsed) return;
            _isParsed = true;

            if (string.IsNullOrWhiteSpace(ExecutiveSummary))
            {
                _parsedSummary = string.Empty;
                Severity = "Low";
                ConfidenceScore = 80;
                BusinessImpactAnalysis = "No operational data imported to calculate high-fidelity impact assessments.";
                return;
            }

            if (ExecutiveSummary.TrimStart().StartsWith("{"))
            {
                try
                {
                    using (var doc = JsonDocument.Parse(ExecutiveSummary))
                    {
                        var root = doc.RootElement;
                        _parsedSummary = StripMarkdown(root.TryGetProperty("summary", out var sProp) ? sProp.GetString() ?? "" : "");
                        Severity = root.TryGetProperty("severity", out var sevProp) ? sevProp.GetString() ?? "Medium" : "Medium";
                        ConfidenceScore = root.TryGetProperty("confidence", out var cProp) ? cProp.GetInt32() : 85;
                        BusinessImpactAnalysis = StripMarkdown(root.TryGetProperty("impact", out var iProp) ? iProp.GetString() ?? "" : "");
                    }
                }
                catch
                {
                    _parsedSummary = StripMarkdown(ExecutiveSummary);
                    Severity = "Medium";
                    ConfidenceScore = 85;
                    BusinessImpactAnalysis = "Local heuristic fallback calculation executed because AI endpoint was unreachable.";
                }
            }
            else
            {
                _parsedSummary = StripMarkdown(ExecutiveSummary);
                ConfidenceScore = 80;

                bool hasWarnings = _parsedSummary.Contains("SLA", StringComparison.OrdinalIgnoreCase) || 
                                   _parsedSummary.Contains("breach", StringComparison.OrdinalIgnoreCase) || 
                                   _parsedSummary.Contains("unresolved", StringComparison.OrdinalIgnoreCase) ||
                                   _parsedSummary.Contains("burnout", StringComparison.OrdinalIgnoreCase);

                if (hasWarnings)
                {
                    Severity = "High";
                    BusinessImpactAnalysis = "Operational friction detected in active queues, with outstanding warnings introducing elevated SLA risk and resource stress.";
                }
                else
                {
                    Severity = "Low";
                    BusinessImpactAnalysis = "Operational metrics are tracking within expected enterprise parameters.";
                }
            }
        }

        [NotMapped]
        public string DisplayExecutiveSummary
        {
            get
            {
                ParseData();
                return string.IsNullOrEmpty(_parsedSummary) ? ExecutiveSummary : _parsedSummary;
            }
        }

        [NotMapped]
        public string DisplaySeverity
        {
            get
            {
                ParseData();
                return Severity;
            }
        }

        [NotMapped]
        public int DisplayConfidenceScore
        {
            get
            {
                ParseData();
                return ConfidenceScore;
            }
        }

        [NotMapped]
        public string DisplayBusinessImpactAnalysis
        {
            get
            {
                ParseData();
                return BusinessImpactAnalysis;
            }
        }

        public void SerializeExtraProperties(string summary, string severity, int confidence, string impact)
        {
            var cleanSummary = StripMarkdown(summary);
            var cleanImpact = StripMarkdown(impact);
            var payload = new
            {
                summary = cleanSummary,
                severity = severity,
                confidence = confidence,
                impact = cleanImpact
            };
            ExecutiveSummary = JsonSerializer.Serialize(payload);
            _parsedSummary = cleanSummary;
            Severity = severity;
            ConfidenceScore = confidence;
            BusinessImpactAnalysis = cleanImpact;
            _isParsed = true;
        }
    }
}
