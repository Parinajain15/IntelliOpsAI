using IntelliOpsAI.Data;
using IntelliOpsAI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IntelliOpsAI.Controllers
{
    public class WorkLogController : Controller
    {
        private readonly ApplicationDbContext _context;

        public WorkLogController(ApplicationDbContext context)
        {
            _context = context;
        }

        // VIEW LOGS
        public async Task<IActionResult> Index(string searchTerm)
        {
            var logs = from l in _context.WorkLogs
                       select l;

            if (!string.IsNullOrEmpty(searchTerm))
            {
                logs = logs.Where(x =>
                    x.EmployeeName.Contains(searchTerm) ||
                    x.TaskName.Contains(searchTerm));
            }

            return View(await logs.ToListAsync());
        }

        // CREATE GET
        public IActionResult Create()
        {
            return View();
        }

        // CREATE POST
        [HttpPost]
        public async Task<IActionResult> Create(WorkLog log)
        {
            log.Date = DateTime.Now;

            _context.WorkLogs.Add(log);

            await _context.SaveChangesAsync();

            return RedirectToAction("Index");
        }

        // EDIT GET
        public async Task<IActionResult> Edit(int id)
        {
            var log = await _context.WorkLogs.FindAsync(id);

            return View(log);
        }

        // EDIT POST
        [HttpPost]
        public async Task<IActionResult> Edit(WorkLog updatedLog)
        {
            _context.WorkLogs.Update(updatedLog);

            await _context.SaveChangesAsync();

            return RedirectToAction("Index");
        }

        // DELETE
        public async Task<IActionResult> Delete(int id)
        {
            var log = await _context.WorkLogs.FindAsync(id);

            if (log != null)
            {
                _context.WorkLogs.Remove(log);

                await _context.SaveChangesAsync();
            }

            return RedirectToAction("Index");
        }
    }
}