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

        // LOAD IMPORT PAGE
        public IActionResult Index()
        {
            return View();
        }

        // HANDLE CSV UPLOAD
        [HttpPost]
        public IActionResult Upload(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                ViewBag.Message = "Please select a CSV file.";
                return View("Index");
            }

            try
            {
                using var reader = new StreamReader(file.OpenReadStream());

                var config = new CsvHelper.Configuration.CsvConfiguration(CultureInfo.InvariantCulture)
                {
                    HeaderValidated = null,
                    MissingFieldFound = null
                };

                using var csv = new CsvReader(reader, config);

                var records = csv.GetRecords<dynamic>().ToList();

                foreach (var row in records)
                {
                    var log = new WorkLog
                    {
                        EmployeeName = row.EmployeeName,
                        TaskName = row.TaskType,   // IMPORTANT: CSV mapping fix
                        HoursWorked = int.Parse(row.HoursWorked),
                        Status = row.Status
                    };

                    _context.WorkLogs.Add(log);
                }

                _context.SaveChanges();

                ViewBag.Message = "CSV imported successfully!";
            }
            catch (Exception ex)
            {
                ViewBag.Message = "Error while importing CSV: " + ex.Message;
            }

            return View("Index");
        }
    }
}