using System;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using IntelliOps.Data;
using IntelliOps.Services;

namespace IntelliOps.Controllers
{
    [Authorize(Roles = "Director,Operations Manager")]
    public class UploadController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly CsvImportService _importService;

        public UploadController(ApplicationDbContext context, CsvImportService importService)
        {
            _context = context;
            _importService = importService;
        }

        public async Task<IActionResult> Index()
        {
            string userRole = "Team Lead";
            if (User.IsInRole("Director")) userRole = "Director";
            else if (User.IsInRole("Operations Manager")) userRole = "Operations Manager";
            ViewBag.ActiveRole = userRole;

            var auditLogEntries = await _context.AuditLogs
                .Where(l => l.Action == "CSV_UPLOAD")
                .OrderByDescending(l => l.Timestamp)
                .ToListAsync();

            ViewBag.UploadAudits = auditLogEntries;
            return View();
        }

        [HttpPost]
        public async Task<IActionResult> Import(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                TempData["Error"] = "Please select a valid CSV file first.";
                return RedirectToAction("Index");
            }

            try
            {
                string content = string.Empty;
                using (var reader = new StreamReader(file.OpenReadStream(), Encoding.UTF8))
                {
                    content = await reader.ReadToEndAsync();
                }

                var (processed, errors, logs) = await _importService.ImportTasksFromCsvAsync(content, file.FileName);

                TempData["Success"] = $"File '{file.FileName}' ingested. Successfully processed: {processed} tasks. Errors: {errors}.";
                TempData["Logs"] = string.Join("\n", logs);
            }
            catch (Exception ex)
            {
                TempData["Error"] = $"Failure reading file: {ex.Message}";
            }

            return RedirectToAction("Index");
        }
    }
}
