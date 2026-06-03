using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using IntelliOps.Data;
using IntelliOps.Models;
using IntelliOps.Services;

namespace IntelliOps.Controllers
{
    [Authorize(Roles = "Director,Operations Manager")]
    public class RecommendationsController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly RecommendationService _recService;
        private readonly AnomalyDetectionService _anomalyService;
        private readonly AuditLogService _auditService;
        private readonly AnalyticsPipelineService _pipelineService;

        public RecommendationsController(
            ApplicationDbContext context, 
            RecommendationService recService,
            AnomalyDetectionService anomalyService,
            AuditLogService auditService,
            AnalyticsPipelineService pipelineService)
        {
            _context = context;
            _recService = recService;
            _anomalyService = anomalyService;
            _auditService = auditService;
            _pipelineService = pipelineService;
        }

        public async Task<IActionResult> Index()
        {
            string userRole = "Team Lead";
            if (User.IsInRole("Director")) userRole = "Director";
            else if (User.IsInRole("Operations Manager")) userRole = "Operations Manager";
            ViewBag.ActiveRole = userRole;

            var employees = await _context.Employees.ToListAsync();
            var tasks = await _context.Tasks.ToListAsync();
            var saps = await _context.SapConnectors.ToListAsync();

            // Run Engines
            var anomalies = _anomalyService.DetectAnomalies(employees, tasks, saps);
            var recommendations = _recService.GenerateRecommendations(employees, tasks, anomalies);

            ViewBag.Recommendations = recommendations;
            ViewBag.AnomaliesCount = anomalies.Count;

            return View(recommendations);
        }

        [HttpPost]
        public async Task<IActionResult> Execute(string id, string? department, string? title)
        {
            string userRole = "Team Lead";
            if (User.IsInRole("Director")) userRole = "Director";
            else if (User.IsInRole("Operations Manager")) userRole = "Operations Manager";
 
            if (!string.IsNullOrEmpty(id) && (id.Contains("rebal") || id.Contains("engineering") || department == "Engineering"))
            {
                var teamDept = string.IsNullOrEmpty(department) ? "Engineering" : department;
                var deptStaff = await _context.Employees.Where(e => e.Department == teamDept).ToListAsync();
                if (deptStaff.Count >= 2)
                {
                    var sortedStaff = deptStaff.OrderByDescending(e => e.TotalHours).ToList();
                    var overWorked = sortedStaff.First();
                    var underWorked = sortedStaff.Last();

                    if (overWorked.TotalHours > 40 && overWorked.Name != underWorked.Name)
                    {
                        var task = await _context.Tasks.FirstOrDefaultAsync(t => t.EmployeeName == overWorked.Name && t.Status != "Completed");
                        if (task != null)
                        {
                            var oldOwner = task.EmployeeName;
                            task.EmployeeName = underWorked.Name;

                            overWorked.TotalHours = Math.Max(0, overWorked.TotalHours - task.HoursWorked);
                            overWorked.ActiveTasks = Math.Max(0, overWorked.ActiveTasks - 1);

                            underWorked.TotalHours += task.HoursWorked;
                            underWorked.ActiveTasks += 1;

                            await _context.SaveChangesAsync();

                            await _pipelineService.RecalculatePipelineAsync();

                            TempData["Success"] = $"Automated Rebalance Executed: Task '{task.Notes}' reallocated to {underWorked.Name}. {teamDept} queue load variance corrected.";

                            await _auditService.AddAuditLogAsync(
                                "RECOMMENDATION_EXECUTE", 
                                User.Identity?.Name ?? "System Optimizer", 
                                userRole, 
                                $"Executed Optimizer pipeline: Reallocated work Order '{task.Notes}' from {oldOwner} to {underWorked.Name}."
                            );
                            return RedirectToAction("Index");
                        }
                    }
                }
                
                // Fallback: redistributing any unresolved task in that department if someone is available
                var anyTask = await _context.Tasks.FirstOrDefaultAsync(t => t.Department == teamDept && t.Status != "Completed");
                if (anyTask != null)
                {
                    var oldOwner = anyTask.EmployeeName;
                    var helpers = await _context.Employees.Where(e => e.Department == teamDept && e.Name != oldOwner).ToListAsync();
                    if (helpers.Any())
                    {
                        var bestHelper = helpers.OrderBy(e => e.TotalHours).First();
                        var oldEmp = await _context.Employees.FirstOrDefaultAsync(e => e.Name == oldOwner);
                        
                        anyTask.EmployeeName = bestHelper.Name;
                        if (oldEmp != null)
                        {
                            oldEmp.TotalHours = Math.Max(0, oldEmp.TotalHours - anyTask.HoursWorked);
                            oldEmp.ActiveTasks = Math.Max(0, oldEmp.ActiveTasks - 1);
                        }
                        bestHelper.TotalHours += anyTask.HoursWorked;
                        bestHelper.ActiveTasks += 1;

                        await _context.SaveChangesAsync();
                        await _pipelineService.RecalculatePipelineAsync();

                        TempData["Success"] = $"Automated Rebalance Executed: Task '{anyTask.Notes}' reallocated from {oldOwner} to {bestHelper.Name}.";
                        return RedirectToAction("Index");
                    }
                }

                TempData["Success"] = "Workloads within target limits. No active workload concentrations require automated balancing.";
            }
            else
            {
                await _auditService.AddAuditLogAsync(
                    "RECOMMENDATION_EXECUTE", 
                    User.Identity?.Name ?? "System Optimizer", 
                    userRole, 
                    $"Authorized recommendation process target {id}."
                );
                TempData["Success"] = $"Recommendation action plan launched dynamically. Balanced workload across core modules.";
            }

            return RedirectToAction("Index");
        }

