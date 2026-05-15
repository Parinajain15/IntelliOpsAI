using IntelliOpsAI.Data;
using IntelliOpsAI.Models;
using Microsoft.AspNetCore.Mvc;
using System.Linq;

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

            // RAW DATABASE VALUES
            var rawSystems = logs
                .Select(x => x.System)
                .ToList();

            ViewBag.RawSystems = rawSystems;

            // NORMALIZED VALUES
            var normalized = logs
                .Select(x => (x.System ?? "").Trim().ToLower())
                .ToList();

            var model = new DashboardViewModel
            {
                TotalLogs = logs.Count,
                TotalHours = logs.Sum(x => x.HoursWorked),
                Completed = logs.Count(x => x.Status == "Completed"),
                Pending = logs.Count(x => x.Status == "Pending"),

                SystemLabels = new[]
                {
                    "rTimeTracker",
                    "DigiTransport",
                    "rSupplierPortal"
                },

                SystemValues = new[]
                {
                    normalized.Count(x => x == "rtimetracker"),
                    normalized.Count(x => x == "digitransport"),
                    normalized.Count(x => x == "rsupplierportal")
                },

                AIInsight = "Database Debug Active"
            };

            return View(model);
        }
    }
}