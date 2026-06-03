using System;
using System.Collections.Generic;
using System.Linq;
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
        private readonly RiskEngineService _riskEngine = new RiskEngineService();
        private readonly PredictionService _predictionService = new PredictionService();

        public async Task<AiInsightLog> GenerateExecutiveBriefingAsync(
            int healthScore, 
            int breachRate, 
            int alertCount, 
            List<Employee> employees,
            List<TaskRecord> tasks,
            List<Alert> alerts,
            List<SapConnector> saps,
            List<Department> departments,
            string? apiKey)
        {
            var briefing = new AiInsightLog
            {
                Id = $"brief_{Guid.NewGuid().ToString().Substring(0, 8)}",
                Timestamp = DateTime.UtcNow
            };

            int completedCount = tasks.Count(t => t.Status == "Completed");
            int completedRate = tasks.Any() ? (int)Math.Round((double)completedCount / tasks.Count * 100) : 0;

            // Compute dynamic metrics from actual database context
            var deptRisks = _riskEngine.GetDepartmentRisks(departments, tasks, alerts);
            var highestRiskDeptObj = deptRisks.OrderByDescending(r => r.Score).FirstOrDefault();
            string highestRiskDeptName = highestRiskDeptObj != null && highestRiskDeptObj.Score > 15 
                ? $"{highestRiskDeptObj.Department} ({highestRiskDeptObj.Score}/100 Risk Score)" 
                : "None (Nominal Levels)";

            var overloadedEmpObj = employees.OrderByDescending(e => e.TotalHours).FirstOrDefault();
            string overloadedEmpName = overloadedEmpObj != null && overloadedEmpObj.TotalHours > 40
                ? $"{overloadedEmpObj.Name} in {overloadedEmpObj.Department} ({overloadedEmpObj.TotalHours} Hrs, {overloadedEmpObj.ActiveTasks} Active Tasks)"
                : "None (Within Limits)";

            var slaDepartments = tasks
                .Where(t => t.SlaBreached && t.Status != "Completed")
                .Select(t => t.Department)
                .Where(d => !string.IsNullOrEmpty(d))
                .Distinct()
                .ToList();
            string slaBreachedDeptsStr = slaDepartments.Any() 
                ? string.Join(", ", slaDepartments) 
                : "Zero SLA Breaches";

            double avgWorkloadVal = employees.Any() ? Math.Round(employees.Average(e => e.TotalHours), 1) : 0;
            string avgWorkloadStr = $"{avgWorkloadVal} Hrs/Staff Member";

            int incidentsCount = alertCount;
            
            var predictions = _predictionService.PredictRisks(employees, tasks, departments);
            var deliveryEscalations = predictions.Where(p => p.TargetType == "SLA Breach" || p.TargetType == "Escalation Probability").ToList();

            string calculatedSeverity = "Low";
            int activeSlaBreaches = tasks.Count(t => t.SlaBreached && t.Status != "Completed");
            int highRiskDeptCount = deptRisks.Count(r => r.Score > 50);
            int overloadedEmpCount = employees.Count(e => e.TotalHours > 40);

            if (activeSlaBreaches > 2 || highRiskDeptCount > 0 || overloadedEmpCount > 1 || breachRate > 20)
            {
                calculatedSeverity = "Critical";
            }
            else if (activeSlaBreaches > 0 || breachRate > 10 || overloadedEmpCount > 0)
            {
                calculatedSeverity = "High";
            }
            else if (incidentsCount > 0 || tasks.Any(t => t.Status != "Completed"))
            {
                calculatedSeverity = "Medium";
            }

            int baseConfidence = 65;
            int recordCountBoost = tasks.Count >= 15 ? 12 : (tasks.Count >= 8 ? 8 : (tasks.Count > 0 ? 4 : 0));
            int completenessBoost = (employees.Any() && departments.Any()) ? 10 : 0;
            int alertCoverageBoost = (alerts.Any() && !alerts.Any(a => string.IsNullOrEmpty(a.AssignedOwner) || a.AssignedOwner == "Unassigned")) ? 10 : 5;
            int predictionBoost = predictions.Count >= 2 ? 10 : (predictions.Any() ? 5 : 0);
            int computedConfidence = Math.Max(50, Math.Min(98, baseConfidence + recordCountBoost + completenessBoost + alertCoverageBoost + predictionBoost));

            if (string.IsNullOrWhiteSpace(apiKey) || apiKey == "MY_GEMINI_API_KEY")
            {
                int rawSignalsCount = alerts.Count(a => a.Status != "Resolved");
                // Local Heuristic NLG
                string summaryText = $"C-Suite operational briefing generated using {tasks.Count} synchronized records. " +
                                     $"Platform is currently performing at {healthScore}/100 Health, " +
                                     $"with a work completion rate of {completedRate}% and a queue breach rate of {breachRate}%. " +
                                     $"Currently, there are {incidentsCount} Active Incidents generated from {rawSignalsCount} underlying operational signals demanding immediate attention. " +
                                     $"The highest risk sector is {highestRiskDeptName}, while the chief labor bottleneck is {overloadedEmpName}.";

                string impactText = "";
                if (calculatedSeverity == "Critical" || healthScore < 50)
                {
                    impactText = $"Severe operational congestion in {highestRiskDeptName} and critical resource fatigue for {overloadedEmpName} " +
                                 $"represent immediate delivery threats, with {incidentsCount} active incidents (from {rawSignalsCount} signals) and {predictions.Count} predicted risks creating significant SLA vulnerabilities.";
                }
                else if (calculatedSeverity == "High" || healthScore < 80)
                {
                    impactText = $"Elevated queue delay indicators in {highestRiskDeptName} and labor overhead on {overloadedEmpName} " +
                                 $"pose moderate to high delivery risks. Corrective workload leveling is recommended to prevent SLA breaches.";
                }
                else
                {
                    impactText = $"Human-capital allocations and system queues are stable. All departments are tracking within enterprise expectations with a balanced {healthScore}/100 operational index.";
                }

                briefing.SerializeExtraProperties(summaryText, calculatedSeverity, computedConfidence, impactText);

                // Populate Key Risks
                var risksList = new List<string>();
                if (highestRiskDeptObj != null && highestRiskDeptObj.Score > 15)
                {
                    risksList.Add($"Highest Risk Department: {highestRiskDeptObj.Department} stands at {highestRiskDeptObj.Score}/100 risk limit ({highestRiskDeptObj.Description}).");
                }
                foreach (var pred in predictions.Take(2))
                {
                    risksList.Add($"Predicted Delivery Risk: {pred.TargetType} forecast for {pred.TargetName} - Probability: {pred.Probability}%. Factor: {pred.KeyFactor}");
                }
                if (!risksList.Any())
                {
                    risksList.Add("Stable Operations: No critical risks found across active departmental queues.");
                }
                briefing.TopRisks = risksList;

                // Populate Overloaded Employees
                var overloadList = new List<string>();
                var overworkedList = employees.Where(e => e.TotalHours > 40).OrderByDescending(e => e.TotalHours).Take(3).ToList();
                foreach (var emp in overworkedList)
                {
                    overloadList.Add($"{emp.Name} ({emp.Department}): Logging {emp.TotalHours} working hours across {emp.ActiveTasks} active tasks. Multi-tasking exhaustion warning.");
                }
                if (!overloadList.Any())
                {
                    overloadList.Add("Operational Balance: Staff workload allocations are within nominal boundaries (Average: " + avgWorkloadStr + ").");
                }
                briefing.Bottlenecks = overloadList;

                // Populate Critical Incidents
                var incidentsList = new List<string>();
                var unresolvedAlertsForCi = alerts.Where(a => a.Status != "Resolved").ToList();
                var openIncidentsList = ConsolidatedIncident.Consolidate(unresolvedAlertsForCi, employees).Take(3).ToList();
                foreach (var ci in openIncidentsList)
                {
                    incidentsList.Add($"Consolidated Incident [{ci.Severity}]: {ci.Title} assigned to {ci.AssignedOwner} in {ci.Department}. Status: {ci.Status}. Context: {ci.Description} ({ci.Signals.Count} signals consolidated)");
                }
                var sapFails = saps.Where(s => s.Status != "Connected").ToList();
                foreach (var sap in sapFails)
                {
                    incidentsList.Add($"SAP Outage: Connector {sap.Name} ({sap.Module}) reports state '{sap.Status}' since {sap.LastSyncTime.ToLocalTime()}");
                }
                if (!incidentsList.Any())
                {
                    incidentsList.Add("Operational Cleared: Zero open alerts or high-priority outages registered in system ledger.");
                }
                briefing.SapConcerns = incidentsList;

                // Populate AI Recommended Actions
                var recommendedList = new List<string>();
                if (overworkListHasItem(overworkedList))
                {
                    recommendedList.Add($"Apportion Task Assignments: Offload active backlog from {overworkedList.First().Name} ({overworkedList.First().TotalHours} Hrs in {overworkedList.First().Department}) immediately.");
                }
                var activeBreached = tasks.Where(t => t.SlaBreached && t.Status != "Completed").Take(1).ToList();
                if (activeBreached.Any())
                {
                    recommendedList.Add($"Expedite SLA Mitigation: Assign supervisor assist-roles to resolve breaching item '{activeBreached.First().Notes}' under {activeBreached.First().EmployeeName}.");
                }
                if (sapFails.Any())
                {
                    recommendedList.Add($"Initiate Connection Reset: Trigger re-authentication sequence for offline connector '{sapFails.First().Name}' ({sapFails.First().Module}).");
                }
                recommendedList.Add("Re-align task priority structures with standard operational SLA constraints.");
                briefing.RecommendedActions = recommendedList;

                // Priority Plan
                var priorityPlan = new List<string>();
                if (activeBreached.Any())
                {
                    priorityPlan.Add($"1. Resolve immediate SLA breach on work order '{activeBreached.First().Notes}' in {activeBreached.First().Department}.");
                }
                else
                {
                    priorityPlan.Add("1. Audit all pending workorders to verify conformance with scheduling rules.");
                }
                if (overworkedList.Any())
                {
                    priorityPlan.Add($"2. Restructure task assignment buffers to trim workload strain for {overworkedList.First().Name}.");
                }
                else
                {
                    priorityPlan.Add("2. Calibrate resource capacities against incoming department queue velocities.");
                }
                priorityPlan.Add("3. Perform audit log comparisons to synchronize database records with SAP inventory systems.");
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
                    highestRiskDepartment = highestRiskDeptName,
                    mostOverloadedEmployee = overloadedEmpName,
                    departmentsWithSlaBreaches = slaBreachedDeptsStr,
                    averageWorkload = avgWorkloadStr,
                    activeIncidentCount = incidentsCount,
                    sapFails = saps.Count(s => s.Status == "Error"),
                    connectors = saps.Select(s => new { s.Name, s.Status, s.Module }),
                    employeesOverload = employees.Where(e => e.TotalHours > 40).Select(e => new { e.Name, e.TotalHours, e.Department }),
                    activeBreachedTasks = tasks.Where(t => t.SlaBreached && t.Status != "Completed").Select(t => new { t.Notes, t.EmployeeName, t.Department }),
                    predictedRisks = predictions.Select(p => new { p.TargetType, p.TargetName, p.Probability, p.KeyFactor })
                };

                string contextDataJson = JsonSerializer.Serialize(calculatedContext);

                // Request payload for OpenRouter (Gemini Model)
                var requestBody = new
                {
                    model = "google/gemini-2.5-flash", 
                    messages = new[]
                    {
                        new { role = "user", content = $@"Generate an expert C-Suite Operations Integrity Intelligence Memo in JSON format mapping strictly to the live database metrics provided below.
Live Telemetry Context Info:
{contextDataJson}

Ensure all metrics like risk department, overworked personnel, and active alert counts are dynamically cited from the data. Do NOT invent names.

You MUST respond with a RAW JSON block matching this EXACT schema:
{{
  ""summary"": ""High-level concise corporate operations executive summary of about 2-3 sentences, citing hard database stats."",
  ""severity"": ""Critical"" or ""High"" or ""Medium"" or ""Low"",
  ""confidence"": 94,
  ""impact"": ""Detailed financial, service-level, and human-capital business impact analysis mapping to the active risks."",
  ""topRisks"": [""Risk item detailed"", ""Another risk item""],
  ""topOverloadedEmployees"": [""Overworked resource details"", ""Another employee details""],
  ""criticalIncidents"": [""Open alert or connection failure item"", ""Detail of other failure""],
  ""recommendedActions"": [""Specific corrective recommendation"", ""Other recommendation""],
  ""priorityPlan24h"": [""Priority action 1"", ""Priority action 2"", ""Priority action 3""]
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
                            
                            // Unescape markdown block
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
                                string sum = root.GetProperty("summary").GetString() ?? "";
                                string sev = root.GetProperty("severity").GetString() ?? calculatedSeverity;
                                int conf = root.GetProperty("confidence").GetInt32();
                                string bImpact = root.GetProperty("impact").GetString() ?? "";

                                briefing.SerializeExtraProperties(sum, sev, conf, bImpact);
                                briefing.TopRisks = ParseJsonArrayProperty(root, "topRisks");
                                briefing.Bottlenecks = ParseJsonArrayProperty(root, "topOverloadedEmployees");
                                briefing.SapConcerns = ParseJsonArrayProperty(root, "criticalIncidents");
                                briefing.RecommendedActions = ParseJsonArrayProperty(root, "recommendedActions");
                                briefing.PriorityPlan24h = ParseJsonArrayProperty(root, "priorityPlan24h");
                            }
                        }
                    }
                    else
                    {
                        throw new Exception($"OpenRouter responded with status: {response.StatusCode}");
                    }
                }
            }
            catch (Exception ex)
            {
                // Backup Fallback NLG if endpoint fails
                string summaryText = $"C-Suite operational briefing generated using {tasks.Count} live telemetry points. Warning: AI Endpoint lookup failed ({ex.Message}). Fallback engine initialized.";
                string impactText = $"The friction within {highestRiskDeptName} representing unresolved bottlenecks introduces SLA delays. Delivery confidence stands at {computedConfidence}% with outstanding fatigue limits verified.";
                
                briefing.SerializeExtraProperties(summaryText, calculatedSeverity, computedConfidence, impactText);
                
                // Key risks
                var topRisks = new List<string> { $"Highest Risk Sector: {highestRiskDeptName}" };
                foreach (var pred in predictions.Take(2))
                {
                    topRisks.Add($"SLA Threat warning: {pred.TargetType} at {pred.TargetName} with probability {pred.Probability}%. Key factor: {pred.KeyFactor}");
                }
                briefing.TopRisks = topRisks;

                // Overloaded employees
                briefing.Bottlenecks = employees.Where(e => e.TotalHours > 40).Select(e => $"{e.Name} in {e.Department}: logged {e.TotalHours} working hours across {e.ActiveTasks} active items.").ToList();
                if (!briefing.Bottlenecks.Any()) briefing.Bottlenecks.Add("Staff resource workload boundaries are stable.");

                // Incidents
                briefing.SapConcerns = alerts.Where(a => a.Status != "Resolved").Select(a => $"[{a.Severity}] Incident: {a.Title} details: {a.Description}.").ToList();
                if (!briefing.SapConcerns.Any()) briefing.SapConcerns.Add("Zero unresolved alerts in dynamic operations database.");

                briefing.RecommendedActions = new List<string> { "Rebalance active task weights to relieve human-capital bottle constraints.", "Perform diagnostic connectivity validation on offline database caches." };
                briefing.PriorityPlan24h = new List<string> { "1. Audit task queues to identify scheduling discrepancies.", "2. Adjust capacity buffers according to incoming staff load ratios." };
            }

            return briefing;
        }

        private bool overworkListHasItem(List<Employee> list)
        {
            return list != null && list.Count > 0;
        }

        private List<string> ParseJsonArrayProperty(JsonElement element, string propName)
        {
            var list = new List<string>();
            if (element.TryGetProperty(propName, out var prop) && prop.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in prop.EnumerateArray())
                {
                    string cleaned = AiInsightLog.StripMarkdown(item.GetString() ?? "");
                    if (!string.IsNullOrEmpty(cleaned))
                    {
                        list.Add(cleaned);
                    }
                }
            }
            return list;
        }
    }
}
