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
    [Authorize]
    public class ManualEntryController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly ManualEntryService _entryService;
        private readonly AnalyticsPipelineService _pipelineService;

        public ManualEntryController(
            ApplicationDbContext context, 
            ManualEntryService entryService,
            AnalyticsPipelineService pipelineService)
        {
            _context = context;
            _entryService = entryService;
            _pipelineService = pipelineService;
        }

        public async Task<IActionResult> Index()
        {
            string userRole = "Team Lead";
            if (User.IsInRole("Director")) userRole = "Director";
            else if (User.IsInRole("Operations Manager")) userRole = "Operations Manager";
            ViewBag.ActiveRole = userRole;

            var departments = await _context.Departments.Select(d => d.Name).Distinct().ToListAsync();
            if (!departments.Any())
            {
                departments = new List<string> { "Engineering", "Supply Chain", "Quality Assurance", "Customer Support" };
            }

            var employeesList = await _context.Employees.Select(e => e.Name).Distinct().ToListAsync();

            var taskRecords = await _context.Tasks.OrderByDescending(t => t.Timestamp).Take(20).ToListAsync();

            var model = new ManualEntryViewModel
            {
                Departments = departments,
                Employees = employeesList,
                Tasks = taskRecords.Select(t => new ManualTaskViewModel
                {
                    Id = t.Id,
                    Notes = t.Notes,
                    AssignedEmployeeName = t.EmployeeName,
                    DepartmentName = t.Department,
                    PriorityLevel = t.Priority,
                    Status = t.Status,
                    HoursWorked = t.HoursWorked
                }).ToList()
            };

            return View(model);
        }

        [HttpPost]
        public async Task<IActionResult> ScheduleTask(string title, string department, string employee, int hours, string priority, string notes)
        {
            if (string.IsNullOrEmpty(title) || string.IsNullOrEmpty(department) || string.IsNullOrEmpty(employee))
            {
                TempData["Error"] = "Validation Error: Task Brief, Target Department, and Assigned Employee are required fields.";
                return RedirectToAction("Index");
            }

            var task = new TaskRecord
            {
                Id = Guid.NewGuid().ToString().Substring(0, 8),
                EmployeeName = employee,
                Department = department,
                Priority = string.IsNullOrEmpty(priority) ? "Medium" : priority,
                Notes = $"{title} - {notes}",
                Status = "Pending",
                HoursWorked = hours > 0 ? hours : 8,
                DueDate = DateTime.UtcNow.AddDays(3),
                SlaBreached = false,
                Timestamp = DateTime.UtcNow
            };

            string activeUser = "Team Lead";
            if (User.IsInRole("Director")) activeUser = "Director";
            else if (User.IsInRole("Operations Manager")) activeUser = "Operations Manager";
            await _entryService.CreateTaskAsync(task, User.Identity?.Name ?? "Operations Lead", activeUser);

            // Recalculate operational pipeline metrics
            await _pipelineService.RecalculatePipelineAsync();

            TempData["Success"] = $"Work order successfully scheduled for {employee} in the {department} queue.";
            return RedirectToAction("Index");
        }

        [HttpPost]
        public async Task<IActionResult> LogIncident(string message, string department, string type, string @operator)
        {
            if (string.IsNullOrEmpty(message) || string.IsNullOrEmpty(department))
            {
                TempData["Error"] = "Validation Error: Department and Message content are required to file an operational report.";
                return RedirectToAction("Index");
            }

            var log = new OperationalLog
            {
                Id = Guid.NewGuid().ToString().Substring(0, 8),
                Type = string.IsNullOrEmpty(type) ? "issue" : type,
                Message = message,
                Department = department,
                Priority = "Medium",
                ReportedBy = string.IsNullOrEmpty(@operator) ? "Operations Lead" : @operator,
                Timestamp = DateTime.UtcNow
            };

            string activeUser = "Team Lead";
            if (User.IsInRole("Director")) activeUser = "Director";
            else if (User.IsInRole("Operations Manager")) activeUser = "Operations Manager";
            await _entryService.CreateOperationalLogAsync(log, @operator ?? "Security Staff", activeUser);

            // Recalculate operational pipeline metrics to merge the new log immediately
            await _pipelineService.RecalculatePipelineAsync();

            TempData["Success"] = $"Incident filed securely into the security ledger database. Status flags updated.";
            return RedirectToAction("Index");
        }

        [HttpPost]
        public async Task<IActionResult> DeleteTask(string id)
        {
            var task = await _context.Tasks.FindAsync(id);
            if (task != null)
            {
                _context.Tasks.Remove(task);
                await _context.SaveChangesAsync();

                // Recalculate operational pipeline metrics
                await _pipelineService.RecalculatePipelineAsync();

                TempData["Success"] = "Task record removed successfully.";
            }
            return RedirectToAction("Index");
        }
    }
}
