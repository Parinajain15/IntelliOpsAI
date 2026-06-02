using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using IntelliOps.Data;
using IntelliOps.Models;

namespace IntelliOps.Services
{
    public class AlertService
    {
        private readonly ApplicationDbContext _context;
        private readonly AuditLogService _auditLogService;

        public AlertService(ApplicationDbContext context, AuditLogService auditLogService)
        {
            _context = context;
            _auditLogService = auditLogService;
        }

        public async Task<Alert?> GetAlertAsync(string id)
        {
            return await _context.Alerts.FirstOrDefaultAsync(a => a.Id == id);
        }

        public async Task<List<Alert>> GetActiveAlertsAsync()
        {
            return await _context.Alerts.ToListAsync();
        }

        public async Task<Alert?> TransitionAlertAsync(
            string alertId, 
            string status, 
            string owner, 
            string? commentText, 
            string? resolutionNotes, 
            string editorName, 
            string editorRole)
        {
            var alert = await _context.Alerts.FirstOrDefaultAsync(a => a.Id == alertId);
            if (alert == null) return null;

            if (status != null)
            {
                status = status.Trim();
                if (string.Equals(status, "Open Queue", StringComparison.OrdinalIgnoreCase))
                    status = "Open";
                else if (string.Equals(status, "In Progress Queue", StringComparison.OrdinalIgnoreCase))
                    status = "In Progress";
                else if (string.Equals(status, "Resolved Queue", StringComparison.OrdinalIgnoreCase))
                    status = "Resolved";
                else if (string.Equals(status, "Closed", StringComparison.OrdinalIgnoreCase))
                    status = "Resolved";
                else if (string.Equals(status, "Completed", StringComparison.OrdinalIgnoreCase))
                    status = "Resolved";
            }

            alert.Status = status;
            alert.AssignedOwner = owner;

            if (!string.IsNullOrWhiteSpace(commentText))
            {
                alert.Comments.Add(new AlertComment
                {
                    User = editorName,
                    Text = commentText,
                    Timestamp = DateTime.UtcNow
                });
            }

            if (status == "Resolved")
            {
                alert.ResolvedDate = DateTime.UtcNow;
                alert.ResolutionNotes = resolutionNotes ?? "Corrected underlying operational variance.";
            }

            await _context.SaveChangesAsync();

            await _auditLogService.AddAuditLogAsync(
                "ALERT_UPDATE", 
                editorName, 
                editorRole, 
                $"Transitioned alert '{alert.Title}' status to {status} by owner {owner}"
            );

            return alert;
        }
    }
}
