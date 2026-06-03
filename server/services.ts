/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EnterpriseDatabase } from './db.js';
import { 
  Employee, 
  Department, 
  TaskRecord, 
  Alert, 
  Anomaly, 
  PredictionResult, 
  Recommendation, 
  DepartmentRisk, 
  ExecutiveDashboardViewModel 
} from '../src/types.js';

export class OperationalHealthService {
  static getHealthScore(db: EnterpriseDatabase) {
    const tasks = db.getTasks();
    const alerts = db.getAlerts().filter(a => a.status !== 'Resolved');
    
    if (tasks.length === 0) return { score: 100, category: 'Healthy' as const };
    
    // 1. Completion Rate Factor (out of 35)
    const completedCount = tasks.filter(t => t.status === 'Completed').length;
    const completionRate = completedCount / tasks.length;
    const completionFactor = completionRate * 35;
    
    // 2. SLA Breach Penalties (max -25)
    // Percentage of SLA breached overall
    const slaBreachedTasksCount = tasks.filter(t => t.slaBreached && t.status !== 'Completed').length;
    const slaBreachRate = slaBreachedTasksCount / tasks.length;
    const slaPenalty = Math.min(25, slaBreachRate * 100); 
    
    // 3. Active Alert Severity Penalty (max -20)
    let alertPenalty = 0;
    alerts.forEach(alert => {
      if (alert.severity === 'Critical') alertPenalty += 10;
      else if (alert.severity === 'High') alertPenalty += 6;
      else if (alert.severity === 'Moderate') alertPenalty += 3;
      else if (alert.severity === 'Low') alertPenalty += 1;
    });
    alertPenalty = Math.min(20, alertPenalty);
    
    // 4. Workload Imbalance (max -10)
    // Find standard deviation or max workload gap
    const employees = db.getEmployees();
    let imbalancePenalty = 0;
    if (employees.length > 0) {
      const hours = employees.map(e => e.totalHours);
      const maxHours = Math.max(...hours);
      const minHours = Math.min(...hours);
      if (maxHours - minHours > 35) {
        imbalancePenalty = 10; // Serious team load disparity
      } else if (maxHours - minHours > 20) {
        imbalancePenalty = 5;
      }
    }
    
    // 5. Connection failures (max -10)
    // SAP failures or Database disconnected
    const saps = db.getSapConnectors();
    const sapFails = saps.filter(s => s.status === 'Error').length;
    const connPenalty = Math.min(10, sapFails * 5);
    
    // Aggregate Health Score
    let finalScore = Math.round(100 - slaPenalty - alertPenalty - imbalancePenalty - connPenalty);
    // Include some completion weight
    finalScore = Math.max(12, Math.min(100, finalScore));
    
    let category: 'Healthy' | 'Moderate' | 'Degraded' | 'Critical' = 'Healthy';
    if (finalScore >= 85) category = 'Healthy';
    else if (finalScore >= 65) category = 'Moderate';
    else if (finalScore >= 45) category = 'Degraded';
    else category = 'Critical';
    
    return {
      score: finalScore,
      category
    };
  }
}

