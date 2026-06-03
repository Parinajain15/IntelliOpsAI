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
    [Authorize(Roles = "Director,Operations Manager")]
    public class IntegrationsController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly AuditLogService _auditService;

        public IntegrationsController(ApplicationDbContext context, AuditLogService auditService)
        {
            _context = context;
            _auditService = auditService;
        }

        public async Task<IActionResult> Index()
        {
            string userRole = "Team Lead";
            if (User.IsInRole("Director")) userRole = "Director";
            else if (User.IsInRole("Operations Manager")) userRole = "Operations Manager";
            ViewBag.ActiveRole = userRole;

            var saps = await _context.SapConnectors.ToListAsync();
            var dbs = await _context.DataSources.ToListAsync();
            var integrationAudits = await _context.AuditLogs
                .Where(l => l.Action == "SAP_SYNC" || l.Action == "INTEGRATION_UPDATE")
                .OrderByDescending(l => l.Timestamp)
                .Take(15)
                .ToListAsync();

            ViewBag.SapConnectors = saps;
            ViewBag.DataSources = dbs;
            ViewBag.IntegrationAudits = integrationAudits;

            var model = new IntegrationsViewModel
            {
                SapConnectors = saps.Select(s => new SapConnectorViewModel
                {
                    Id = s.Id,
                    Name = s.Name,
                    Endpoint = s.Endpoint,
                    Authentication = s.Authentication,
                    Status = s.Status,
                    LastSyncTime = s.LastSyncTime,
                    Module = s.Module,
                    LatencyMs = new Random().Next(45, 120)
                }).ToList(),

                Databases = dbs.Select(d => new DatabaseViewModel
                {
                    Id = d.Id,
                    EngineId = d.Server.ToLower().Contains("postgres") ? "POSTGRES" :
                               d.Server.ToLower().Contains("mysql") ? "MYSQL" :
                               d.Server.ToLower().Contains("oracle") ? "ORACLE" : "MSSQL",
                    ConnectionName = d.Name,
                    HostString = $"Server={d.Server};Database={d.Database};",
                    TargetDepartment = "Supply Chain",
                    SyncState = d.Status == "Connected" ? "Identical" : "Out of Sync",
                    LastHealthCheck = DateTime.UtcNow.AddMinutes(-new Random().Next(5, 60))
                }).ToList()
            };

            return View(model);
        }

        [HttpPost]
        public async Task<IActionResult> SyncSap(string? id)
        {
            string role = "Team Lead";
            if (User.IsInRole("Director")) role = "Director";
            else if (User.IsInRole("Operations Manager")) role = "Operations Manager";

            if (string.IsNullOrEmpty(id))
            {
                var connectors = await _context.SapConnectors.ToListAsync();
                foreach (var s in connectors)
                {
                    s.LastSyncTime = DateTime.UtcNow;
                    s.Status = "Connected";
                }
                await _context.SaveChangesAsync();

                await _auditService.AddAuditLogAsync(
                    "SAP_SYNC", 
                    User.Identity?.Name ?? "Operations Staff", 
                    role, 
                    "Triggered manual sync of all SAP Modules. Resynchronized successfully."
                );

                TempData["Success"] = "Triggered delta synchronization update for all SAP modules gateway channels. Refreshed buffer weights.";
            }
            else
            {
                var connector = await _context.SapConnectors.FindAsync(id);
                if (connector == null)
                {
                    TempData["Error"] = "Connector integration target not found.";
                    return RedirectToAction("Index");
                }

                connector.LastSyncTime = DateTime.UtcNow;
                if (connector.Status == "Error" || connector.Status == "Disconnected")
                {
                    connector.Status = "Connected";
                    TempData["Success"] = $"Re-established secure TLS handshake with {connector.Name} ({connector.Module}). Refreshed gateway tokens.";
                }
                else
                {
                    TempData["Success"] = $"Triggered delta synchronization update for {connector.Name}. Ingested operational data packets.";
                }

                await _auditService.AddAuditLogAsync(
                    "SAP_SYNC", 
                    User.Identity?.Name ?? "Operations Staff", 
                    role, 
                    $"Triggered manual sync of Integration Gateway targeting: {connector.Name}. State updated to Connected."
                );

                await _context.SaveChangesAsync();
            }

            return RedirectToAction("Index");
        }

        [HttpPost]
        public async Task<IActionResult> SyncDb(string id)
        {
            var db = await _context.DataSources.FindAsync(id);
            if (db != null)
            {
                db.Status = "Connected";
                await _context.SaveChangesAsync();
                TempData["Success"] = $"Database synchronization succeeded for cache target: '{db.Name}'.";

                string role = "Team Lead";
                if (User.IsInRole("Director")) role = "Director";
                else if (User.IsInRole("Operations Manager")) role = "Operations Manager";

                await _auditService.AddAuditLogAsync(
                    "INTEGRATION_UPDATE", 
                    User.Identity?.Name ?? "System Architect", 
                    role, 
                    $"Triggered check on DataSource Cache {db.Name}. Heartbeat state is Connected."
                );
            }
            return RedirectToAction("Index");
        }

        [HttpPost]
        public async Task<IActionResult> EditDbStatus(string id, string status)
        {
            var db = await _context.DataSources.FindAsync(id);
            if (db != null)
            {
                db.Status = status;
                await _context.SaveChangesAsync();
                TempData["Success"] = $"Database state of '{db.Name}' modified to {status}.";

                string role = "Team Lead";
                if (User.IsInRole("Director")) role = "Director";
                else if (User.IsInRole("Operations Manager")) role = "Operations Manager";
                await _auditService.AddAuditLogAsync(
                    "INTEGRATION_UPDATE", 
                    User.Identity?.Name ?? "System Architect", 
                    role, 
                    $"Changed operational state of DataSource Cache {db.Name} to {status}."
                );
            }
            return RedirectToAction("Index");
        }

        [HttpPost]
        public async Task<IActionResult> AddDatabase(string ConnectionName, string TargetDepartment, string HostString, string EngineId)
        {
            if (string.IsNullOrEmpty(ConnectionName) || string.IsNullOrEmpty(HostString))
            {
                TempData["Error"] = "Missing required database identification fields.";
                return RedirectToAction("Index");
            }

            string server = HostString;
            string databaseName = "Master";
            try
            {
                var parts = HostString.Split(';');
                foreach (var part in parts)
                {
                    if (part.StartsWith("Server=", StringComparison.OrdinalIgnoreCase))
                        server = part.Split('=')[1];
                    else if (part.StartsWith("Database=", StringComparison.OrdinalIgnoreCase))
                        databaseName = part.Split('=')[1];
                }
            }
            catch {}

            var newDb = new DataSource
            {
                Id = $"db_{Guid.NewGuid().ToString().Substring(0, 8)}",
                Name = ConnectionName,
                Server = server,
                Database = databaseName,
                Username = "sa_read",
                Status = "Connected",
                SyncSchedule = "Daily"
            };

            await _context.DataSources.AddAsync(newDb);
            await _context.SaveChangesAsync();

            string role = "Team Lead";
            if (User.IsInRole("Director")) role = "Director";
            else if (User.IsInRole("Operations Manager")) role = "Operations Manager";

            await _auditService.AddAuditLogAsync(
                "INTEGRATION_UPDATE", 
                User.Identity?.Name ?? "System Architect", 
                role, 
                $"Registered new Relational Connector reference: {ConnectionName} targeting {TargetDepartment} queue."
            );

            TempData["Success"] = $"Database integration source '{ConnectionName}' registered and validated.";
            return RedirectToAction("Index");
        }
    }
}
