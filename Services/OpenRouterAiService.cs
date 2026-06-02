using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using IntelliOps.Models;

namespace IntelliOps.Services
{
    public class OpenRouterAiService
    {
        private static readonly HttpClient _httpClient = new HttpClient();

        public async Task<AiInsightLog> GenerateExecutiveBriefingAsync(
            int healthScore, 
            int breachRate, 
            int alertCount, 
            List<Employee> employees,
            List<TaskRecord> tasks,
            List<Alert> alerts,
            List<SapConnector> saps,
            string? apiKey)
        {
            var briefing = new AiInsightLog
            {
                Id = $"brief_{Guid.NewGuid().ToString().Substring(0, 8)}",
                Timestamp = DateTime.UtcNow
            };

            int completedCount = tasks.Count(t => t.Status == "Completed");
            int completedRate = tasks.Any() ? (int)Math.Round((double)completedCount / tasks.Count * 100) : 0;

            if (string.IsNullOrWhiteSpace(apiKey) || apiKey == "MY_GEMINI_API_KEY")
            {
                // Local Heuristic NLG (Natural Language Generation) utilizing the live uploaded / manual data
                briefing.ExecutiveSummary = $"Operational intelligence platform compiled state scored at **{healthScore}/100** based on **{tasks.Count} live active operational records**. " +
                                           $"Overall work completion rate resides at **{completedRate}%**, and standard SLA queue breaches represent **{breachRate}%** of the current dispatch pool. " +
                                           $"There are currently **{alertCount} open alerts** demanding executive action.";

                // Top Risks (Dynamic from overwork & SLA breaches)
                var topRisks = new List<string>();
                var overworked = employees.Where(e => e.TotalHours > 40).OrderByDescending(e => e.TotalHours).Take(2).ToList();
                foreach (var emp in overworked)
                {
                    topRisks.Add($"Critical Workload Fatigue: {emp.Name} in {emp.Department} is currently logging {emp.TotalHours} operational hours, creating an acute resource deficit risk.");
                }
                var activeBreached = tasks.Where(t => t.SlaBreached && t.Status != "Completed").Take(2).ToList();
                foreach (var ab in activeBreached)
                {
                    topRisks.Add($"Severe SLA Breach: Work order '{ab.Notes}' assigned to {ab.EmployeeName} in {ab.Department} has violated delivery thresholds.");
                }
                if (!topRisks.Any())
                {
                    topRisks.Add("Operational Risks: No immediate critical fatigue or severe SLA breaches detected. Operations are in steady-state.");
                }
                briefing.TopRisks = topRisks;

                // Department Issues (Dynamic)
                var deptIssues = new List<string>();
                var depts = tasks.Select(t => t.Department).Where(d => !string.IsNullOrEmpty(d)).Distinct().ToList();
                foreach (var dept in depts)
                {
                    var dTasks = tasks.Where(t => t.Department == dept).ToList();
                    int dIncomplete = dTasks.Count(t => t.Status != "Completed");
                    int dHourSum = dTasks.Sum(t => t.HoursWorked);
                    if (dHourSum > 100 || dIncomplete > 2)
                    {
                        deptIssues.Add($"Queue Congestion: {dept} has {dIncomplete} outstanding tickets with an aggregate effort of {dHourSum} hours.");
                    }
                }
                if (!deptIssues.Any())
                {
                    deptIssues.Add("All departmental queues are operating with healthy, balanced staff metrics.");
                }
                briefing.DepartmentIssues = deptIssues;

                // SAP Connections (Dynamic)
                var sapConcerns = new List<string>();
                var fails = saps.Where(s => s.Status != "Connected").ToList();
                foreach (var f in fails)
                {
                    sapConcerns.Add($"Connector '{f.Name}' is showing a status of '{f.Status}' in '{f.Module}' module.");
                }
                if (!sapConcerns.Any())
                {
                    sapConcerns.Add("All system integrations and data pipeline connectors show stable, active handshakes.");
                }
                briefing.SapConcerns = sapConcerns;

                // SLA Concerns (Dynamic)
                var slaConcerns = new List<string>();
                if (activeBreached.Any())
                {
                    slaConcerns.Add($"{tasks.Count(t => t.SlaBreached && t.Status != "Completed")} active tasks have currently breached SLA limits ({breachRate}% breach velocity).");
                }
                else
                {
                    slaConcerns.Add("All active tasks are currently tracking within their soft delivery timelines.");
                }
                briefing.SlaConcerns = slaConcerns;

                // Resource Bottlenecks (Dynamic)
                var bottlenecks = new List<string>();
                foreach (var emp in overworked)
                {
                    bottlenecks.Add($"Resource Overload Bottleneck: {emp.Name} is running overcapacity at {emp.TotalHours} working hours in the {emp.Department} queue.");
                }
                if (!bottlenecks.Any())
                {
                    bottlenecks.Add("All staff member workloads are balanced and operating under target safety limits.");
                }
                briefing.Bottlenecks = bottlenecks;

                // Recommended Actions (Dynamic)
                var recActions = new List<string>();
                if (overworked.Any())
                {
                    var emp = overworked.First();
                    recActions.Add($"De-congest {emp.Department} backlog: Re-allocate workload from {emp.Name} ({emp.TotalHours} hrs) to less-utilized staff.");
                }
                if (activeBreached.Any())
                {
                    var ab = activeBreached.First();
                    recActions.Add($"Deploy supervision: Assign additional resources to unblock execution on breaching file '{ab.Notes}' under {ab.EmployeeName}.");
                }
                recActions.Add("Maintain active operational integrity checks on core external databases.");
                briefing.RecommendedActions = recActions;

                // Priority Plan 24h (Dynamic)
                var priorityPlan = new List<string>();
                if (activeBreached.Any())
                {
                    priorityPlan.Add($"1. Expedite critical breached item '{activeBreached.First().Notes}' with priority re-assignment.");
                }
                else
                {
                    priorityPlan.Add("1. Audit all open tickets to ensure compliance with soft capacity rules.");
                }
                if (overworked.Any())
                {
                    priorityPlan.Add($"2. Re-prioritize effort targets for overworked employee {overworked.First().Name}.");
                }
                else
                {
                    priorityPlan.Add("2. Run baseline performance assessments across staff teams.");
                }
                priorityPlan.Add("3. Review real-time diagnostic reporting to verify live operations ledger alignment.");
                briefing.PriorityPlan24h = priorityPlan;

                return briefing;
            }

            try
            {
                var calculatedContext = new
                {
                    healthScore = healthScore,
                    slaBreachRate = breachRate,
                    activeAlertsCount = alertCount,
                    tasksCount = tasks.Count,
                    completedRate = completedRate,
                    sapFails = saps.Count(s => s.Status == "Error"),
                    connectors = saps.Select(s => new { s.Name, s.Status, s.Module }),
                    employeesOverload = employees.Where(e => e.TotalHours > 40).Select(e => new { e.Name, e.TotalHours, e.Department }),
                    activeBreachedTasks = tasks.Where(t => t.SlaBreached && t.Status != "Completed").Select(t => new { t.Notes, t.EmployeeName, t.Department })
                };

                string contextDataJson = JsonSerializer.Serialize(calculatedContext);

                // Prepare request payload for OpenRouter
                var requestBody = new
                {
                    model = "google/gemini-2.5-flash", // standard modern high-speed C-suite agent model
                    messages = new[]
                    {
                        new { role = "user", content = $@"Generate an enterprise-grade C-Suite Executive Briefing strictly in JSON for corporate operations dashboard.
Score: {healthScore}/100
SLA Breaches: {breachRate}%
Alerts Count: {alertCount}
Historical Context JSON:
{contextDataJson}

Output strictly RAW JSON matching this structure:
{{
  ""executiveSummary"": ""High level corporate summary text using hard metrics like {healthScore}/100"",
  ""topRisks"": [""Risk 1"", ""Risk 2""],
  ""departmentIssues"": [""Issue 1"", ""Issue 2""],
  ""sapConcerns"": [""Concern 1""],
  ""slaConcerns"": [""SLA item 1""],
  ""bottlenecks"": [""Bottleneck 1""],
  ""recommendedActions"": [""Rec 1"", ""Rec 2""],
  ""priorityPlan24h"": [""Plan 1"", ""Plan 2""]
}}" }
                    },
                    temperature = 0.15
                };

                var requestJson = JsonSerializer.Serialize(requestBody);
                using (var request = new HttpRequestMessage(HttpMethod.Post, "https://openrouter.ai/api/v1/chat/completions"))
                {
                    request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
                    request.Headers.Add("HTTP-Referer", "http://localhost:3000"); 
                    request.Headers.Add("X-Title", "IntelliOps AI");
                    request.Content = new StringContent(requestJson, Encoding.UTF8, "application/json");

                    var response = await _httpClient.SendAsync(request);
                    if (response.IsSuccessStatusCode)
                    {
                        var responseContent = await response.Content.ReadAsStringAsync();
                        using (var doc = JsonDocument.Parse(responseContent))
                        {
                            var chatChoice = doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? "{}";
                            // Clean markdown wraps if the model adds them
                            if (chatChoice.StartsWith("```json") && chatChoice.EndsWith("```"))
                            {
                                chatChoice = chatChoice.Substring(7, chatChoice.Length - 10).Trim();
                            }
                            else if (chatChoice.StartsWith("```") && chatChoice.EndsWith("```"))
                            {
                                chatChoice = chatChoice.Substring(3, chatChoice.Length - 6).Trim();
                            }

                            using (var innerDoc = JsonDocument.Parse(chatChoice))
                            {
                                var root = innerDoc.RootElement;
                                briefing.ExecutiveSummary = root.GetProperty("executiveSummary").GetString() ?? "";
                                briefing.TopRisks = ParseJsonArrayProperty(root, "topRisks");
                                briefing.DepartmentIssues = ParseJsonArrayProperty(root, "departmentIssues");
                                briefing.SapConcerns = ParseJsonArrayProperty(root, "sapConcerns");
                                briefing.SlaConcerns = ParseJsonArrayProperty(root, "slaConcerns");
                                briefing.Bottlenecks = ParseJsonArrayProperty(root, "bottlenecks");
                                briefing.RecommendedActions = ParseJsonArrayProperty(root, "recommendedActions");
                                briefing.PriorityPlan24h = ParseJsonArrayProperty(root, "priorityPlan24h");
                            }
                        }
                    }
                    else
                    {
                        throw new Exception($"OpenRouter API responded with status code: {response.StatusCode}");
                    }
                }
            }
            catch (Exception ex)
            {
                // Fall back gracefully with detail using live data to generate fallback details (NO hardcoded names)
                briefing.ExecutiveSummary = $"Operational compilation completed, but AI Gateway experienced an aggregation warning: {ex.Message}. Local NLG reporting was deployed.";
                
                var topRisks = new List<string>();
                var overworked = employees.Where(e => e.TotalHours > 40).OrderByDescending(e => e.TotalHours).Take(1).ToList();
                if (overworked.Any())
                {
                    topRisks.Add($"Resource Overload Anomaly: {overworked.First().Name} workload is at {overworked.First().TotalHours} logged hours.");
                }
                else
                {
                    topRisks.Add("No acute human resources overload trends identified in database.");
                }
                briefing.TopRisks = topRisks;
                
                briefing.DepartmentIssues = new List<string> { "Localized performance analysis generated in backup state" };
                
                var fails = saps.Where(s => s.Status != "Connected").ToList();
                briefing.SapConcerns = fails.Any() 
                    ? fails.Select(f => $"Connector '{f.Name}' reports connection state '{f.Status}'").ToList()
                    : new List<string> { "All external system integrations reporting positive handshakes." };

                briefing.SlaConcerns = new List<string> { $"SLA safety warnings monitored at {breachRate}% threshold values." };
                briefing.Bottlenecks = overworked.Any()
                    ? new List<string> { $"Workload congestion localized under overloaded employee {overworked.First().Name}." }
                    : new List<string> { "System resources balanced across teams." };

                briefing.RecommendedActions = overworked.Any()
                    ? new List<string> { $"Initiate capacity re-allocation protocols from overloaded employee {overworked.First().Name}." }
                    : new List<string> { "No structural redistributions required." };

                briefing.PriorityPlan24h = new List<string> { "1. Maintain vigilant queue health checks across active teams." };
            }

            return briefing;
        }

        private List<string> ParseJsonArrayProperty(JsonElement element, string propName)
        {
            var list = new List<string>();
            if (element.TryGetProperty(propName, out var prop) && prop.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in prop.EnumerateArray())
                {
                    list.Add(item.GetString() ?? "");
                }
            }
            return list;
        }
    }
}
