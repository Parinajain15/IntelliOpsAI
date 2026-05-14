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
            if (file != null && file.Length > 0)
            {
                using (var reader = new StreamReader(file.OpenReadStream()))
                using (var csv = new CsvReader(reader, CultureInfo.InvariantCulture))
                {
                    var records = csv.GetRecords<WorkLog>().ToList();

                    foreach (var record in records)
                    {
                        _context.WorkLogs.Add(record);
                    }

                    _context.SaveChanges();
                }

                ViewBag.Message = "CSV imported successfully!";
            }

            return View("Index");
        }
    }
}