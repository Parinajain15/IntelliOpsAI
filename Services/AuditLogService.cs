using System;
using System.Threading.Tasks;
using IntelliOps.Data;
using IntelliOps.Models;

namespace IntelliOps.Services
{
    public class AuditLogService
    {
        private readonly ApplicationDbContext _context;

        public AuditLogService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<AuditLog> AddAuditLogAsync(string action, string user, string role, string details)
        {
            var log = new AuditLog
            {
                Id = $"aud_{Guid.NewGuid().ToString().Substring(0, 8)}",
                Timestamp = DateTime.UtcNow,
                Action = action,
                User = user,
                Role = role,
                Details = details
            };

            await _context.AuditLogs.AddAsync(log);
            await _context.SaveChangesAsync();
            return log;
        }
    }
}
