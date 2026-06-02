using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using IntelliOps.Data;
using IntelliOps.Models;

namespace IntelliOps.Services
{
    public class AnalyticsPipelineService
    {
        private readonly ApplicationDbContext _context;

        public AnalyticsPipelineService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task RecalculatePipelineAsync()
        {
            var allTasks = await _context.Tasks.ToListAsync();
            var seededTaskIds = new HashSet<string> {
                "task_01", "task_02", "task_03", "task_04", "task_05", "task_06", "task_07", "task_08", "task_09", "task_10", "task_11", "task_12", "task_13", "task_14", "task_15", "task_16", "task_17"
            };
            bool hasCustomTasks = allTasks.Any(t => !seededTaskIds.Contains(t.Id));

            if (hasCustomTasks)
            {
                // We have custom tasks! Purge any remaining seeded tasks from active database
                var seededTasks = allTasks.Where(t => seededTaskIds.Contains(t.Id)).ToList();
                if (seededTasks.Any())
                {
                    _context.Tasks.RemoveRange(seededTasks);
                    await _context.SaveChangesAsync();
                }

                // Also make sure seeded operational logs are completely removed from database
                var seededLogIds = new HashSet<string> { "log_01", "log_02", "log_03", "log_04", "log_05" };
                var seededLogs = await _context.OperationalLogs.Where(l => seededLogIds.Contains(l.Id)).ToListAsync();
                if (seededLogs.Any())
                {
                    _context.OperationalLogs.RemoveRange(seededLogs);
                    await _context.SaveChangesAsync();
                }
            }

            var tasks = await _context.Tasks.ToListAsync();
            var saps = await _context.SapConnectors.ToListAsync();

            // 1. Re-generate Employees table dynamically from live database tasks
            var empGroups = tasks.GroupBy(t => t.EmployeeName).ToList();
            
            var currentEmployees = await _context.Employees.ToListAsync();
            _context.Employees.RemoveRange(currentEmployees);
            await _context.SaveChangesAsync();

            var newEmployees = new List<Employee>();
            int empCounter = 1;
            foreach (var group in empGroups)
            {
                var empName = group.Key;
                if (string.IsNullOrWhiteSpace(empName)) continue;

                var empTasks = group.ToList();
                
                // Determine department of employee from tasks, default to "Engineering"
                var dept = empTasks.Select(t => t.Department).FirstOrDefault(d => !string.IsNullOrEmpty(d)) ?? "Engineering";
                
                int totalHours = empTasks.Sum(t => t.HoursWorked);
                int activeTasks = empTasks.Count(t => t.Status != "Completed");

                newEmployees.Add(new Employee
                {
                    Id = $"emp_{empCounter++:D2}",
                    Name = empName,
                    Department = dept,
                    Status = "Active",
                    TotalHours = totalHours,
                    ActiveTasks = activeTasks
                });
            }

            // Ensure we have at least one employee representation if empty
            if (!newEmployees.Any())
            {
                newEmployees.Add(new Employee { Id = "emp_01", Name = "Operations Lead", Department = "Engineering", Status = "Active", TotalHours = 0, ActiveTasks = 0 });
            }

            await _context.Employees.AddRangeAsync(newEmployees);
            await _context.SaveChangesAsync();

            // 2. Re-generate Departments table organically from tasks & employees
            var deptNames = tasks.Select(t => t.Department).Where(d => !string.IsNullOrEmpty(d)).Distinct().ToList();
            var standardDepts = new List<string> { "Engineering", "Supply Chain", "Quality Assurance", "Customer Support" };
            foreach (var std in standardDepts)
            {
                if (!deptNames.Contains(std))
                {
                    deptNames.Add(std);
                }
            }

            var currentDepartments = await _context.Departments.ToListAsync();
            _context.Departments.RemoveRange(currentDepartments);
            await _context.SaveChangesAsync();

            var newDepartments = new List<Department>();
            int deptCounter = 1;
            foreach (var deptName in deptNames)
            {
                var deptTasks = tasks.Where(t => t.Department == deptName).ToList();
                var deptEmployees = newEmployees.Where(e => e.Department == deptName).ToList();

                int totalHoursInDept = deptTasks.Sum(t => t.HoursWorked);
                int completedTasks = deptTasks.Count(t => t.Status == "Completed");
                int totalTasks = deptTasks.Count;
                int completionRate = totalTasks > 0 ? (int)Math.Round((double)completedTasks / totalTasks * 100) : 100;

                int workloadScore = totalHoursInDept;
                string manager = deptEmployees.Select(e => e.Name).FirstOrDefault() ?? "Operations Manager";

                // Base health score calculation
                int activePending = deptTasks.Count(t => t.Status != "Completed");
                int breached = deptTasks.Count(t => t.SlaBreached && t.Status != "Completed");

                int score = 100;
                score -= activePending * 10;
                score -= breached * 15;
                score = Math.Max(12, Math.Min(100, score));

                string riskLevel = "Low";
                if (score < 50) riskLevel = "High";
                else if (score < 80) riskLevel = "Moderate";

                newDepartments.Add(new Department
                {
                    Id = $"dept_{deptCounter++:D2}",
                    Name = deptName,
                    HealthScore = score,
                    RiskLevel = riskLevel,
                    Manager = manager,
                    CompletionRate = completionRate,
                    ActiveAlertsCount = 0,
                    WorkloadScore = workloadScore
                });
            }

            await _context.Departments.AddRangeAsync(newDepartments);
            await _context.SaveChangesAsync();

            // 3. Re-generate Alerts dynamic listings from the active Tasks list (Applying all user alert rules and preventing duplicate active alerts)
            var existingAlerts = await _context.Alerts.ToListAsync();
            
            var candidateAlerts = new List<Alert>();

            // Rule A: Workload Exceeded Alert (HoursWorked > 40 = High workload alert, > 60 = Critical workload alert)
            foreach (var emp in newEmployees)
            {
                if (emp.TotalHours > 60)
                {
                    candidateAlerts.Add(new Alert
                    {
                        Id = string.Empty,
                        Title = $"Critical Resource Burnout Risk: {emp.Name}",
                        Department = emp.Department,
                        Severity = "Critical",
                        Description = $"{emp.Name} is experiencing critical workload fatigue, logged {emp.TotalHours} operational hours. Immediate supervisor redistribution required.",
                        AssignedOwner = emp.Name,
                        Status = "Open",
                        CreatedDate = DateTime.UtcNow.AddMinutes(-10),
                        Comments = new List<AlertComment>()
                    });
                }
                else if (emp.TotalHours > 40)
                {
                    candidateAlerts.Add(new Alert
                    {
                        Id = string.Empty,
                        Title = $"Resource Burnout Risk: {emp.Name}",
                        Department = emp.Department,
                        Severity = "High",
                        Description = $"{emp.Name} is logging elevated weekly effort ({emp.TotalHours} hours), exceeding standard soft ceiling boundaries.",
                        AssignedOwner = emp.Name,
                        Status = "Open",
                        CreatedDate = DateTime.UtcNow.AddMinutes(-30),
                        Comments = new List<AlertComment>()
                    });
                }
            }

            // Rule B: SLA Breach Alerts (SLA_Breached true = SLA breach alert)
            var activeBreachedTasksList = tasks.Where(t => t.SlaBreached && t.Status != "Completed").ToList();
            foreach (var task in activeBreachedTasksList)
            {
                candidateAlerts.Add(new Alert
                {
                    Id = string.Empty,
                    Title = $"SLA Breach: {task.Notes}",
                    Department = task.Department,
                    Severity = task.Priority == "Critical" ? "Critical" : "High",
                    Description = $"Standard SLA delivery timeline violated on active item '{task.Notes}' assigned to {task.EmployeeName} in {task.Department}.",
                    AssignedOwner = task.EmployeeName,
                    Status = "Open",
                    CreatedDate = task.Timestamp,
                    Comments = new List<AlertComment>()
                });
            }

            // Rule C: Delivery Risk Warnings (Status Active/Pending/In Progress with high individual task hours)
            var deliveryRiskTasksList = tasks.Where(t => (t.Status == "Active" || t.Status == "Pending" || t.Status == "In Progress") && t.HoursWorked > 30).ToList();
            foreach (var task in deliveryRiskTasksList)
            {
                candidateAlerts.Add(new Alert
                {
                    Id = string.Empty,
                    Title = $"Delivery Risk Warning: {task.EmployeeName}",
                    Department = task.Department,
                    Severity = "High",
                    Description = $"The task '{task.Notes}' was left in '{task.Status}' state despite high aggregate effort logged ({task.HoursWorked} hours).",
                    AssignedOwner = task.EmployeeName,
                    Status = "Open",
                    CreatedDate = DateTime.UtcNow.AddHours(-1),
                    Comments = new List<AlertComment>()
                });
            }

            // Rule D: Department Total Workload High Alerts (Department total workload > 80 = department overload alert)
            foreach (var dept in newDepartments)
            {
                if (dept.WorkloadScore > 80)
                {
                    candidateAlerts.Add(new Alert
                    {
                        Id = string.Empty,
                        Title = $"Department Overload Risk: {dept.Name}",
                        Department = dept.Name,
                        Severity = dept.WorkloadScore > 150 ? "Critical" : "High",
                        Description = $"The {dept.Name} department is experiencing intense workload pressure, tracking {dept.WorkloadScore} total active labor hours.",
                        AssignedOwner = dept.Manager ?? "Operations Manager",
                        Status = "Open",
                        CreatedDate = DateTime.UtcNow.AddHours(-2),
                        Comments = new List<AlertComment>()
                    });
                }
            }

            var newAlertsToInsert = new List<Alert>();
            foreach (var candidate in candidateAlerts)
            {
                string candType = GetAlertType(candidate.Title);
                string candOwner = candidate.AssignedOwner;
                string candDept = candidate.Department;

                bool existsInDb = existingAlerts.Any(a => 
                    string.Equals(a.AssignedOwner, candOwner, StringComparison.OrdinalIgnoreCase) && 
                    string.Equals(a.Department, candDept, StringComparison.OrdinalIgnoreCase) && 
                    string.Equals(GetAlertType(a.Title), candType, StringComparison.OrdinalIgnoreCase)
                );

                bool existsInBatch = newAlertsToInsert.Any(a => 
                    string.Equals(a.AssignedOwner, candOwner, StringComparison.OrdinalIgnoreCase) && 
                    string.Equals(a.Department, candDept, StringComparison.OrdinalIgnoreCase) && 
                    string.Equals(GetAlertType(a.Title), candType, StringComparison.OrdinalIgnoreCase)
                );

                if (!existsInDb && !existsInBatch)
                {
                    candidate.Id = $"alert_{Guid.NewGuid().ToString().Substring(0, 8)}";
                    newAlertsToInsert.Add(candidate);
                }
            }

            if (newAlertsToInsert.Any())
            {
                await _context.Alerts.AddRangeAsync(newAlertsToInsert);
                await _context.SaveChangesAsync();
            }

            // Re-fetch all alerts from database to represent active counts correctly
            var allDbAlerts = await _context.Alerts.ToListAsync();

            // Set ActiveAlertsCount count on all stored Departments records correctly
            var savedDeptsList = await _context.Departments.ToListAsync();
            foreach (var dept in savedDeptsList)
            {
                dept.ActiveAlertsCount = allDbAlerts.Count(a => a.Department == dept.Name && a.Status != "Resolved");
            }
            await _context.SaveChangesAsync();

            // 4. Update latest AI Executive briefing
            var completedCountGlobal = tasks.Count(t => t.Status == "Completed");
            int completionRateGlobal = tasks.Any() ? (int)Math.Round((double)completedCountGlobal / tasks.Count * 100) : 0;
            int slaBreachRateGlobal = tasks.Any() ? (int)Math.Round((double)tasks.Count(t => t.SlaBreached && t.Status != "Completed") / tasks.Count * 100) : 0;
            int activeAlertsCountGlobal = allDbAlerts.Count(a => a.Status != "Resolved");

            var currentBriefings = await _context.AiInsightLogs.ToListAsync();
            _context.AiInsightLogs.RemoveRange(currentBriefings);
            await _context.SaveChangesAsync();

            var dynamicBriefing = new AiInsightLog
            {
                Id = $"brief_{Guid.NewGuid().ToString().Substring(0, 8)}",
                Timestamp = DateTime.UtcNow,
                ExecutiveSummary = $"System compiled state calculated based on **{tasks.Count} active operational records**. " +
                                   $"Overall operational completion stands at **{completionRateGlobal}%**, with a current SLA breach velocity of **{slaBreachRateGlobal}%**. " +
                                   $"There are **{activeAlertsCountGlobal} unresolved alerts** demanding supervisory response.",
                TopRisks = newListString(
                    allDbAlerts.Where(a => a.Status != "Resolved" && (a.Severity == "Critical" || a.Severity == "High")).Select(a => $"{a.Department}: {a.Title} - {a.Description}").ToList(),
                    "No high-severity operational risk clusters currently identified."
                ),
                DepartmentIssues = newListString(
                    tasks.Where(t => t.SlaBreached && t.Status != "Completed").Select(t => $"{t.Department}: Task on '{t.EmployeeName}' is breaching SLA details: '{t.Notes}'").ToList(),
                    "All department queue delivery times are within nominal SLAs."
                ),
                SapConcerns = newListString(
                    saps.Where(s => s.Status != "Connected").Select(s => $"Connector '{s.Name}' status is {s.Status}").ToList(),
                    "All SAP integrations show fully established TLS handshakes."
                ),
                SlaConcerns = newListString(
                    new List<string> { $"{slaBreachRateGlobal}% of tasks are currently flagged with outstanding SLA breaches." },
                    "No current SLA warnings reported."
                ),
                Bottlenecks = newListString(
                    newEmployees.Where(e => e.TotalHours > 45).Select(e => $"Resource overload bottleneck: {e.Name} has logged {e.TotalHours} hours in {e.Department} queue.").ToList(),
                    "System resource allocations are balanced across teams."
                ),
                RecommendedActions = new Func<List<string>>(() => {
                    var list = new List<string>();
                    var topFatigue = newEmployees.Where(e => e.TotalHours > 40).OrderByDescending(e => e.TotalHours).FirstOrDefault();
                    if (topFatigue != null)
                    {
                        list.Add($"Immediate load rebalancing: Offload active items from {topFatigue.Name} ({topFatigue.TotalHours} working hours) in {topFatigue.Department}.");
                    }
                    var topSlaBreach = tasks.Where(t => t.SlaBreached && t.Status != "Completed").FirstOrDefault();
                    if (topSlaBreach != null)
                    {
                        list.Add($"Expedite work order SLA: Assign supervisor oversight to assist {topSlaBreach.EmployeeName} on '{topSlaBreach.Notes}'.");
                    }
                    list.Add("Verify live operational ledger alignment with the automated alerts engine.");
                    if (saps.Any(s => s.Status != "Connected"))
                    {
                        list.Add("Initiate authentication handshake credential refresh on failing SAP gateway connectors.");
                    }
                    return list;
                })(),
                PriorityPlan24h = new Func<List<string>>(() => {
                    var list = new List<string>();
                    var topSlaBreach = tasks.Where(t => t.SlaBreached && t.Status != "Completed").FirstOrDefault();
                    if (topSlaBreach != null)
                    {
                        list.Add($"1. Resolve the active SLA breach on ticket '{topSlaBreach.Notes}' assigned to {topSlaBreach.EmployeeName}.");
                    }
                    else
                    {
                        list.Add("1. Audit all open workflows to verify compliance with enterprise timeline parameters.");
                    }
                    var topFatigue = newEmployees.Where(e => e.TotalHours > 40).OrderByDescending(e => e.TotalHours).FirstOrDefault();
                    if (topFatigue != null)
                    {
                        list.Add($"2. Re-apportion task assignments to reduce workload strain for overworked employee {topFatigue.Name}.");
                    }
                    else
                    {
                        list.Add("2. Perform proactive capacity utilization checks across all department staffs.");
                    }
                    list.Add("3. Perform audit log reconciliations between manual entries and live uploaded CSV records.");
                    return list;
                })()
            };

            await _context.AiInsightLogs.AddAsync(dynamicBriefing);
            await _context.SaveChangesAsync();

            // 5. Re-generate OperationalLogs dynamically and completely
            var seededLogIdsCheck = new HashSet<string> { "log_01", "log_02", "log_03", "log_04", "log_05" };
            var allLogsCheck = await _context.OperationalLogs.ToListAsync();
            
            // Preserve manually logged user incidents (logs that are NOT seeded and NOT dynamically generated)
            var userLoggedIncidents = allLogsCheck
                .Where(l => !seededLogIdsCheck.Contains(l.Id) && !l.Id.StartsWith("gen_"))
                .ToList();
            
            // Remove all existing logs
            _context.OperationalLogs.RemoveRange(allLogsCheck);
            await _context.SaveChangesAsync();

            var freshLogs = new List<OperationalLog>();
            int logCounter = 1;

            // Restoring user logged manual incidents
            foreach (var manualInc in userLoggedIncidents)
            {
                freshLogs.Add(new OperationalLog
                {
                    Id = manualInc.Id,
                    Timestamp = manualInc.Timestamp,
                    Type = manualInc.Type,
                    Message = manualInc.Message,
                    Department = manualInc.Department,
                    Priority = manualInc.Priority,
                    ReportedBy = manualInc.ReportedBy
                });
            }

            // A. Base Task Logs: Create a meaningful log for EVERY task record
            foreach (var task in tasks)
            {
                freshLogs.Add(new OperationalLog
                {
                    Id = $"gen_task_{task.Id}",
                    Timestamp = task.Timestamp,
                    Type = "issue",
                    Message = $"Task record synchronized: '{task.Notes}' for {task.EmployeeName} in {task.Department}. Status: {task.Status}.",
                    Department = task.Department,
                    Priority = task.Priority,
                    ReportedBy = "System Auditor"
                });
            }

            // B. High Workload Logs (> 40 or > 60 hours)
            foreach (var emp in newEmployees)
            {
                if (emp.TotalHours > 60)
                {
                    freshLogs.Add(new OperationalLog
                    {
                        Id = $"gen_wl_{logCounter++}",
                        Timestamp = DateTime.UtcNow.AddMinutes(-5),
                        Type = "overload",
                        Message = $"Critical workload fatigue detected: {emp.Name} logging {emp.TotalHours} operational hours inside {emp.Department}.",
                        Department = emp.Department,
                        Priority = "Critical",
                        ReportedBy = "Risk Engine"
                    });
                }
                else if (emp.TotalHours > 40)
                {
                    freshLogs.Add(new OperationalLog
                    {
                        Id = $"gen_wl_{logCounter++}",
                        Timestamp = DateTime.UtcNow.AddMinutes(-15),
                        Type = "overload",
                        Message = $"Workload anomaly warning: {emp.Name} is logged with elevated effort ({emp.TotalHours} hours) in {emp.Department}.",
                        Department = emp.Department,
                        Priority = "High",
                        ReportedBy = "Risk Engine"
                    });
                }
            }

            // C. Active/Pending High Workload tasks (Status Active/Pending/In Progress + HoursWorked > 30)
            var activeHighHourTasks = tasks.Where(t => (t.Status == "Active" || t.Status == "Pending" || t.Status == "In Progress") && t.HoursWorked > 30).ToList();
            foreach (var task in activeHighHourTasks)
            {
                freshLogs.Add(new OperationalLog
                {
                    Id = $"gen_act_risk_{logCounter++}",
                    Timestamp = DateTime.UtcNow.AddMinutes(-10),
                    Type = "delay",
                    Message = $"Outstanding active item risk: '{task.Notes}' has been left in Status '{task.Status}' state with high logged resource footprint ({task.HoursWorked} hours).",
                    Department = task.Department,
                    Priority = "High",
                    ReportedBy = "System Monitor"
                });
            }

            // D. SLA Breach Logs (SLA_Breached true)
            var activeBreachedTasks = tasks.Where(t => t.SlaBreached && t.Status != "Completed").ToList();
            foreach (var breachedTask in activeBreachedTasks)
            {
                freshLogs.Add(new OperationalLog
                {
                    Id = $"gen_sla_{logCounter++}",
                    Timestamp = breachedTask.Timestamp,
                    Type = "delay",
                    Message = $"SLA Breach Escalation: Active queue ticket '{breachedTask.Notes}' assigned to {breachedTask.EmployeeName} has violated SLA delivery limits.",
                    Department = breachedTask.Department,
                    Priority = breachedTask.Priority == "Critical" ? "Critical" : "High",
                    ReportedBy = "SLA Monitor"
                });
            }

            // E. Department Overload Logs (Department total workload > 80)
            foreach (var dDept in newDepartments)
            {
                if (dDept.WorkloadScore > 80)
                {
                    freshLogs.Add(new OperationalLog
                    {
                        Id = $"gen_dept_ovr_{logCounter++}",
                        Timestamp = DateTime.UtcNow.AddHours(-1),
                        Type = "incident",
                        Message = $"Department structural queue backlog: {dDept.Name} aggregate workloads elevated to {dDept.WorkloadScore} hours, flagging operational risk constraints.",
                        Department = dDept.Name,
                        Priority = dDept.WorkloadScore > 150 ? "Critical" : "High",
                        ReportedBy = "Health Engine"
                    });
                }
            }

            // Save all fresh generated and preserved user incident logs
            if (freshLogs.Any())
            {
                await _context.OperationalLogs.AddRangeAsync(freshLogs);
                await _context.SaveChangesAsync();
            }
        }

        private string GetAlertType(string title)
        {
            if (title.StartsWith("Critical Resource Burnout Risk", StringComparison.OrdinalIgnoreCase) || title.StartsWith("Resource Burnout Risk", StringComparison.OrdinalIgnoreCase))
                return "Workload Burnout";
            if (title.StartsWith("SLA Breach", StringComparison.OrdinalIgnoreCase))
                return "SLA Breach";
            if (title.StartsWith("Delivery Risk Warning", StringComparison.OrdinalIgnoreCase))
                return "Delivery Risk";
            if (title.StartsWith("Department Overload Risk", StringComparison.OrdinalIgnoreCase))
                return "Department Overload";
            return "Custom Incident";
        }

        private List<string> newListString(List<string> items, string defaultVal)
        {
            if (items == null || !items.Any())
            {
                return new List<string> { defaultVal };
            }
            return items;
        }
    }
}
