/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Employee {
  id: string;
  name: string;
  department: string;
  status: string;
  totalHours: number;
  activeTasks: number;
}

export interface Department {
  id: string;
  name: string;
  healthScore: number;
  riskLevel: 'Low' | 'Moderate' | 'Elevated' | 'High' | 'Critical';
  manager: string;
  completionRate: number;
  activeAlertsCount: number;
  workloadScore: number;
}

export interface TaskRecord {
  id: string;
  employeeName: string;
  department: string;
  status: 'Completed' | 'In Progress' | 'Pending';
  hoursWorked: number;
  slaBreached: boolean;
  timestamp: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  dueDate: string;
  notes: string;
}

export interface OperationalLog {
  id: string;
  timestamp: string;
  type: 'issue' | 'delay' | 'escalation' | 'overload' | 'incident' | 'risk note';
  message: string;
  department: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  reportedBy: string;
}

export interface AlertComment {
  user: string;
  text: string;
  timestamp: string;
}

export interface Alert {
  id: string;
  title: string;
  department: string;
  severity: 'Low' | 'Moderate' | 'High' | 'Critical';
  description: string;
  assignedOwner: string;
  status: 'Open' | 'In Progress' | 'Resolved';
  comments: AlertComment[];
  resolutionNotes?: string;
  createdDate: string;
  resolvedDate?: string;
}

export interface DepartmentRisk {
  id: string;
  department: string;
  score: number;
  description: string;
  category: 'Workload' | 'SLA' | 'Resources' | 'Process';
  status: 'Critical' | 'Warning' | 'Stable';
}

export interface PredictionResult {
  id: string;
  targetType: 'SLA Breach' | 'Department Overload' | 'Completion Decline' | 'Escalation Probability' | 'Task Backlog Increase' | 'Operational Slowdown';
  targetName: string;
  probability: number; // 0 to 100
  timeframe: string; // e.g. "Next 7 Days", "By Q4"
  keyFactor: string;
  calculationExplanation: string;
}

export interface Anomaly {
  id: string;
  title: string;
  department: string;
  severity: 'Low' | 'Moderate' | 'High' | 'Critical';
  timestamp: string;
  metricName: string;
  deviationValue: string;
  description: string;
}

export interface Recommendation {
  id: string;
  title: string;
  department: string;
  metricReference: string;
  actionablePlan: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'Applied' | 'Dismissed';
}

export interface SapConnector {
  id: string;
  name: string;
  endpoint: string;
  authentication: 'OAuth2' | 'Basic' | 'SAML' | 'API Key';
  status: 'Connected' | 'Disconnected' | 'Syncing' | 'Error';
  lastSyncTime: string;
  module: 'SAP MM' | 'SAP SD' | 'SAP PP' | 'SAP HCM' | 'SAP SuccessFactors' | 'SAP Business One';
}

export interface ApiIntegration {
  id: string;
  name: string;
  url: string;
  token: string;
  status: 'Active' | 'Inactive';
  frequency: 'Hourly' | 'Daily' | 'Weekly' | 'Real-time';
  lastSync: string;
}

export interface DataSource {
  id: string;
  name: string;
  server: string;
  database: string;
  username: string;
  status: 'Connected' | 'Disconnected' | 'Error';
  syncSchedule: 'Hourly' | 'Daily' | 'Weekly';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  role: 'Director' | 'Operations Manager' | 'Team Lead';
  details: string;
}

export interface AiInsightLog {
  id: string;
  timestamp: string;
  executiveSummary: string;
  topRisks: string[];
  departmentIssues: string[];
  sapConcerns: string[];
  slaConcerns: string[];
  bottlenecks: string[];
  recommendedActions: string[];
  priorityPlan24h: string[];
}

export interface ExecutiveDashboardViewModel {
  operationalHealthScore: number;
  healthCategory: 'Healthy' | 'Moderate' | 'Degraded' | 'Critical';
  employeesCount: number;
  tasksCount: number;
  completionRate: number;
  slaBreachRate: number;
  activeAlertsCount: number;
  averageHours: number;
  overloadedDepartments: string[];
  topRisks: DepartmentRisk[];
  activeAnomalies: Anomaly[];
  predictedSlaRisks: PredictionResult[];
  recommendationQueue: Recommendation[];
}
