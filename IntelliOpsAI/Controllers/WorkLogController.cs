using Microsoft.AspNetCore.Mvc;
using IntelliOpsAI.Models;
using System.Collections.Generic;

namespace IntelliOpsAI.Controllers
{
    public class WorkLogController : Controller
    {
        private static List<WorkLog> logs = new List<WorkLog>();

        public IActionResult Index()
        {
            return View(logs);
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