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
            var totalLogs = _context.WorkLogs.Count();

            var completedTasks = _context.WorkLogs
                .Count(x => x.Status == "Completed");

            var pendingTasks = _context.WorkLogs
                .Count(x => x.Status == "Pending");

            var inProgressTasks = _context.WorkLogs
                .Count(x => x.Status == "In Progress");

            var totalHours = _context.WorkLogs.Any()
                ? _context.WorkLogs.Sum(x => x.HoursWorked)
                : 0;

            ViewBag.TotalLogs = totalLogs;
            ViewBag.CompletedTasks = completedTasks;
            ViewBag.PendingTasks = pendingTasks;
            ViewBag.InProgressTasks = inProgressTasks;
            ViewBag.TotalHours = totalHours;

            // AI INSIGHT LOGIC
            if (totalLogs == 0)
            {
                ViewBag.AIInsight =
                    "No operational data available yet. Add work logs to generate AI insights.";
            }
            else if (pendingTasks > completedTasks)
            {
                ViewBag.AIInsight =
                    "AI Alert: Pending workload is increasing. Consider optimizing employee task allocation.";
            }
            else if (completedTasks > pendingTasks)
            {
                ViewBag.AIInsight =
                    "AI Insight: Operational productivity is stable with strong task completion trends.";
            }
            else
            {
                ViewBag.AIInsight =
                    "AI Observation: Team workload is balanced across operational activities.";
            }

            return View();
        }
    }
}