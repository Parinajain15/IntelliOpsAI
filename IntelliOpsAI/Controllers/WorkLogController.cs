using Microsoft.AspNetCore.Mvc;
using IntelliOpsAI.Models;

namespace IntelliOpsAI.Controllers
{
    public class WorkLogController : Controller
    {
        private static List<WorkLog> logs = new List<WorkLog>();

        public IActionResult Index(string searchTerm)
        {
            var filteredLogs = logs;

            if (!string.IsNullOrEmpty(searchTerm))
            {
                filteredLogs = logs
                    .Where(x =>
                        x.EmployeeName.Contains(searchTerm, StringComparison.OrdinalIgnoreCase)
                        || x.TaskName.Contains(searchTerm, StringComparison.OrdinalIgnoreCase))
                    .ToList();
            }

            return View(filteredLogs);
        }

        public IActionResult Create()
        {
            return View();
        }

        [HttpPost]
        public IActionResult Create(WorkLog log)
        {
            log.Id = logs.Count + 1;
            log.Date = DateTime.Now;

            logs.Add(log);

            return RedirectToAction("Index");
        }
    }
}