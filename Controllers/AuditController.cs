using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using IntelliOps.Data;
using IntelliOps.Models;
using IntelliOps.Services;

namespace IntelliOps.Controllers
{
    [Authorize]
    public class AuditController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly AuditLogService _auditService;

        public AuditController(ApplicationDbContext context, AuditLogService auditService)
        {
            _context = context;
            _auditService = auditService;
        }

        public async Task<IActionResult> Index(string filter = "all", string search = "")
        {
            // Resolve active role
            string role = "Team Lead";
            if (User.IsInRole("Director")) role = "Director";
            else if (User.IsInRole("Operations Manager")) role = "Operations Manager";
            ViewBag.ActiveRole = role;

            // Ensure we have some highly realistic seed logs if none exist in the database yet
            if (!await _context.AuditLogs.AnyAsync())
            {
                var seedLogs = new List<AuditLog>
                {
                    new AuditLog
                    {
                        Id = "aud_seed01",
                        Timestamp = DateTime.UtcNow.AddMinutes(-12),
                        Action = "RECOMMENDATION_STATUS_UPDATE",
                        User = "director@intelliops.ai",
                        Role = "Director",
                        Details = "Updated mitigation status of recommendation 'rec_sla_mit_01' to 'In Progress'. Plan: Reassign priority logistics workflow."
                    },
                    new AuditLog
                    {
                        Id = "aud_seed02",
                        Timestamp = DateTime.UtcNow.AddHours(-1),
                        Action = "CSV_UPLOAD",
                        User = "manager@intelliops.ai",
                        Role = "Operations Manager",
                        Details = "Imported raw_ops_metrics_june.csv with 25 task records successfully. Pipeline recalculated in 820ms."
                    },
                    new AuditLog
                    {
                        Id = "aud_seed03",
                        Timestamp = DateTime.UtcNow.AddHours(-2).AddMinutes(-15),
                        Action = "ALERT_UPDATE",
                        User = "lead@intelliops.ai",
                        Role = "Team Lead",
                        Details = "Transitioned alert 'Queue Congestion in Quality Assurance' status to In Progress. Assigned to David Vance."
                    },
                    new AuditLog
                    {
                        Id = "aud_seed04",
                        Timestamp = DateTime.UtcNow.AddHours(-4),
                        Action = "SAP_SYNC",
                        User = "System Optimizer",
                        Role = "Operations Manager",
                        Details = "Triggered manual sync of Integration Gateway targeting: HCM SuccessFactors. Handshake succeeded and 14 records synced."
                    },
                    new AuditLog
                    {
                        Id = "aud_seed05",
                        Timestamp = DateTime.UtcNow.AddHours(-6),
                        Action = "GET_RISK_FORECAST",
                        User = "manager@intelliops.ai",
                        Role = "Operations Manager",
                        Details = "Rendered 7-day risk forecast engine. Identified 1 critical risk and 3 high risk indicators across active queues."
                    },
                    new AuditLog
                    {
                        Id = "aud_seed06",
                        Timestamp = DateTime.UtcNow.AddHours(-8),
                        Action = "MANUAL_ENTRY",
                        User = "lead@intelliops.ai",
                        Role = "Team Lead",
                        Details = "Created individual task for Alice Smith in QA: 'Re-audit release candidate 4.2 package files'."
                    },
                    new AuditLog
                    {
                        Id = "aud_seed07",
                        Timestamp = DateTime.UtcNow.AddDays(-1).AddHours(-2),
                        Action = "INTEGRATION_UPDATE",
                        User = "System Administrator",
                        Role = "Director",
                        Details = "Triggered check on DataSource Cache 'Enterprise Inventory Cache'. Heartbeat state is Connected."
                    },
                    new AuditLog
                    {
                        Id = "aud_seed08",
                        Timestamp = DateTime.UtcNow.AddDays(-1).AddHours(-5),
                        Action = "SLA_RESOLVED",
                        User = "director@intelliops.ai",
                        Role = "Director",
                        Details = "Manually completed breached SLA task 'Urgent security hotfix deployment' (Assigned to: Marcus Aurelius)."
                    }
                };

                await _context.AuditLogs.AddRangeAsync(seedLogs);
                await _context.SaveChangesAsync();
            }

            // Retrieve all raw events
            var rawLogs = await _context.AuditLogs
                .OrderByDescending(l => l.Timestamp)
                .ToListAsync();

            // Calculate KPIs globally over all logs before filtering
            ViewBag.KpiTotalEvents = rawLogs.Count;
            ViewBag.KpiCsvUploads = rawLogs.Count(l => l.Action == "CSV_UPLOAD");
            ViewBag.KpiMitigations = rawLogs.Count(l => l.Action == "RECOMMENDATION_STATUS_UPDATE" || l.Action == "RECOMMENDATION_EXECUTE");
            ViewBag.KpiAlertTransitions = rawLogs.Count(l => l.Action == "ALERT_UPDATE" || l.Action == "SLA_RESOLVED");
            ViewBag.KpiRiskRecalcs = rawLogs.Count(l => l.Action == "GET_RISK_FORECAST" || l.Action == "RISK_RECALCULATE");

            // Apply selected filter
            var query = rawLogs.AsQueryable();

            if (!string.IsNullOrEmpty(filter) && filter != "all")
            {
                switch (filter.ToLower())
                {
                    case "today":
                        DateTime todayUtc = DateTime.UtcNow.Date;
                        query = query.Where(l => l.Timestamp >= todayUtc);
                        break;
                    case "csv":
                        query = query.Where(l => l.Action == "CSV_UPLOAD");
                        break;
                    case "mitigations":
                        query = query.Where(l => l.Action == "RECOMMENDATION_STATUS_UPDATE" || l.Action == "RECOMMENDATION_EXECUTE");
                        break;
                    case "alerts":
                        query = query.Where(l => l.Action == "ALERT_UPDATE" || l.Action == "SLA_RESOLVED");
                        break;
                    case "predictions":
                        query = query.Where(l => l.Action == "GET_RISK_FORECAST" || l.Action == "RISK_RECALCULATE");
                        break;
                    case "connectors":
                        query = query.Where(l => l.Action == "SAP_SYNC" || l.Action == "INTEGRATION_UPDATE");
                        break;
                }
            }

            // Apply search query
            if (!string.IsNullOrEmpty(search))
            {
                string s = search.ToLower().Trim();
                query = query.Where(l => 
                    l.Details.ToLower().Contains(s) || 
                    l.User.ToLower().Contains(s) || 
                    l.Role.ToLower().Contains(s) || 
                    l.Action.ToLower().Contains(s)
                );
            }

            // Convert to list for rendering
            var filteredLogs = query.ToList();

            ViewBag.ActiveFilter = filter;
            ViewBag.SearchQuery = search;

            return View(filteredLogs);
        }
    }
}
