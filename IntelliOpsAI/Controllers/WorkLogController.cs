using Microsoft.AspNetCore.Mvc;
using IntelliOpsAI.Models;

namespace IntelliOpsAI.Controllers
{
    public class WorkLogController : Controller
    {
        private static List<WorkLog> logs = new List<WorkLog>();

        // VIEW LOGS
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

        // CREATE GET
        public IActionResult Create()
        {
            return View();
        }

        // CREATE POST
        [HttpPost]
        public IActionResult Create(WorkLog log)
        {
            log.Id = logs.Count + 1;
            log.Date = DateTime.Now;

            logs.Add(log);

            return RedirectToAction("Index");
        }

        // EDIT GET
        public IActionResult Edit(int id)
        {
            var log = logs.FirstOrDefault(x => x.Id == id);

            return View(log);
        }

        // EDIT POST
        [HttpPost]
        public IActionResult Edit(WorkLog updatedLog)
        {
            var existingLog = logs.FirstOrDefault(x => x.Id == updatedLog.Id);

            if (existingLog != null)
            {
                existingLog.EmployeeName = updatedLog.EmployeeName;
                existingLog.TaskName = updatedLog.TaskName;
                existingLog.HoursWorked = updatedLog.HoursWorked;
                existingLog.Status = updatedLog.Status;
            }

            return RedirectToAction("Index");
        }

        // DELETE
        public IActionResult Delete(int id)
        {
            var log = logs.FirstOrDefault(x => x.Id == id);

            if (log != null)
            {
                logs.Remove(log);
            }

            return RedirectToAction("Index");
        }
    }
}