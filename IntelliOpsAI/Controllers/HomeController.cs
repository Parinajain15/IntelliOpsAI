using IntelliOpsAI.Data;
using Microsoft.AspNetCore.Mvc;

namespace IntelliOpsAI.Controllers
{
    public class HomeController : Controller
    {
        private readonly ApplicationDbContext _context;

        public HomeController(ApplicationDbContext context)
        {
            _context = context;
        }

        public IActionResult Index()
        {
            var logs = _context.WorkLogs.ToList();

            var totalLogs = logs.Count;

            var completed = logs.Count(x => x.Status == "Completed");
            var pending = logs.Count(x => x.Status == "Pending");
            var inProgress = logs.Count(x => x.Status == "In Progress");

            var totalHours = logs.Sum(x => x.HoursWorked);

            // SYSTEM WISE BREAKDOWN (NEW)
            var timeTracker = logs.Count(x => x.System == "rTimeTracker");
            var transport = logs.Count(x => x.System == "DigiTransport");
            var supplier = logs.Count(x => x.System == "rSupplierPortal");

            ViewBag.TotalLogs = totalLogs;
            ViewBag.CompletedTasks = completed;
            ViewBag.PendingTasks = pending;
            ViewBag.InProgressTasks = inProgress;
            ViewBag.TotalHours = totalHours;

            ViewBag.TimeTracker = timeTracker;
            ViewBag.Transport = transport;
            ViewBag.Supplier = supplier;

            // SIMPLE INSIGHT ENGINE
            if (totalLogs == 0)
            {
                ViewBag.AIInsight = "No data available. Import operational datasets to generate insights.";
            }
            else if (pending > completed)
            {
                ViewBag.AIInsight = "Workload imbalance detected: pending tasks exceed completed tasks.";
            }
            else
            {
                ViewBag.AIInsight = "Operational flow is stable across systems.";
            }

            return View();
        }
    }
}