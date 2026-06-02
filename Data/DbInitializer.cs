using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using IntelliOps.Models;

namespace IntelliOps.Data
{
    public static class DbInitializer
    {
        public static void Initialize(ApplicationDbContext context)
        {
            // Purge previously seeded/demo operational records from existing SQLite DB if any exist
            var seededTaskIds = new HashSet<string> {
                "task_01", "task_02", "task_03", "task_04", "task_05", "task_06", "task_07", "task_08", "task_09", "task_10", "task_11", "task_12", "task_13", "task_14", "task_15", "task_16", "task_17"
            };

            bool hasSeededTasks = context.Tasks.Any(t => seededTaskIds.Contains(t.Id));
            
            // If we have seeded/demo records in DB, purge them entirely
            if (hasSeededTasks)
            {
                var seededEmpIds = new HashSet<string> { "emp_01", "emp_02", "emp_03", "emp_04", "emp_05", "emp_06", "emp_07", "emp_08", "emp_09", "emp_10" };
                var seededDeptIds = new HashSet<string> { "dept_01", "dept_02", "dept_03", "dept_04" };
                var seededAlertIds = new HashSet<string> { "alert_01", "alert_02", "alert_03", "alert_04", "alert_05" };
                var seededLogIds = new HashSet<string> { "log_01", "log_02", "log_03", "log_04", "log_05" };

                var oldTasks = context.Tasks.Where(t => seededTaskIds.Contains(t.Id)).ToList();
                if (oldTasks.Any()) context.Tasks.RemoveRange(oldTasks);

                var oldEmps = context.Employees.Where(e => seededEmpIds.Contains(e.Id)).ToList();
                if (oldEmps.Any()) context.Employees.RemoveRange(oldEmps);

                var oldDepts = context.Departments.Where(d => seededDeptIds.Contains(d.Id)).ToList();
                if (oldDepts.Any()) context.Departments.RemoveRange(oldDepts);

                var oldAlerts = context.Alerts.Where(a => seededAlertIds.Contains(a.Id)).ToList();
                if (oldAlerts.Any()) context.Alerts.RemoveRange(oldAlerts);

                var oldLogs = context.OperationalLogs.Where(l => seededLogIds.Contains(l.Id)).ToList();
                if (oldLogs.Any()) context.OperationalLogs.RemoveRange(oldLogs);

                var oldBriefings = context.AiInsightLogs.Where(b => b.Id == "brief_01" || b.Id.StartsWith("brief_")).ToList();
                if (oldBriefings.Any()) context.AiInsightLogs.RemoveRange(oldBriefings);

                context.SaveChanges();
            }

            // Seed SAP Connectors if they do not exist
            if (!context.SapConnectors.Any())
            {
                var sapConnectors = new List<SapConnector>
                {
                    new SapConnector { Id = "sap_01", Name = "Core ERP Integration", Endpoint = "https://sap-gateway.internal.corp/odata/v4/MM", Authentication = "OAuth2", Status = "Connected", LastSyncTime = DateTime.UtcNow.AddHours(-4), Module = "SAP MM" },
                    new SapConnector { Id = "sap_02", Name = "Global Sales Channel", Endpoint = "https://sap-gateway.internal.corp/odata/v4/SD", Authentication = "Basic", Status = "Connected", LastSyncTime = DateTime.UtcNow.AddHours(-2), Module = "SAP SD" },
                    new SapConnector { Id = "sap_03", Name = "HCM SuccessFactors Connector", Endpoint = "https://successfactors.internal.corp/api/v1", Authentication = "OAuth2", Status = "Disconnected", LastSyncTime = DateTime.UtcNow.AddDays(-3), Module = "SAP SuccessFactors" },
                    new SapConnector { Id = "sap_04", Name = "Shop Floor PP Synchronizer", Endpoint = "https://sap-pp-factory.internal.corp/rfc", Authentication = "API Key", Status = "Error", LastSyncTime = DateTime.UtcNow.AddDays(-5), Module = "SAP PP" }
                };
                context.SapConnectors.AddRange(sapConnectors);
            }

            // Seed Data Sources if they do not exist
            if (!context.DataSources.Any())
            {
                var dataSources = new List<DataSource>
                {
                    new DataSource { Id = "db_01", Name = "Enterprise Inventory Cache", Server = "sql-prod-inv.internal.corp", Database = "InventoryDB", Username = "sa_ops", Status = "Connected", SyncSchedule = "Hourly" },
                    new DataSource { Id = "db_02", Name = "Ticketing Historical DB", Server = "sql-prod-support.internal.corp", Database = "CustomerCare_Archive", Username = "read_support", Status = "Connected", SyncSchedule = "Daily" },
                    new DataSource { Id = "db_03", Name = "Staffing Database Backup", Server = "sql-hr-backup.internal.corp", Database = "HR_Records", Username = "root_backup", Status = "Disconnected", SyncSchedule = "Weekly" }
                };
                context.DataSources.AddRange(dataSources);
            }

            // Seed Clean Neutral Departments if not present
            if (!context.Departments.Any())
            {
                var departments = new List<Department>
                {
                    new Department { Id = "dept_01", Name = "Engineering", HealthScore = 100, RiskLevel = "Low", Manager = "Operations Manager", CompletionRate = 100, ActiveAlertsCount = 0, WorkloadScore = 0 },
                    new Department { Id = "dept_02", Name = "Supply Chain", HealthScore = 100, RiskLevel = "Low", Manager = "Operations Manager", CompletionRate = 100, ActiveAlertsCount = 0, WorkloadScore = 0 },
                    new Department { Id = "dept_03", Name = "Quality Assurance", HealthScore = 100, RiskLevel = "Low", Manager = "Operations Manager", CompletionRate = 100, ActiveAlertsCount = 0, WorkloadScore = 0 },
                    new Department { Id = "dept_04", Name = "Customer Support", HealthScore = 100, RiskLevel = "Low", Manager = "Operations Manager", CompletionRate = 100, ActiveAlertsCount = 0, WorkloadScore = 0 }
                };
                context.Departments.AddRange(departments);
            }

            context.SaveChanges();
        }

