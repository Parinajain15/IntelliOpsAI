/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  Employee, 
  Department, 
  TaskRecord, 
  OperationalLog, 
  Alert, 
  DepartmentRisk, 
  PredictionResult, 
  Anomaly, 
  Recommendation, 
  SapConnector, 
  ApiIntegration, 
  DataSource, 
  AuditLog, 
  AiInsightLog 
} from '../src/types.js';

// Seed initial date as standard format
const getPastDate = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
};

const getFutureDate = (daysAhead: number) => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString();
};

export class EnterpriseDatabase {
  isSeededDataActive = false;

  clearSeededData() {
    this.tasks = [];
    this.employees = [];
    this.departments = [];
    this.alerts = [];
    this.operationalLogs = [];
    this.aiBriefings = [];
    this.isSeededDataActive = false;
  }

  employees: Employee[] = [];

  departments: Department[] = [
    { id: 'dept_01', name: 'Engineering', healthScore: 100, riskLevel: 'Low', manager: 'Operations Manager', completionRate: 100, activeAlertsCount: 0, workloadScore: 0 },
    { id: 'dept_02', name: 'Supply Chain', healthScore: 100, riskLevel: 'Low', manager: 'Operations Manager', completionRate: 100, activeAlertsCount: 0, workloadScore: 0 },
    { id: 'dept_03', name: 'Quality Assurance', healthScore: 100, riskLevel: 'Low', manager: 'Operations Manager', completionRate: 100, activeAlertsCount: 0, workloadScore: 0 },
    { id: 'dept_04', name: 'Customer Support', healthScore: 100, riskLevel: 'Low', manager: 'Operations Manager', completionRate: 100, activeAlertsCount: 0, workloadScore: 0 }
  ];

  tasks: TaskRecord[] = [];

  operationalLogs: OperationalLog[] = [];

  alerts: Alert[] = [];

  sapConnectors: SapConnector[] = [
    { id: 'sap_01', name: 'Core ERP Integration', endpoint: 'https://sap-gateway.internal.corp/odata/v4/MM', authentication: 'OAuth2', status: 'Connected', lastSyncTime: getPastDate(0.2), module: 'SAP MM' },
    { id: 'sap_02', name: 'Global Sales Channel', endpoint: 'https://sap-gateway.internal.corp/odata/v4/SD', authentication: 'Basic', status: 'Connected', lastSyncTime: getPastDate(0.1), module: 'SAP SD' },
    { id: 'sap_03', name: 'HCM SuccessFactors Connector', endpoint: 'https://successfactors.internal.corp/api/v1', authentication: 'OAuth2', status: 'Disconnected', lastSyncTime: getPastDate(3), module: 'SAP SuccessFactors' },
    { id: 'sap_04', name: 'Shop Floor PP Synchronizer', endpoint: 'https://sap-pp-factory.internal.corp/rfc', authentication: 'API Key', status: 'Error', lastSyncTime: getPastDate(5), module: 'SAP PP' }
  ];

  apiIntegrations: ApiIntegration[] = [
    { id: 'api_01', name: 'External Shipping Carrier API', url: 'https://api.dhl-enterprise.com/v2/orders', token: 'dhl_test_tok_991823', status: 'Active', frequency: 'Hourly', lastSync: getPastDate(0.05) },
    { id: 'api_02', name: 'Workday HR Rest Endpoint', url: 'https://api.workday.internal/v4/staff', token: 'wd_auth_token_88123', status: 'Active', frequency: 'Daily', lastSync: getPastDate(1.1) },
    { id: 'api_03', name: 'ServiceNow ITSM Proxy', url: 'https://corp-it.servicenow.com/api/incident', token: 'sn_token_11203', status: 'Inactive', frequency: 'Real-time', lastSync: getPastDate(12) }
  ];

  dataSources: DataSource[] = [
    { id: 'db_01', name: 'Enterprise Inventory Cache', server: 'sql-prod-inv.internal.corp', database: 'InventoryDB', username: 'sa_ops', status: 'Connected', syncSchedule: 'Hourly' },
    { id: 'db_02', name: 'Ticketing Historical DB', server: 'sql-prod-support.internal.corp', database: 'CustomerCare_Archive', username: 'read_support', status: 'Connected', syncSchedule: 'Daily' },
    { id: 'db_03', name: 'Staffing Database Backup', server: 'sql-hr-backup.internal.corp', database: 'HR_Records', username: 'root_backup', status: 'Disconnected', syncSchedule: 'Weekly' }
  ];

