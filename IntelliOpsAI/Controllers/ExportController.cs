using ClosedXML.Excel;
using IntelliOpsAI.Data;
using Microsoft.AspNetCore.Mvc;

namespace IntelliOpsAI.Controllers
{
    public class ExportController : Controller
    {
        private readonly ApplicationDbContext _context;

        public ExportController(ApplicationDbContext context)
        {
            _context = context;
        }

        public IActionResult ExportToExcel()
        {
            var logs = _context.WorkLogs.ToList();

            using (var workbook = new XLWorkbook())
            {
                var worksheet =
                    workbook.Worksheets.Add("WorkLogs");

                // HEADERS

                worksheet.Cell(1, 1).Value = "Employee";
                worksheet.Cell(1, 2).Value = "Department";
                worksheet.Cell(1, 3).Value = "Task";
                worksheet.Cell(1, 4).Value = "System";
                worksheet.Cell(1, 5).Value = "Hours";
                worksheet.Cell(1, 6).Value = "Status";
                worksheet.Cell(1, 7).Value = "Date";

                int row = 2;

                foreach (var log in logs)
                {
                    worksheet.Cell(row, 1).Value =
                        log.EmployeeName;

                    worksheet.Cell(row, 2).Value =
                        log.Department;

                    worksheet.Cell(row, 3).Value =
                        log.TaskName;

                    worksheet.Cell(row, 4).Value =
                        log.System;

                    worksheet.Cell(row, 5).Value =
                        log.HoursWorked;

                    worksheet.Cell(row, 6).Value =
                        log.Status;

                    worksheet.Cell(row, 7).Value =
                        log.Date.ToString("dd-MM-yyyy");

                    row++;
                }

                using (var stream = new MemoryStream())
                {
                    workbook.SaveAs(stream);

                    var content = stream.ToArray();

                    return File(
                        content,
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                        "WorkforceReport.xlsx"
                    );
                }
            }
        }
    }
}