export class AnomalyDetectionService {
  static detectAnomalies(db: EnterpriseDatabase): Anomaly[] {
    const anomalies: Anomaly[] = [];
    const employees = db.getEmployees();
    const tasks = db.getTasks();
    const saps = db.getSapConnectors();
    
    // 1. Employee Overwork Anomalies (>48 hours worked)
    employees.forEach(emp => {
      if (emp.totalHours > 45) {
        anomalies.push({
          id: `anom_emp_${emp.id}`,
          title: `Resource Burnout Risk: ${emp.name}`,
          department: emp.department,
          severity: emp.totalHours > 52 ? 'Critical' : 'High',
          timestamp: new Date().toISOString(),
          metricName: 'Workload Hours',
          deviationValue: `${emp.totalHours} hrs/week`,
          description: `${emp.name} in ${emp.department} is logging ${emp.totalHours} operational hours, exceeding enterprise soft capacity limit of 45 hours.`
        });
      }
    });

    // 2. High SLA breach concentrations
    const departments = Array.from(new Set(tasks.map(t => t.department)));
    departments.forEach(dept => {
      const deptTasks = tasks.filter(t => t.department === dept);
      const breaches = deptTasks.filter(t => t.slaBreached && t.status !== 'Completed').length;
      if (breaches >= 2) {
        anomalies.push({
          id: `anom_sla_${dept.toLowerCase().replace(' ', '_')}`,
          title: `SLA Breach Concentration: ${dept}`,
          department: dept,
          severity: breaches > 2 ? 'Critical' : 'High',
          timestamp: new Date().toISOString(),
          metricName: 'Unresolved SLA Breaches',
          deviationValue: `${breaches} parallel breaches`,
          description: `Multiple critical workflows in ${dept} are concurrently breaching delivery thresholds.`
        });
      }
    });

    // 3. SAP Connection Breakdowns
    saps.forEach(sap => {
      if (sap.status === 'Error') {
        anomalies.push({
          id: `anom_sap_${sap.id}`,
          title: `SAP Sync Handshake Breakdown`,
          department: sap.module.includes('MM') ? 'Supply Chain' : 'Engineering',
          severity: 'High',
          timestamp: new Date().toISOString(),
          metricName: 'Connector State',
          deviationValue: 'STATUS_GATEWAY_ERROR',
          description: `Integration connector "${sap.name}" for module ${sap.module} reported an active sync handshake failure.`
        });
      }
    });

    return anomalies;
  }
}

export class PredictionService {
  static predictRisks(db: EnterpriseDatabase): PredictionResult[] {
    const predictions: PredictionResult[] = [];
    const employees = db.getEmployees();
    const tasks = db.getTasks();
    const depts = db.getDepartments();

    // Prediction 1: Future SLA Breaches based on High Priority pending backlog
    depts.forEach(dept => {
      const pendingHigh = tasks.filter(t => t.department === dept.name && t.status !== 'Completed' && (t.priority === 'High' || t.priority === 'Critical')).length;
      const staffCount = employees.filter(e => e.department === dept.name).length;
      
      if (pendingHigh > 0 && staffCount > 0) {
        const loadRatio = pendingHigh / staffCount;
        let probability = Math.round(Math.min(98, loadRatio * 35 + 20));
        
        if (probability > 40) {
          predictions.push({
            id: `pred_sla_${dept.id}`,
            targetType: 'SLA Breach',
            targetName: dept.name,
            probability,
            timeframe: 'Next 5 Days',
            keyFactor: `Unresolved high-priority backlog of ${pendingHigh} active tasks across ${staffCount} department resources`,
            calculationExplanation: `Formula: P = min(98, (HighPriorityTaskCount / CapacityCount) * 35 + BaseModifier[20%]). Imbalanced backlog pressure.`
          });
        }
      }
    });

    // Prediction 2: Impending Completion Rate Decline due to over-allocated resources
    employees.forEach(emp => {
      if (emp.activeTasks >= 4 && emp.totalHours > 42) {
        const prob = Math.round(Math.min(95, (emp.activeTasks * 15) + (emp.totalHours - 40) * 2));
        predictions.push({
          id: `pred_comp_${emp.id}`,
          targetType: 'Completion Decline',
          targetName: emp.department,
          probability: prob,
          timeframe: 'Next 14 Days',
          keyFactor: `${emp.name} is severely multi-tasked (${emp.activeTasks} active tasks) with high work fatigue (${emp.totalHours} hrs)`,
          calculationExplanation: `Formula: P = min(95, (ActiveTasks * 15) + (FatigueDelta * 2)). Individual task overloading causes scheduling logjams.`
        });
      }
    });

    // Prediction 3: Backlog escalation probability
    const criticalPending = tasks.filter(t => t.status !== 'Completed' && t.priority === 'Critical').length;
    if (criticalPending >= 2) {
      predictions.push({
        id: 'pred_escalation_global',
        targetType: 'Escalation Probability',
        targetName: 'Enterprise-wide',
        probability: Math.min(90, criticalPending * 25),
        timeframe: '72 Hours',
        keyFactor: `${criticalPending} global critical items currently flagged as Pending/In Progress`,
        calculationExplanation: `Formula: P = min(90, CriticalPendingCount * 25). Accumulation of unmitigated high-impact alerts.`
      });
    }

    return predictions;
  }
}

export class RecommendationService {
  private static statusStore: Record<string, 'Pending' | 'In Progress' | 'Completed'> = {};

