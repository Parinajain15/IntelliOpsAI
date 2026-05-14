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

        // LOAD PAGE
        public IActionResult Index()
        {
            return View();
        }

        // UPLOAD CSV
        [HttpPost]
        public IActionResult Upload(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                ViewBag.Message = "Please select a CSV file.";
                return View("Index");
            }

            int totalRows = 0;
            int successRows = 0;
            int failedRows = 0;

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

                totalRows = records.Count;

                foreach (var row in records)
                {
                    try
                    {
                        var log = new WorkLog
                        {
                            EmployeeName = row.EmployeeName,
                            TaskName = row.TaskType,
                            HoursWorked = int.Parse(row.HoursWorked),
                            Status = row.Status
                        };

                        _context.WorkLogs.Add(log);
                        successRows++;
                    }
                    catch
                    {
                        failedRows++;
                    }
                }

                _context.SaveChanges();

                ViewBag.Message =
                    $"Import Completed → Total: {totalRows}, Success: {successRows}, Failed: {failedRows}";
            }
            catch (Exception ex)
            {
                ViewBag.Message = "Import Failed: " + ex.Message;
            }

            return View("Index");
        }
    }
}