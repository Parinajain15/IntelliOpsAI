using IntelliOpsAI.Data;
using IntelliOpsAI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IntelliOpsAI.Controllers
{
    [Authorize]
    public class HomeController : Controller
    {
        private readonly ApplicationDbContext _context;

        public HomeController(ApplicationDbContext context)
        {
            _context = context;
        }

        public IActionResult Index(
            string selectedDepartment,
            DateTime? startDate,
            DateTime? endDate)
        {
            var logs = _context.WorkLogs.AsQueryable();

            // FILTERS

            if (!string.IsNullOrEmpty(selectedDepartment))
            {
                logs = logs.Where(x =>
                    x.Department == selectedDepartment);
            }

            if (startDate.HasValue)
            {
                logs = logs.Where(x =>
                    x.Date >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                logs = logs.Where(x =>
                    x.Date <= endDate.Value);
            }

            var logList = logs.ToList();

            // SYSTEM DISTRIBUTION

            var normalizedSystems = logList
                .Select(x => (x.System ?? "").Trim().ToLower())
                .ToList();

            // DEPARTMENTS

            var departments = _context.WorkLogs
                .Select(x => x.Department)
                .Distinct()
                .ToList();

            // AI INSIGHT

            string aiInsight =
                "System performance is stable.";

            var overworkedEmployee = logList
                .Where(x => x.HoursWorked >= 12)
                .OrderByDescending(x => x.HoursWorked)
                .FirstOrDefault();

            if (overworkedEmployee != null)
            {
                aiInsight =
                    $"{overworkedEmployee.EmployeeName} logged " +
                    $"{overworkedEmployee.HoursWorked} hours. " +
                    $"Possible burnout risk detected.";
            }

            // TOP EMPLOYEES

            var topEmployees = logList
                .GroupBy(x => new
                {
                    x.EmployeeName,
                    x.Department
                })
                .Select(g => new EmployeePerformance
                {
                    EmployeeName = g.Key.EmployeeName,

                    Department = g.Key.Department,

                    TotalHours = g.Sum(x =>
                        x.HoursWorked),

                    CompletedTasks = g.Count(x =>
                        x.Status == "Completed")
                })
                .OrderByDescending(x => x.TotalHours)
                .Take(5)
                .ToList();

            // TREND GRAPH

            var trendData = logList
                .GroupBy(x => x.Date.Date)
                .OrderBy(x => x.Key)
                .Select(g => new
                {
                    Date = g.Key.ToString("dd MMM"),
                    Hours = g.Sum(x => x.HoursWorked)
                })
                .ToList();

            var model = new DashboardViewModel
            {
                TotalLogs = logList.Count,

                TotalHours = logList.Sum(x =>
                    x.HoursWorked),

                Completed = logList.Count(x =>
                    x.Status == "Completed"),

                Pending = logList.Count(x =>
                    x.Status == "Pending"),

                SystemLabels = new[]
                {
                    "rTimeTracker",
                    "DigiTransport",
                    "rSupplierPortal"
                },

                SystemValues = new[]
                {
                    normalizedSystems.Count(x =>
                        x == "rtimetracker"),

                    normalizedSystems.Count(x =>
                        x == "digitransport"),

                    normalizedSystems.Count(x =>
                        x == "rsupplierportal")
                },

                AIInsight = aiInsight,

                SelectedDepartment = selectedDepartment,

                StartDate = startDate,

                EndDate = endDate,

                Departments = departments,

                TopEmployees = topEmployees,

                TrendLabels = trendData
                    .Select(x => x.Date)
                    .ToList(),

                TrendValues = trendData
                    .Select(x => x.Hours)
                    .ToList()
            };

            return View(model);
        }
    }
}