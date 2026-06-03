using System;
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
    [Authorize]
    public class AlertsController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly AlertService _alertService;
        private readonly AnalyticsPipelineService _pipelineService;

        public AlertsController(
            ApplicationDbContext context, 
            AlertService alertService,
            AnalyticsPipelineService pipelineService)
        {
            _context = context;
            _alertService = alertService;
            _pipelineService = pipelineService;
        }

        public async Task<IActionResult> Index([FromQuery] string? viewMode)
        {
            string userRole = "Team Lead";
            if (User.IsInRole("Director")) userRole = "Director";
            else if (User.IsInRole("Operations Manager")) userRole = "Operations Manager";
            ViewBag.ActiveRole = userRole;

            var alerts = await _context.Alerts.OrderByDescending(a => a.CreatedDate).ToListAsync();
            var employees = await _context.Employees.ToListAsync();

            // Consolidate raw active alerts or all alerts
            bool onlyActive = string.IsNullOrEmpty(viewMode) || string.Equals(viewMode, "Active", StringComparison.OrdinalIgnoreCase);

            var sourceAlerts = onlyActive ? alerts.Where(a => a.Status != "Resolved").ToList() : alerts;
            var consolidated = ConsolidatedIncident.Consolidate(sourceAlerts, employees);

            ViewBag.Employees = employees;
            ViewBag.ViewMode = onlyActive ? "Active" : "All";
            
            // Stats counts
            ViewBag.RawSignalsCount = alerts.Count(a => a.Status != "Resolved");
            ViewBag.ConsolidatedCount = consolidated.Count(ci => ci.Status != "Resolved");

            return View(consolidated);
        }

        [HttpPost]
        public async Task<IActionResult> UpdateAlert(
            string id, 
            string status, 
            string owner, 
            string? remarks, 
            string? resolutionNotes)
        {
            if (string.IsNullOrEmpty(id))
            {
                TempData["Error"] = "Missing Target Incident Identifier.";
                return RedirectToAction("Index");
            }

            string userRole = "Team Lead";
            if (User.IsInRole("Director")) userRole = "Director";
            else if (User.IsInRole("Operations Manager")) userRole = "Operations Manager";

            var alert = await _alertService.TransitionAlertAsync(
                id,
                status,
                owner ?? "Unassigned",
                remarks,
                resolutionNotes,
                owner ?? "Staff Resolver",
                userRole
            );

            if (alert == null)
            {
                TempData["Error"] = "Sought alert record not found.";
            }
            else
            {
                // Synchronize transition across all other active alerts for the same grouped employee/department
                if (alert.AssignedOwner != "Operations Manager" && alert.AssignedOwner != "Unassigned" && alert.AssignedOwner != "Staff Resolver")
                {
                    var matchingSignals = await _context.Alerts
                        .Where(a => a.Id != alert.Id && 
                                    a.AssignedOwner == alert.AssignedOwner && 
                                    a.Department == alert.Department && 
                                    a.Status != "Resolved")
                        .ToListAsync();

                    foreach (var sig in matchingSignals)
                    {
                        sig.Status = alert.Status;
                        sig.AssignedOwner = alert.AssignedOwner;
                        if (alert.Status == "Resolved")
                        {
                            sig.ResolvedDate = alert.ResolvedDate;
                            sig.ResolutionNotes = alert.ResolutionNotes ?? "Resolved as part of consolidated incident.";
                        }
                        if (!string.IsNullOrWhiteSpace(remarks))
                        {
                            sig.Comments.Add(new AlertComment
                            {
                                User = User.Identity?.Name ?? "Staff Resolver",
                                Text = $"[Consolidated Update] {remarks}",
                                Timestamp = DateTime.UtcNow
                            });
                        }
                    }
                    await _context.SaveChangesAsync();
                }

                // Recalculate operational pipeline metrics
                await _pipelineService.RecalculatePipelineAsync();
                TempData["Success"] = $"Incident '{alert.Title}' and grouped signals updated to status '{status}'. Owner assigned: {owner}.";
            }

            return RedirectToAction("Index");
        }

        [HttpPost]
        public async Task<IActionResult> FileIncident(
            string title, 
            string department, 
            string severity, 
            string description, 
            string assignedOwner)
        {
            if (string.IsNullOrEmpty(title) || string.IsNullOrEmpty(department) || string.IsNullOrEmpty(description))
            {
                TempData["Error"] = "Validation Error: Title, Department and Description are required to file an incident.";
                return RedirectToAction("Index");
            }

            var newAlert = new Alert
            {
                Id = $"alert_{Guid.NewGuid().ToString().Substring(0, 8)}",
                Title = title,
                Department = department,
                Severity = severity ?? "Moderate",
                Description = description,
                AssignedOwner = assignedOwner ?? "Elena Rostova",
                Status = "Open",
                CreatedDate = DateTime.UtcNow,
                Comments = new List<AlertComment>()
            };

            await _context.Alerts.AddAsync(newAlert);
            await _context.SaveChangesAsync();

            // Recalculate operational pipeline metrics
            await _pipelineService.RecalculatePipelineAsync();

            TempData["Success"] = $"Incident workflow logged successfully under queue: {department}.";
            return RedirectToAction("Index");
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
    }
}