  static updateStatus(id: string, status: 'Pending' | 'In Progress' | 'Completed') {
    this.statusStore[id] = status;
  }

  static getStatus(id: string): 'Pending' | 'In Progress' | 'Completed' {
    return this.statusStore[id] || 'Pending';
  }

  static generateRecommendations(db: EnterpriseDatabase, anomalies: Anomaly[]): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const employees = db.getEmployees();
    const tasks = db.getTasks();

    // 1. Reassign overloaded employee tasks
    const overloadedEmployees = employees.filter(e => e.totalHours > 40).sort((a, b) => b.totalHours - a.totalHours);
    overloadedEmployees.forEach(emp => {
      const helpers = employees
        .filter(e => e.department === emp.department && e.name !== emp.name && e.totalHours < 35)
        .sort((a, b) => a.totalHours - b.totalHours);

      const pendingTasks = tasks.filter(t => t.employeeName === emp.name && t.status !== 'Completed');
      if (pendingTasks.length > 0 && helpers.length > 0) {
        const targetTask = pendingTasks[0];
        const bestHelper = helpers[0];
        const id = `rec_burnout_${emp.name.replace(/\s+/g, '_').toLowerCase()}`;

        recommendations.push({
          id,
          title: `Load Rebalancing: Offload ${emp.name}`,
          department: emp.department,
          metricReference: `${emp.name} is logging ${emp.totalHours} weekly hours`,
          actionablePlan: `Reallocate active work order '${targetTask.notes}' from ${emp.name} (${emp.totalHours} hrs) to ${bestHelper.name} (${bestHelper.totalHours} hrs) inside the ${emp.department} queue. This immediately mitigates operational fatigue and reduces department delivery risk.`,
          severity: emp.totalHours > 50 ? 'Critical' : 'High',
          status: this.getStatus(id),
          riskSource: `Overloaded Employee - ${emp.name} (${emp.totalHours} hrs, ${emp.activeTasks} tasks)`,
          recommendedAction: `Reassign task '${targetTask.notes}' to ${bestHelper.name}`,
          owner: bestHelper.name,
          expectedImpactPercent: Math.min(45, Math.round((targetTask.hoursWorked / emp.totalHours) * 100)),
          category: 'Reassign overloaded employee tasks'
        });
      }
    });

    // 2. Resolve SLA breach incidents
    const breachedTasks = tasks.filter(t => t.slaBreached && t.status !== 'Completed');
    breachedTasks.forEach(task => {
      const id = `rec_sla_mit_${task.id}`;
      recommendations.push({
        id,
        title: `SLA Recovery Action: Re-prioritize Task for {task.employeeName}`,
        department: task.department,
        metricReference: `SLA Timeline violated: Cumulative hours ${task.hoursWorked} logged`,
        actionablePlan: `Deploy immediate supervision/backup to assist ${task.employeeName} in completing pending ticket '${task.notes}'. Recommend direct contact with core clients to push deliverable windows.`,
        severity: task.priority === 'Critical' ? 'Critical' : 'High',
        status: this.getStatus(id),
        riskSource: `SLA Breach - Ticket #${task.id} assigned to ${task.employeeName}`,
        recommendedAction: `Prioritize and support ticket completion with expert backup for ${task.employeeName}`,
        owner: task.employeeName,
        expectedImpactPercent: 75,
        category: 'Resolve SLA breach incidents'
      });
    });

    // 3. Reduce delivery delay risk
    const deliveryRiskTasks = tasks.filter(t => t.priority === 'Critical' && t.status !== 'Completed');
    deliveryRiskTasks.forEach(task => {
      const id = `rec_delay_${task.id}`;
      recommendations.push({
        id,
        title: `Mitigate Delay Risk: ${task.notes}`,
        department: task.department,
        metricReference: `Pending Critical Item: ${task.hoursWorked} hours logged`,
        actionablePlan: `Set up hourly checkpoint reviews for task '${task.notes}' owned by ${task.employeeName} to preempt project delays inside the ${task.department} pipeline.`,
        severity: 'High',
        status: this.getStatus(id),
        riskSource: `High Delay Threat - ${task.notes} (Critical Priority)`,
        recommendedAction: `Introduce milestone tracking checkpoints and optimize query/network states if blocking.`,
        owner: 'Operations Manager',
        expectedImpactPercent: 60,
        category: 'Reduce delivery delay risk'
      });
    });

