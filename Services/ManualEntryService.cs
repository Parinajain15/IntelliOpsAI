using System;
using System.Threading.Tasks;
using IntelliOps.Data;
using IntelliOps.Models;

namespace IntelliOps.Services
{
    public class ManualEntryService
    {
        private readonly ApplicationDbContext _context;
        private readonly AuditLogService _auditLogService;

        public ManualEntryService(ApplicationDbContext context, AuditLogService auditLogService)
        {
            _context = context;
            _auditLogService = auditLogService;
        }

        public async Task<TaskRecord> CreateTaskAsync(TaskRecord task, string createdBy, string userRole)
        {
            if (string.IsNullOrEmpty(task.Id))
            {
                task.Id = $"task_{Guid.NewGuid().ToString().Substring(0, 8)}";
            }
            task.Timestamp = DateTime.UtcNow;

            await _context.Tasks.AddAsync(task);
            await _context.SaveChangesAsync();

            await _auditLogService.AddAuditLogAsync(
                "MANUAL_ENTRY", 
                createdBy, 
                userRole, 
                $"Created individual task for {task.EmployeeName} in {task.Department}: '{task.Notes.Substring(0, Math.Min(40, task.Notes.Length))}...'"
            );

            return task;
        }

        public async Task<OperationalLog> CreateOperationalLogAsync(OperationalLog log, string createdBy, string userRole)
        {
            if (string.IsNullOrEmpty(log.Id))
            {
                log.Id = $"log_{Guid.NewGuid().ToString().Substring(0, 8)}";
            }
            log.Timestamp = DateTime.UtcNow;

            await _context.OperationalLogs.AddAsync(log);
            await _context.SaveChangesAsync();

            await _auditLogService.AddAuditLogAsync(
                "OPERATIONAL_LOG", 
                createdBy, 
                userRole, 
                $"Reported incident log type {log.Type} in department {log.Department}: '{log.Message.Substring(0, Math.Min(40, log.Message.Length))}...'"
            );

            return log;
        }
    }
}