  auditLogs: AuditLog[] = [
    { id: 'aud_01', timestamp: getPastDate(0.1), action: 'GET_METRICS', user: 'Director User', role: 'Director', details: 'Rendered executive dashboard health overview' },
    { id: 'aud_02', timestamp: getPastDate(0.5), action: 'ALERT_UPDATE', user: 'Priya Patel', role: 'Team Lead', details: 'Moved alert "Cloud Infrastructure Latency Spike" to In Progress' },
    { id: 'aud_03', timestamp: getPastDate(1.2), action: 'SAP_SYNC', user: 'Marcus Vance', role: 'Operations Manager', details: 'Triggered manual sync of SAP MM core connector' },
    { id: 'aud_04', timestamp: getPastDate(2.5), action: 'CSV_UPLOAD', user: 'Elena Rostova', role: 'Operations Manager', details: 'Imported supply-chain-q2.csv with 420 data records' }
  ];

  aiBriefings: AiInsightLog[] = [];

  constructor() {
    this.aiBriefings.push({
      id: 'brief_empty',
      timestamp: getPastDate(0.1),
      executiveSummary: 'Enterprise operational health is stable. Please upload a CSV operational trace to run automated pipeline diagnostics.',
      topRisks: ['No operational workloads currently scheduled.'],
      departmentIssues: ['All departmental pipelines are within standard margins.'],
      sapConcerns: ['All connectors are stable or waiting for task triggers.'],
      slaConcerns: ['0 active SLA exposures reported.'],
      bottlenecks: ['Resource allocations are balanced.'],
      recommendedActions: ['Upload operational spreadsheet logs to calibrate risk engines.'],
      priorityPlan24h: ['1. Standard system standby monitoring active.']
    });
  }

  // Database Access methods
  getTasks() {
    return this.tasks;
  }

  getEmployees() {
    return this.employees;
  }

  getDepartments() {
    return this.departments;
  }

  getAlerts() {
    return this.alerts;
  }

  getOperationalLogs() {
    return this.operationalLogs;
  }

  getSapConnectors() {
    return this.sapConnectors;
  }

  getApiIntegrations() {
    return this.apiIntegrations;
  }

  getDataSources() {
    return this.dataSources;
  }

  getAuditLogs() {
    return this.auditLogs.sort((a,b) => b.timestamp.localeCompare(a.timestamp));
  }

  getAiBriefings() {
    return this.aiBriefings.sort((a,b) => b.timestamp.localeCompare(a.timestamp));
  }

  addTask(task: Omit<TaskRecord, 'id' | 'timestamp'>) {
    if (this.isSeededDataActive) {
      this.clearSeededData();
    }
    const newTask: TaskRecord = {
      ...task,
      id: `task_${(this.tasks.length + 1).toString().padStart(2, '0')}`,
      timestamp: new Date().toISOString()
    };
    this.tasks.push(newTask);
    this.recalculateOperationalModels();
    return newTask;
  }

