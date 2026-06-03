using System;
using System.Collections.Generic;
using System.Linq;

namespace IntelliOps.Models
{
    public class ConsolidatedIncident
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public string Severity { get; set; } = "Moderate"; // Low, Moderate, High, Critical
        public string Description { get; set; } = string.Empty;
        public string AssignedOwner { get; set; } = string.Empty;
        public string Status { get; set; } = "Open"; // Open, In Progress, Resolved
        public List<Alert> Signals { get; set; } = new List<Alert>();
        public List<string> ContributingFactors { get; set; } = new List<string>();
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        public static List<ConsolidatedIncident> Consolidate(IEnumerable<Alert> alerts, List<Employee> employees = null)
        {
            var consolidated = new List<ConsolidatedIncident>();
            var activeAlerts = alerts.ToList();

            var empNames = employees?.Select(e => e.Name.ToLower().Trim()).ToHashSet() ?? new HashSet<string>();

            var groups = activeAlerts.GroupBy(a => {
                bool isEmployee = empNames.Contains(a.AssignedOwner.ToLower().Trim()) || 
                                  (!string.IsNullOrEmpty(a.AssignedOwner) && 
                                   a.AssignedOwner != "Operations Manager" && 
                                   a.AssignedOwner != "Unassigned" && 
                                   a.AssignedOwner != "Staff Resolver" &&
                                   !a.Title.Contains("Department Overload", StringComparison.OrdinalIgnoreCase));
                
                if (isEmployee)
                {
                    return $"Emp_{a.AssignedOwner.ToLower().Trim()}_{a.Department.ToLower().Trim()}";
                }
                else if (a.Title.Contains("Department Overload", StringComparison.OrdinalIgnoreCase))
                {
                    return $"Dept_{a.Department.ToLower().Trim()}";
                }
                else
                {
                    return $"Other_{a.Id}";
                }
            });

            foreach (var g in groups)
            {
                var signals = g.OrderByDescending(s => s.CreatedDate).ToList();
                if (!signals.Any()) continue;

                string firstId = signals.First().Id;
                string owner = signals.First().AssignedOwner;
                string dept = signals.First().Department;

                var factors = new List<string>();
                foreach (var sig in signals)
                {
                    string type = GetFactorType(sig.Title);
                    if (!factors.Contains(type))
                    {
                        factors.Add(type);
                    }
                }

                string severity = "Moderate";
                var severities = signals.Select(s => s.Severity).ToList();
                if (severities.Contains("Critical")) severity = "Critical";
                else if (severities.Contains("High")) severity = "High";
                else if (severities.Contains("Moderate")) severity = "Moderate";
                else if (severities.Contains("Low")) severity = "Low";

                string title = "";
                string desc = "";

                if (g.Key.StartsWith("Emp_"))
                {
                    title = $"Consolidated Operations Incident: {owner}";
                    desc = $"{owner} in {dept} is concurrently flagged with: {string.Join(" + ", factors)} warnings.";
                }
                else if (g.Key.StartsWith("Dept_"))
                {
                    title = $"Consolidated Department Overload: {dept}";
                    desc = $"The {dept} department exhibits elevated composite workload limits.";
                }
                else
                {
                    title = signals.First().Title;
                    desc = signals.First().Description;
                }

                string status = "Open";
                if (signals.All(s => s.Status == "Resolved")) status = "Resolved";
                else if (signals.Any(s => s.Status == "In Progress")) status = "In Progress";

                consolidated.Add(new ConsolidatedIncident
                {
                    Id = firstId,
                    Title = title,
                    Department = dept,
                    Severity = severity,
                    Description = desc,
                    AssignedOwner = owner,
                    Status = status,
                    Signals = signals,
                    ContributingFactors = factors,
                    CreatedDate = signals.Max(s => s.CreatedDate)
                });
            }

            return consolidated;
        }

        private static string GetFactorType(string title)
        {
            if (title.StartsWith("Critical Resource Burnout Risk", StringComparison.OrdinalIgnoreCase) || title.StartsWith("Resource Burnout Risk", StringComparison.OrdinalIgnoreCase))
                return "Burnout";
            if (title.StartsWith("SLA Breach", StringComparison.OrdinalIgnoreCase))
                return "SLA Breach";
            if (title.StartsWith("Delivery Risk Warning", StringComparison.OrdinalIgnoreCase))
                return "Workload Warning";
            if (title.StartsWith("Department Overload Risk", StringComparison.OrdinalIgnoreCase))
                return "Overload";
            return "Custom Alert";
        }
    }
}
