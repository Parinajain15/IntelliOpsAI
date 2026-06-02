using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using IntelliOps.Data;
using IntelliOps.Models;

namespace IntelliOps.Services
{
    public class CsvImportService
    {
        private readonly ApplicationDbContext _context;
        private readonly AuditLogService _auditLogService;
        private readonly AnalyticsPipelineService _pipelineService;

        public CsvImportService(
            ApplicationDbContext context, 
            AuditLogService auditLogService,
            AnalyticsPipelineService pipelineService)
        {
            _context = context;
            _auditLogService = auditLogService;
            _pipelineService = pipelineService;
        }

        public async Task<(int Processed, int Errors, List<string> LogMessages)> ImportTasksFromCsvAsync(string csvContent, string fileName)
        {
            var logMessages = new List<string>();
            int processed = 0;
            int errors = 0;

            if (string.IsNullOrWhiteSpace(csvContent))
            {
                logMessages.Add("Empty CSV input received.");
                return (0, 1, logMessages);
            }

            var newTasksList = new List<TaskRecord>();

            using (var reader = new StringReader(csvContent))
            {
                string? header = await reader.ReadLineAsync();
                if (header == null)
                {
                    logMessages.Add("Missing CSV header row.");
                    return (0, 1, logMessages);
                }

                // Parse headers from the first row to align columns dynamically
                var headers = header.Split(',').Select(h => h.Trim('"', ' ', '\t').ToLowerInvariant()).ToList();
                int empIdx = headers.IndexOf("employeename");
                int deptIdx = headers.IndexOf("department");
                int taskIdx = headers.FindIndex(h => h == "taskname" || h == "task" || h == "notes" || h == "title" || h == "brief");
                int hoursIdx = headers.FindIndex(h => h == "hoursworked" || h == "hours" || h == "hours_worked" || h == "capacity");
                int statusIdx = headers.IndexOf("status");
                int priorityIdx = headers.IndexOf("priority");
                int slaIdx = headers.FindIndex(h => h == "slabreached" || h == "sla_breached" || h == "sla");

                // Fail-safe fallbacks if certain key headers were not mapped
                if (empIdx == -1) empIdx = 0;
                if (deptIdx == -1) deptIdx = 1;
                if (taskIdx == -1) taskIdx = 2; // maps to Notes
                if (hoursIdx == -1) hoursIdx = 3;
                if (statusIdx == -1) statusIdx = 4;

                string line;
                int rowNumber = 1;

                while ((line = await reader.ReadLineAsync()!) != null)
                {
                    rowNumber++;
                    if (string.IsNullOrWhiteSpace(line)) continue;

                    var parts = line.Split(',').Select(p => p.Trim('"', ' ', '\t')).ToArray();
                    if (parts.Length < 3)
                    {
                        errors++;
                        logMessages.Add($"Row {rowNumber}: invalid format, less than 3 columns. Got: '{line}'");
                        continue;
                    }

                    string employeeName = parts.Length > empIdx ? parts[empIdx] : string.Empty;
                    string department = parts.Length > deptIdx ? parts[deptIdx] : string.Empty;
                    string notes = parts.Length > taskIdx ? parts[taskIdx] : string.Empty;

                    if (string.IsNullOrEmpty(employeeName) || string.IsNullOrEmpty(department) || string.IsNullOrEmpty(notes))
                    {
                        errors++;
                        logMessages.Add($"Row {rowNumber}: validation failed (EmployeeName, Department, and TaskName/Notes are mandatory).");
                        continue;
                    }

                    // Parse HoursWorked
                    int hoursWorked = 10;
                    if (hoursIdx != -1 && parts.Length > hoursIdx)
                    {
                        if (int.TryParse(parts[hoursIdx], out int hw))
                        {
                            hoursWorked = hw;
                        }
                    }

                    // Parse Status
                    string status = "Pending";
                    if (statusIdx != -1 && parts.Length > statusIdx)
                    {
                        var val = parts[statusIdx];
                        if (!string.IsNullOrEmpty(val))
                        {
                            status = val;
                        }
                    }

                    // Parse Priority (deduce based on hoursWorked if not explicitly provided)
                    string priority = "Medium";
                    if (priorityIdx != -1 && parts.Length > priorityIdx)
                    {
                        var val = parts[priorityIdx];
                        if (!string.IsNullOrEmpty(val))
                        {
                            priority = val;
                        }
                    }
                    else
                    {
                        if (hoursWorked > 60) priority = "Critical";
                        else if (hoursWorked > 40) priority = "High";
                        else if (hoursWorked > 20) priority = "Medium";
                        else priority = "Low";
                    }

                    // Parse SLA breaches
                    bool slaBreached = false;
                    if (slaIdx != -1 && parts.Length > slaIdx)
                    {
                        bool.TryParse(parts[slaIdx], out slaBreached);
                    }
                    else
                    {
                        if (hoursWorked > 40 && status != "Completed")
                        {
                            slaBreached = true;
                        }
                    }

                    var newTask = new TaskRecord
                    {
                        Id = $"task_{Guid.NewGuid().ToString().Substring(0, 8)}",
                        EmployeeName = employeeName,
                        Department = department,
                        Priority = priority,
                        Notes = notes,
                        Status = status,
                        HoursWorked = hoursWorked,
                        SlaBreached = slaBreached,
                        Timestamp = DateTime.UtcNow,
                        DueDate = DateTime.UtcNow.AddDays(3)
                    };

                    newTasksList.Add(newTask);
                    processed++;
                    logMessages.Add($"Row {rowNumber}: successfully imported task for {employeeName} in {department}.");
                }
            }

            if (processed > 0 && newTasksList.Any())
            {
                // Clear existing tasks to completely replace system demo records
                var existingTasks = await _context.Tasks.ToListAsync();
                _context.Tasks.RemoveRange(existingTasks);
                await _context.SaveChangesAsync();

                // Save all new parsed tasks
                await _context.Tasks.AddRangeAsync(newTasksList);
                await _context.SaveChangesAsync();

                await _auditLogService.AddAuditLogAsync(
                    "CSV_UPLOAD", 
                    "Operations Manager", 
                    "Operations Manager", 
                    $"Imported {fileName} with {processed} tasks successfully."
                );

                // Run end-to-end recalculation pipeline
                await _pipelineService.RecalculatePipelineAsync();
            }

            return (processed, errors, logMessages);
        }
    }
}