  buildDynamicBriefing() {
    const completedCountGlobal = this.tasks.filter(t => t.status === "Completed").length;
    const totalCountGlobal = this.tasks.length;
    const completionRateGlobal = totalCountGlobal > 0 ? Math.round((completedCountGlobal / totalCountGlobal) * 100) : 100;
    const slaBreachRateGlobal = totalCountGlobal > 0 ? Math.round((this.tasks.filter(t => t.slaBreached && t.status !== "Completed").length / totalCountGlobal) * 100) : 0;
    const activeAlertsCountGlobal = this.alerts.filter(a => a.status !== "Resolved").length;

    this.aiBriefings = [{
      id: `brief_${Math.random().toString(36).substring(2, 10)}`,
      timestamp: new Date().toISOString(),
      executiveSummary: `System compiled state calculated based on **${totalCountGlobal} active operational records**. Overall operational completion stands at **${completionRateGlobal}%**, with a current SLA breach velocity of **${slaBreachRateGlobal}%**. There are **${activeAlertsCountGlobal} unresolved alerts** demanding supervisory response.`,
      topRisks: this.alerts.filter(a => a.severity === "Critical" || a.severity === "High").map(a => `${a.department}: ${a.title} - ${a.description}`),
      departmentIssues: this.tasks.filter(t => t.slaBreached && t.status !== "Completed").map(t => `${t.department}: Task on '${t.employeeName}' is breaching SLA details: '${t.notes}'`),
      sapConcerns: this.sapConnectors.filter(s => s.status !== "Connected").map(s => `Connector '${s.name}' status is ${s.status}`),
      slaConcerns: [`${slaBreachRateGlobal}% of tasks are currently flagged with outstanding SLA breaches.`],
      bottlenecks: this.employees.filter(e => e.totalHours > 45).map(e => `Resource overload bottleneck: ${e.name} has logged ${e.totalHours} hours in ${e.department} queue.`),
      recommendedActions: [
        "Authorize task load rebalancing across operational departments.",
        "Establish secondary backup links for disconnected active ERP channels.",
        "Acknowledge and transition open high-severity alerts in the supervisors queue."
      ],
      priorityPlan24h: [
        "1. Review resources with logged hours exceeding soft capacity limits.",
        "2. Clear and reconcile unresolved SLAs in impacted department queues.",
        "3. Ensure the manual entry queue matches local inventory levels."
      ]
    }];

    if (this.aiBriefings[0].topRisks.length === 0) {
      this.aiBriefings[0].topRisks = ["No high-severity operational risk clusters currently identified."];
    }
    if (this.aiBriefings[0].departmentIssues.length === 0) {
      this.aiBriefings[0].departmentIssues = ["All department queue delivery times are within nominal SLAs."];
    }
    if (this.aiBriefings[0].sapConcerns.length === 0) {
      this.aiBriefings[0].sapConcerns = ["All SAP integrations show fully established TLS handshakes."];
    }
    if (this.aiBriefings[0].slaConcerns.length === 0) {
      this.aiBriefings[0].slaConcerns = ["No current SLA warnings reported."];
    }
    if (this.aiBriefings[0].bottlenecks.length === 0) {
      this.aiBriefings[0].bottlenecks = ["System resource allocations are balanced across teams."];
    }
  }

  addOperationalLog(log: Omit<OperationalLog, 'id' | 'timestamp'>) {
    const newLog: OperationalLog = {
      ...log,
      id: `log_${(this.operationalLogs.length + 1).toString().padStart(2, '0')}`,
      timestamp: new Date().toISOString()
    };
    this.operationalLogs.unshift(newLog);
    return newLog;
  }

  addAuditLog(action: string, user: string, role: 'Director' | 'Operations Manager' | 'Team Lead', details: string) {
    const newLog: AuditLog = {
      id: `aud_${(this.auditLogs.length + 1).toString().padStart(2, '0')}`,
      timestamp: new Date().toISOString(),
      action,
      user,
      role,
      details
    };
    this.auditLogs.unshift(newLog);
    return newLog;
  }

  addCsvFileHistory(fileName: string, recordsCount: number, success: boolean) {
    // Audit this
    this.addAuditLog(
      'CSV_UPLOAD', 
      'Operations Manager', 
      'Operations Manager', 
      `Uploaded metadata template ${fileName} containing ${recordsCount} records. Status: ${success ? 'PROCESSED' : 'FAILED'}`
    );
  }

  updateAlertStatus(id: string, status: 'Open' | 'In Progress' | 'Resolved', owner: string, remarks?: string, notes?: string) {
    const alert = this.alerts.find(a => a.id === id);
    if (alert) {
      alert.status = status;
      alert.assignedOwner = owner;
      if (remarks) {
        alert.comments.push({
          user: owner || 'Operations Staff',
          text: remarks,
          timestamp: new Date().toISOString()
        });
      }
      if (status === 'Resolved') {
        alert.resolvedDate = new Date().toISOString();
        alert.resolutionNotes = notes || 'Sourced and corrected root cause discrepancy';
      }
      this.addAuditLog(
        'ALERT_UPDATE',
        owner || 'Security Officer',
        'Operations Manager',
        `Updated alert state of "${alert.title}" to ${status}`
      );
      this.recalculateOperationalModels();
      return alert;
    }
    return null;
  }

  updateSapStatus(id: string, status: 'Connected' | 'Disconnected' | 'Syncing' | 'Error') {
    const sap = this.sapConnectors.find(s => s.id === id);
    if (sap) {
      sap.status = status;
      sap.lastSyncTime = new Date().toISOString();
      return sap;
    }
    return null;
  }