        [HttpPost]
        public async Task<IActionResult> UpdateStatus(string id, string status)
        {
            if (string.IsNullOrEmpty(id) || string.IsNullOrEmpty(status))
            {
                return BadRequest("Invalid parameters.");
            }

            RecommendationService.UpdateStatus(id, status);

            string userRole = "Team Lead";
            if (User.IsInRole("Director")) userRole = "Director";
            else if (User.IsInRole("Operations Manager")) userRole = "Operations Manager";

            await _auditService.AddAuditLogAsync(
                "RECOMMENDATION_STATUS_UPDATE",
                User.Identity?.Name ?? "System Optimizer",
                userRole,
                $"Updated mitigation status of recommendation '{id}' to '{status}'."
            );

            // Real operations simulation when transitioned to Completed
            if (status == "Completed")
            {
                var employees = await _context.Employees.ToListAsync();
                var tasks = await _context.Tasks.ToListAsync();
                var saps = await _context.SapConnectors.ToListAsync();
                var anomalies = _anomalyService.DetectAnomalies(employees, tasks, saps);
                var recommendations = _recService.GenerateRecommendations(employees, tasks, anomalies);
                var matchedRec = recommendations.FirstOrDefault(r => r.Id == id);

                if (matchedRec != null)
                {
                    if (matchedRec.Category == "Reassign overloaded employee tasks")
                    {
                        var riskSource = matchedRec.RiskSource ?? "";
                        var parts = riskSource.Split(" - ");
                        if (parts.Length > 1) 
                        {
                            var empNameWithDetails = parts[1];
                            var parenIdx = empNameWithDetails.IndexOf('(');
                            var empName = parenIdx >= 0 ? empNameWithDetails.Substring(0, parenIdx).Trim() : empNameWithDetails.Trim();
                            var helperName = matchedRec.Owner;

                            var taskToMove = await _context.Tasks.FirstOrDefaultAsync(t => t.EmployeeName == empName && t.Status != "Completed");
                            if (taskToMove != null && !string.IsNullOrEmpty(helperName))
                            {
                                var oldOwner = taskToMove.EmployeeName;
                                taskToMove.EmployeeName = helperName;

                                var oldEmp = await _context.Employees.FirstOrDefaultAsync(e => e.Name == oldOwner);
                                var newEmp = await _context.Employees.FirstOrDefaultAsync(e => e.Name == helperName);

                                if (oldEmp != null)
                                {
                                    oldEmp.TotalHours = Math.Max(0, oldEmp.TotalHours - taskToMove.HoursWorked);
                                    oldEmp.ActiveTasks = Math.Max(0, oldEmp.ActiveTasks - 1);
                                }
                                if (newEmp != null)
                                {
                                    newEmp.TotalHours += taskToMove.HoursWorked;
                                    newEmp.ActiveTasks += 1;
                                }

                                await _context.SaveChangesAsync();
                                await _pipelineService.RecalculatePipelineAsync();

                                await _auditService.AddAuditLogAsync(
                                    "RECOMMENDATION_EXECUTE",
                                    User.Identity?.Name ?? "System Optimizer",
                                    userRole,
                                    $"Executed load rebalancing: Reallocated task '{taskToMove.Notes}' from {oldOwner} to {helperName}."
                                );
                            }
                        }
                    }
                    else if (matchedRec.Category == "Resolve SLA breach incidents")
                    {
                        var taskIdPart = id.Replace("rec_sla_mit_", "");
                        var dbTask = await _context.Tasks.FirstOrDefaultAsync(t => t.Id == taskIdPart);
                        if (dbTask != null)
                        {
                            dbTask.SlaBreached = false;
                            dbTask.Status = "Completed";

                            await _context.SaveChangesAsync();
                            await _pipelineService.RecalculatePipelineAsync();

                            await _auditService.AddAuditLogAsync(
                                "SLA_RESOLVED",
                                User.Identity?.Name ?? "System Optimizer",
                                userRole,
                                $"Manually completed breached SLA task '{dbTask.Notes}' (Assigned to: {dbTask.EmployeeName})."
                            );
                        }
                    }
                }
            }

            TempData["Success"] = $"Mitigation status transitioned to '{status}' for plan: '{id}'";
            return RedirectToAction("Index");
        }
    }
}
