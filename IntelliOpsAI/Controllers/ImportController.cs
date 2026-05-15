using CsvHelper;
using IntelliOpsAI.Data;
using IntelliOpsAI.Models;
using Microsoft.AspNetCore.Mvc;
using System.Globalization;

namespace IntelliOpsAI.Controllers
{
    public class ImportController : Controller
    {
        private readonly ApplicationDbContext _context;

        public ImportController(ApplicationDbContext context)
        {
            _context = context;
        }

        public IActionResult Index()
        {
            return View();
        }

        [HttpPost]
        public IActionResult Upload(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                ViewBag.Message = "No file selected";
                return View("Index");
            }

            using (var reader = new StreamReader(file.OpenReadStream()))
            using (var csv = new CsvReader(reader, CultureInfo.InvariantCulture))
            {
                var records = csv.GetRecords<WorkLogCsv>().ToList();

                foreach (var record in records)
                {
                    var workLog = new WorkLog
                    {
                        EmployeeName = record.EmployeeName,
                        TaskName = record.TaskType,

                        // 🔥 THIS WAS MISSING
                        System = record.System,

                        HoursWorked = record.HoursWorked,
                        Status = record.Status,
                        Date = record.Date
                    };

                    _context.WorkLogs.Add(workLog);
                }

                _context.SaveChanges();
            }

            ViewBag.Message = "CSV Uploaded Successfully";

            return View("Index");
        }
    }
}