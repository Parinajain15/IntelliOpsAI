using System;
using System.Collections.Generic;
using System.Linq;
using IntelliOps.Models;

namespace IntelliOps.Services
{
    public class AnomalyDetectionService
    {
        public List<Anomaly> DetectAnomalies(
            List<Employee> employees, 
            List<TaskRecord> tasks, 
            List<SapConnector> saps)
        {
            var anomalies = new List<Anomaly>();
            
            if (employees == null || tasks == null || saps == null) return anomalies;

            // 1. Employee Overwork Anomalies (>45 hours worked)
            foreach (var emp in employees)
            {
                if (emp.TotalHours > 45)
                {
                    anomalies.Add(new Anomaly
                    {
                        Id = $"anom_emp_{emp.Id}",
                        Title = $"Resource Burnout Risk: {emp.Name}",
                        Department = emp.Department,
                        Severity = emp.TotalHours > 52 ? "Critical" : "High",
                        Timestamp = DateTime.UtcNow,
                        MetricName = "Workload Hours",
                        DeviationValue = $"{emp.TotalHours} hrs/week",
                        Description = $"{emp.Name} in {emp.Department} is logging {emp.TotalHours} operational hours, exceeding enterprise soft capacity limit of 45 hours."
                    });
                }
            }

            // 2. High SLA breach concentrations in departments
            var departmentNames = tasks.Select(t => t.Department).Distinct().ToList();
            foreach (var dept in departmentNames)
            {
                var deptTasks = tasks.Where(t => t.Department == dept).ToList();
                int breaches = deptTasks.Count(t => t.SlaBreached && t.Status != "Completed");
                if (breaches >= 2)
                {
                    anomalies.Add(new Anomaly
                    {
                        Id = $"anom_sla_{dept.ToLower().Replace(" ", "_")}",
                        Title = $"SLA Breach Concentration: {dept}",
                        Department = dept,
                        Severity = breaches > 2 ? "Critical" : "High",
                        Timestamp = DateTime.UtcNow,
                        MetricName = "Unresolved SLA Breaches",
                        DeviationValue = $"{breaches} parallel breaches",
                        Description = $"Multiple critical workflows in {dept} are concurrently breaching delivery thresholds."
                    });
                }
            }

            // 3. SAP Connection Breakdowns
            foreach (var sap in saps)
            {
                if (sap.Status == "Error")
                {
                    anomalies.Add(new Anomaly
                    {
                        Id = $"anom_sap_{sap.Id}",
                        Title = "SAP Sync Handshake Breakdown",
                        Department = sap.Module.Contains("MM") ? "Supply Chain" : "Engineering",
                        Severity = "High",
                        Timestamp = DateTime.UtcNow,
                        MetricName = "Connector State",
                        DeviationValue = "STATUS_GATEWAY_ERROR",
                        Description = $"Integration connector \"{sap.Name}\" for module {sap.Module} reported an active sync handshake failure."
                    });
                }
            }

            return anomalies;
        }
    }
}
