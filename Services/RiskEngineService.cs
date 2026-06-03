using System;
using System.Collections.Generic;
using System.Linq;
using IntelliOps.Models;

namespace IntelliOps.Services
{
    public class RiskEngineService
    {
        public List<DepartmentRisk> GetDepartmentRisks(
            List<Department> departments, 
            List<TaskRecord> tasks, 
            List<Alert> alerts)
        {
            var risks = new List<DepartmentRisk>();

            if (departments == null || tasks == null || alerts == null) return risks;

            foreach (var dept in departments)
            {
                var deptTasks = tasks.Where(t => t.Department == dept.Name).ToList();
                int deptPending = deptTasks.Count(t => t.Status != "Completed");
                int deptSlaBreaches = deptTasks.Count(t => t.SlaBreached && t.Status != "Completed");
                int deptAlerts = alerts.Count(a => a.Department == dept.Name && a.Status != "Resolved");

                // Risk score from 0 to 100
                int riskScore = 15; // base level
                riskScore += deptPending * 12;
                riskScore += deptSlaBreaches * 22;
                riskScore += deptAlerts * 25;
                riskScore = Math.Min(100, riskScore);

                string status = "Stable";
                if (riskScore > 65) status = "Critical";
                else if (riskScore > 35) status = "Warning";

                string description = "";
                if (status == "Critical")
                {
                    description = $"SLA delivery is severely compromised by {deptSlaBreaches} immediate breaches and {deptAlerts} outstanding critical incidents.";
                }
                else if (status == "Warning")
                {
                    description = $"Alert warnings exist regarding {deptPending} active tasks. Monitor resource workload parameters closely.";
                }
                else
                {
                    description = $"Operational metrics well within nominal guidelines. Capacity and queues are in balance.";
                }

                string category = deptSlaBreaches > 0 ? "SLA" : deptAlerts > 0 ? "Workload" : "Resources";

                risks.Add(new DepartmentRisk
                {
                    Id = $"risk_{dept.Id}",
                    Department = dept.Name,
                    Score = riskScore,
                    Description = description,
                    Category = category,
                    Status = status
                });
            }

            return risks;
        }
    }
}