        public static async Task SeedIdentityAsync(UserManager<IdentityUser> userManager, RoleManager<IdentityRole> roleManager)
        {
            // Seed Roles
            string[] roleNames = { "Director", "Operations Manager", "Team Lead" };
            foreach (var roleName in roleNames)
            {
                if (!await roleManager.RoleExistsAsync(roleName))
                {
                    await roleManager.CreateAsync(new IdentityRole(roleName));
                }
            }

            // Seed Director User
            var directorEmail = "director@intelliops.ai";
            if (await userManager.FindByEmailAsync(directorEmail) == null)
            {
                var user = new IdentityUser { UserName = directorEmail, Email = directorEmail, EmailConfirmed = true };
                var result = await userManager.CreateAsync(user, "IntelliOps123!");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(user, "Director");
                }
            }

            // Seed Operations Manager User
            var managerEmail = "manager@intelliops.ai";
            if (await userManager.FindByEmailAsync(managerEmail) == null)
            {
                var user = new IdentityUser { UserName = managerEmail, Email = managerEmail, EmailConfirmed = true };
                var result = await userManager.CreateAsync(user, "IntelliOps123!");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(user, "Operations Manager");
                }
            }

            // Seed Team Lead User
            var leadEmail = "lead@intelliops.ai";
            if (await userManager.FindByEmailAsync(leadEmail) == null)
            {
                var user = new IdentityUser { UserName = leadEmail, Email = leadEmail, EmailConfirmed = true };
                var result = await userManager.CreateAsync(user, "IntelliOps123!");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(user, "Team Lead");
                }
            }
        }
    }
}