    // 4. Stabilize department workload
    const uniqueDepts = Array.from(new Set(tasks.map(t => t.department).filter(Boolean)));
    uniqueDepts.forEach(dept => {
      const deptTasks = tasks.filter(t => t.department === dept);
      const incompleteCount = deptTasks.filter(t => t.status !== 'Completed').length;
      const totalHours = deptTasks.reduce((sum, t) => sum + t.hoursWorked, 0);

      if (totalHours > 80 && incompleteCount > 2) {
        const id = `rec_dept_risk_${dept.replace(/\s+/g, '_').toLowerCase()}`;
        recommendations.push({
          id,
          title: `Operational Reinforcements: ${dept} Queue`,
          department: dept,
          metricReference: `${incompleteCount} active tasks logging ${totalHours} total effort hours in department`,
          actionablePlan: `Establish a dedicated daily operations review for the ${dept} department. Authorize secondary supervisor oversight or approve auxiliary staff overtime to address the capacity deficit.`,
          severity: 'High',
          status: this.getStatus(id),
          riskSource: `Department Congestion - ${dept} (${totalHours} total hours)`,
          recommendedAction: `Redistribute department workload or deploy temporary auxiliary staff.`,
          owner: 'Operations Lead',
          expectedImpactPercent: 40,
          category: 'Stabilize department workload'
        });
      }
    });

    // Fallback default recommendation if empty
    if (recommendations.length === 0) {
      const id = 'rec_default';
      recommendations.push({
        id,
        title: 'Perform General Database Inventory Optimization',
        department: 'Quality Assurance',
        metricReference: 'ERP DB Connection State: Stable',
        actionablePlan: 'Analyze historic indices on ERP operational task history store. Run clean logs vacuum during off-peak weekend hours.',
        severity: 'Low',
        status: this.getStatus(id),
        riskSource: 'System Calibrated Stable State',
        recommendedAction: 'Standard maintenance review on ERP task records database',
        owner: 'Operations Manager',
        expectedImpactPercent: 100,
        category: 'Stabilize department workload'
      });
    }

    // Sort by Urgency (Critical = 1, High = 2, Medium/Moderate = 3, Low = 4)
    const severityMap: Record<string, number> = { 'Critical': 1, 'High': 2, 'Medium': 3, 'Low': 4 };
    return recommendations.sort((a, b) => (severityMap[a.severity] || 5) - (severityMap[b.severity] || 5));
  }
}

export class RiskEngineService {
  static getDepartmentRisks(db: EnterpriseDatabase): DepartmentRisk[] {
    const depts = db.getDepartments();
    const tasks = db.getTasks();
    const alerts = db.getAlerts().filter(a => a.status !== 'Resolved');

    return depts.map(dept => {
      const deptTasks = tasks.filter(t => t.department === dept.name);
      const deptPending = deptTasks.filter(t => t.status !== 'Completed').length;
      const deptSlaBreaches = deptTasks.filter(t => t.slaBreached && t.status !== 'Completed').length;
      const deptAlerts = alerts.filter(a => a.department === dept.name).length;

      // Risk score from 0 to 100
      let riskScore = 15; // base level
      riskScore += deptPending * 12;
      riskScore += deptSlaBreaches * 22;
      riskScore += deptAlerts * 25;
      riskScore = Math.min(100, riskScore);

      let status: 'Critical' | 'Warning' | 'Stable' = 'Stable';
      if (riskScore > 65) status = 'Critical';
      else if (riskScore > 35) status = 'Warning';

      let description = '';
      if (status === 'Critical') {
        description = `SLA delivery is severely compromised by ${deptSlaBreaches} immediate breaches and ${deptAlerts} outstanding critical incidents.`;
      } else if (status === 'Warning') {
        description = `Alert warnings exist regarding ${deptPending} active tasks. Monitor resource workload parameters closely.`;
      } else {
        description = `Operational metrics well within nominal guidelines. Capacity and queues are in balance.`;
      }

      return {
        id: `risk_${dept.id}`,
        department: dept.name,
        score: riskScore,
        description,
        category: deptSlaBreaches > 0 ? 'SLA' : deptAlerts > 0 ? 'Workload' : 'Resources',
        status
      };
    });
  }
}