  updateApiStatus(id: string, status: 'Active' | 'Inactive') {
    const api = this.apiIntegrations.find(a => a.id === id);
    if (api) {
      api.status = status;
      api.lastSync = new Date().toISOString();
      return api;
    }
    return null;
  }

  updateDbStatus(id: string, status: 'Connected' | 'Disconnected' | 'Error') {
    const db = this.dataSources.find(d => d.id === id);
    if (db) {
      db.status = status;
      return db;
    }
    return null;
  }

  // Core Analytics recalculation engine
  recalculateOperationalModels() {
    const tasks = this.getTasks();

    if (!this.isSeededDataActive) {
      // Rebuild employees dynamically from current task queue
      const empGroups: { [name: string]: TaskRecord[] } = {};
      tasks.forEach(t => {
        if (t.employeeName && t.employeeName.trim() !== '') {
          if (!empGroups[t.employeeName]) empGroups[t.employeeName] = [];
          empGroups[t.employeeName].push(t);
        }
      });

      this.employees = Object.keys(empGroups).map((name, idx) => {
        const empTasks = empGroups[name];
        const dept = empTasks.find(t => t.department && t.department.trim() !== '')?.department || 'Engineering';
        const totalHours = empTasks.reduce((sum, t) => sum + t.hoursWorked, 0);
        const activeTasks = empTasks.filter(t => t.status !== 'Completed').length;
        return {
          id: `emp_${(idx + 1).toString().padStart(2, '0')}`,
          name: name,
          department: dept,
          status: 'Active',
          totalHours,
          activeTasks
        };
      });

      if (this.employees.length === 0) {
        this.employees.push({ id: 'emp_01', name: 'Operations Lead', department: 'Engineering', status: 'Active', totalHours: 0, activeTasks: 0 });
      }

      // Rebuild departments dynamically
      const deptNames = Array.from(new Set([
        ...tasks.map(t => t.department).filter(Boolean),
        'Engineering', 'Supply Chain', 'Quality Assurance', 'Customer Support'
      ]));

      this.departments = deptNames.map((deptName, idx) => {
        const deptTasks = tasks.filter(t => t.department === deptName);
        const deptEmployees = this.employees.filter(e => e.department === deptName);
        const totalHoursInDept = deptTasks.reduce((sum, t) => sum + t.hoursWorked, 0);
        const completedTasks = deptTasks.filter(t => t.status === 'Completed').length;
        const totalTasks = deptTasks.length;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;
        const manager = deptEmployees[0]?.name || 'Operations Manager';

        return {
          id: `dept_${(idx + 1).toString().padStart(2, '0')}`,
          name: deptName,
          healthScore: 100,
          riskLevel: 'Low',
          manager,
          completionRate,
          activeAlertsCount: 0,
          workloadScore: totalHoursInDept
        };
      });

      // Rebuild alerts dynamically
      this.alerts = [];
      let alertIdx = 1;

      // Employee burnout alerts (>45 hours)
      this.employees.forEach(emp => {
        if (emp.totalHours > 45) {
          this.alerts.push({
            id: `alert_${(alertIdx++).toString().padStart(2, '0')}`,
            title: `Resource Burnout Risk: ${emp.name}`,
            department: emp.department,
            severity: emp.totalHours > 52 ? 'Critical' : 'High',
            description: `${emp.name} in ${emp.department} is logging ${emp.totalHours} operational hours, exceeding standard thresholds.`,
            assignedOwner: emp.name,
            status: 'Open',
            comments: [],
            createdDate: new Date(Date.now() - 3600000 * 10).toISOString()
          });
        }
      });

      // SLA Breach Concentrations
      deptNames.forEach(deptName => {
        const deptTasks = tasks.filter(t => t.department === deptName);
        const breachedTasks = deptTasks.filter(t => t.slaBreached && t.status !== 'Completed');
        if (breachedTasks.length > 0) {
          this.alerts.push({
            id: `alert_${(alertIdx++).toString().padStart(2, '0')}`,
            title: `SLA Breach Concentration: ${deptName}`,
            department: deptName,
            severity: breachedTasks.length > 1 ? 'Critical' : 'High',
            description: `${breachedTasks.length} active workflows in ${deptName} are concurrently breaching SLAs.`,
            assignedOwner: deptTasks[0]?.employeeName || 'Manager',
            status: 'Open',
            comments: [],
            createdDate: new Date(Date.now() - 86400000).toISOString()
          });
        }
      });

      // High-priority unresolved lists
      const criticalPending = tasks.filter(t => t.priority === 'Critical' && t.status !== 'Completed');
      criticalPending.forEach(task => {
        this.alerts.push({
          id: `alert_${(alertIdx++).toString().padStart(2, '0')}`,
          title: `Unresolved Critical Task - ${task.employeeName}`,
          department: task.department,
          severity: 'High',
          description: `A critical priority item is outstanding: '${task.notes}' assigned to ${task.employeeName}.`,
          assignedOwner: task.employeeName,
          status: 'In Progress',
          comments: [],
          createdDate: new Date(Date.now() - 3600000 * 5).toISOString()
        });
      });

      // Sync activeAlertsCount count on Departments
      this.departments.forEach(dept => {
        dept.activeAlertsCount = this.alerts.filter(a => a.department === dept.name && a.status !== 'Resolved').length;
      });

      // Rebuild operational logs dynamically
      this.operationalLogs = [];
      let logIdx = 1;

      this.alerts.forEach(alert => {
        this.operationalLogs.push({
          id: `log_${(logIdx++).toString().padStart(2, '0')}`,
          timestamp: alert.createdDate,
          type: 'incident',
          message: `${alert.title}: ${alert.description}`,
          department: alert.department,
          priority: alert.severity === 'Moderate' ? 'Medium' : alert.severity,
          reportedBy: alert.assignedOwner
        });
      });

      const highTasks = tasks.filter(t => t.priority === 'High' || t.priority === 'Critical');
      highTasks.forEach(t => {
        this.operationalLogs.push({
          id: `log_${(logIdx++).toString().padStart(2, '0')}`,
          timestamp: t.timestamp,
          type: 'issue',
          message: `Workload recorded for ${t.employeeName}: ${t.notes}`,
          department: t.department,
          priority: t.priority,
          reportedBy: 'System Monitor'
        });
      });
    }

    // Now recalculate health score & risk level for all departments (both seeded and unseeded)
    this.departments.forEach(dept => {
      const deptTasks = tasks.filter(t => t.department === dept.name);
      const totalDeptTasks = deptTasks.length;
      if (totalDeptTasks === 0) {
        dept.completionRate = 100;
        dept.activeAlertsCount = 0;
        dept.workloadScore = 0;
        dept.healthScore = 100;
        dept.riskLevel = 'Low';
        return;
      }

      const completedDeptTasks = deptTasks.filter(t => t.status === 'Completed').length;
      const completionRate = Math.round((completedDeptTasks / totalDeptTasks) * 100);

      const activeAlerts = this.alerts.filter(a => a.department === dept.name && a.status !== 'Resolved').length;
      const totalHours = deptTasks.reduce((sum, t) => sum + t.hoursWorked, 0);

      dept.completionRate = completionRate;
      dept.activeAlertsCount = activeAlerts;
      dept.workloadScore = totalHours;

      const slaBreachedCount = deptTasks.filter(t => t.slaBreached).length;
      const slaPercentage = slaBreachedCount / totalDeptTasks;

      let baseHealth = 100;
      baseHealth -= (slaPercentage * 40); // Max 40 deduction
      baseHealth -= (activeAlerts * 15);  // Deduct 15 per alert

      const employeesInDept = this.employees.filter(e => e.department === dept.name);
      const avgWorkload = employeesInDept.length ? totalHours / employeesInDept.length : 0;
      if (avgWorkload > 45) {
        baseHealth -= 15;
      } else if (avgWorkload > 38) {
        baseHealth -= 5;
      }

      dept.healthScore = Math.max(12, Math.min(100, Math.round(baseHealth)));

      if (dept.healthScore >= 80) dept.riskLevel = 'Low';
      else if (dept.healthScore >= 65) dept.riskLevel = 'Moderate';
      else if (dept.healthScore >= 50) dept.riskLevel = 'Elevated';
      else if (dept.healthScore >= 35) dept.riskLevel = 'High';
      else dept.riskLevel = 'Critical';
    });

    // Sync employee hours
    this.employees.forEach(emp => {
      const empTasks = tasks.filter(t => t.employeeName === emp.name);
      emp.totalHours = empTasks.reduce((sum, t) => sum + t.hoursWorked, 0);
      emp.activeTasks = empTasks.filter(t => t.status !== 'Completed').length;
    });

    // Rebuild dynamic AI Briefing
    if (!this.isSeededDataActive) {
      this.buildDynamicBriefing();
    }
  }
}
