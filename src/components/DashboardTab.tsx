/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  ShieldAlert, 
  ChevronRight, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight, 
  Play, 
  MessageSquare,
  Sparkles,
  Zap,
  RotateCcw,
  PlusSquare,
  HelpCircle
} from 'lucide-react';
import { DepartmentRisk, Anomaly, PredictionResult, Recommendation, Alert } from '../types.js';

interface DashboardTabProps {
  summary: {
    operationalHealthScore: number;
    healthCategory: 'Healthy' | 'Moderate' | 'Degraded' | 'Critical';
    activeAlertsCount: number;
    averageHours: number;
    overloadedDepartments: string[];
    topRisks: DepartmentRisk[];
    activeAnomalies: Anomaly[];
    predictedSlaRisks: PredictionResult[];
    recommendationQueue: Recommendation[];
    slaBreachRate: number;
  };
  alerts: Alert[];
  userRole: 'Director' | 'Operations Manager' | 'Team Lead';
  setActiveTab: (tab: string) => void;
  triggerAiCalculation: () => void;
  aiBriefingLoading: boolean;
  latestBriefingText: string;
}

export default function DashboardTab({ 
  summary, 
  alerts, 
  userRole, 
  setActiveTab, 
  triggerAiCalculation, 
  aiBriefingLoading,
  latestBriefingText
}: DashboardTabProps) {
  
  // Custom mock series for charting (smooth curve lines like reference image 1)
  const lineChartData = [45, 52, 49, 68, 62, 75, 71];

  // Helper to color codes
  const getSeverityBadge = (sev: 'Low' | 'Moderate' | 'High' | 'Critical' | 'Medium') => {
    switch (sev) {
      case 'Critical': 
        return <span className="bg-red-50 text-red-600 border border-red-100 text-[10px] uppercase font-bold px-2 py-0.5 rounded font-mono">Critical</span>;
      case 'High': 
        return <span className="bg-amber-50 text-amber-600 border border-amber-100 text-[10px] uppercase font-bold px-2 py-0.5 rounded font-mono">High</span>;
      case 'Moderate':
      case 'Medium':
        return <span className="bg-blue-50 text-blue-600 border border-blue-100 text-[10px] uppercase font-bold px-2 py-0.5 rounded font-mono">Moderate</span>;
      default:
        return <span className="bg-slate-50 text-slate-500 border border-slate-100 text-[10px] uppercase font-bold px-2 py-0.5 rounded font-mono">Low</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Alert Ribbon Header */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3.5 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-blue-600 font-bold uppercase tracking-widest">AI PREDICTIVE CO-PILOT ACTIVE</span>
            <p className="text-xs text-slate-700 font-medium">
              IntelliOps AI predicts a <span className="text-blue-600 underline font-semibold cursor-pointer" onClick={() => setActiveTab('predictions')}>potential SLA overload risk in Supply Chain core MM module</span> by the end of this shift cycle.
            </p>
          </div>
        </div>
        <button 
          onClick={() => setActiveTab('predictions')}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-1.5 rounded transition-all flex items-center gap-1 shadow-sm"
        >
          View Live Forecast
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Grid: Health Gauge / Executive Briefing Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Side: System Health Card */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-tight font-mono">Operational Health Hub</h2>
              <span className="text-[11px] text-slate-400 font-mono">Metric Weighting Engine: Standard v1.2</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mt-4 items-center">
              {/* Circular Gauge Ring */}
              <div className="md:col-span-4 flex flex-col items-center">
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="56" cy="56" r="48" stroke="#e2e8f0" strokeWidth="8" fill="transparent" />
                    <circle 
                      cx="56" 
                      cy="56" 
                      r="48" 
                      stroke="#06b6d4" 
                      strokeWidth="8" 
                      fill="transparent" 
                      strokeDasharray="301.6"
                      strokeDashoffset={301.6 - (301.6 * summary.operationalHealthScore) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-3xl font-extrabold text-slate-950 font-mono leading-none">{summary.operationalHealthScore}</span>
                    <span className="text-[8px] text-slate-450 font-mono mt-0.5 uppercase tracking-wider">Health</span>
                  </div>
                </div>
                <div className={`mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                  summary.healthCategory === 'Healthy' ? 'bg-emerald-50 text-emerald-700' :
                  summary.healthCategory === 'Moderate' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'
                }`}>
                  ● {summary.healthCategory} State
                </div>
              </div>

              {/* Analytics Summary checklist (like reference image 2) */}
              <div className="md:col-span-8 space-y-2">
                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                  The organizational operational health is verified at <span className="font-semibold text-slate-900">{summary.operationalHealthScore}/100</span>. {summary.activeAlertsCount > 0 ? (
                    <span>Operational bottlenecks are isolated inside the <strong>{summary.overloadedDepartments.join(', ') || 'strained'}</strong> department queues with active alert indications.</span>
                  ) : (
                    <span>All corporate channels, resource allocations, and delivery queues are operating within standard SLA limits.</span>
                  )}
                </p>
                <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-100 font-mono">
                  <div>
                    <span className="text-[10px] text-slate-450 block uppercase">Imbalance Score</span>
                    <span className="text-xs font-semibold text-slate-800">18.4% (Elevated)</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-450 block uppercase">SLA Exposure</span>
                    <span className="text-xs font-semibold text-slate-800">{summary.slaBreachRate}% rate limits</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-455 block uppercase">Alert Response Time</span>
                    <span className="text-xs font-semibold text-[#10b981]">14.2 mins (Optimal)</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-455 block uppercase">Active Task Growth</span>
                    <span className="text-xs font-semibold text-slate-800">+2.4x std dev</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Inline miniature line chart showing historical health trend */}
          <div className="mt-4 pt-2.5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-slate-500">Corporate Health Trend (Last 7 Days)</span>
              <span className="text-[10px] font-mono text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded">+12.5% recovery</span>
            </div>
            <div className="w-full h-11">
              <svg className="w-full h-full overflow-visible">
                <path
                  d={`M ${lineChartData.map((val, idx) => `${(idx * 100) / (lineChartData.length - 1)}%,${35 - ((val - 45) / 35) * 30}`).join(' L ')}`}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Right Side: Executive Snapshot Card (replaces Giant Strategic AI Briefing) */}
        <div className="lg:col-span-4 bg-slate-950 text-slate-350 border border-slate-850 rounded-lg p-5 flex flex-col justify-between shadow-[0_4px_12px_rgba(0,0,0,0.15)] relative overflow-hidden">
          {/* Subtle neon glowing accent in corner */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#10b981]/5 rounded-full blur-2xl"></div>
          
          <div className="space-y-3.5 relative z-10">
            <div className="flex items-center justify-between border-b border-slate-850 pb-2.5">
              <div className="flex items-center gap-1.5 text-white font-semibold">
                <Sparkles className="w-4 h-4 text-[#10b981]" />
                <h3 className="text-xs font-bold uppercase tracking-wider font-mono">Executive Snapshot</h3>
              </div>
              <button 
                disabled={aiBriefingLoading}
                onClick={triggerAiCalculation}
                title="Refresh Snapshot Analytics"
                className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all cursor-pointer"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${aiBriefingLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Core Snapshot compact indicators */}
            <div className="grid grid-cols-4 gap-1.5 mb-3 bg-slate-900 border border-slate-850 p-2 text-center rounded-lg">
              <div className="border-r border-slate-850/60 pr-0.5">
                <span className="text-[8px] text-slate-500 block uppercase font-mono tracking-wider">Health</span>
                <span className="text-xs font-semibold font-mono text-emerald-400">{summary.operationalHealthScore}%</span>
              </div>
              <div className="border-r border-slate-850/60 pr-0.5">
                <span className="text-[8px] text-slate-500 block uppercase font-mono tracking-wider">Incident</span>
                <span className="text-xs font-semibold font-mono text-red-400">{summary.activeAlertsCount}</span>
              </div>
              <div className="border-r border-slate-850/60 pr-0.5">
                <span className="text-[8px] text-slate-500 block uppercase font-mono tracking-wider">SLA Rate</span>
                <span className="text-xs font-semibold font-mono text-amber-400">{summary.slaBreachRate}%</span>
              </div>
              <div>
                <span className="text-[8px] text-slate-500 block uppercase font-mono tracking-wider">Exhaust</span>
                <span className="text-xs font-semibold font-mono text-cyan-400">{summary.averageHours}h</span>
              </div>
            </div>

            {/* Lists content */}
            {aiBriefingLoading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-2.5 bg-slate-800 rounded w-full"></div>
                <div className="h-2.5 bg-slate-800 rounded w-11/12"></div>
                <div className="h-2.5 bg-slate-800 rounded w-10/12"></div>
                <div className="h-2 bg-slate-800 rounded w-9/12 mt-4"></div>
                <div className="h-2 bg-slate-800 rounded w-11/12"></div>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div>
                  <h4 className="text-[9.5px] uppercase font-bold text-emerald-400 tracking-wider mb-1 font-mono">Top Risks</h4>
                  <ul className="space-y-1 text-xs text-slate-300">
                    {(summary.topRisks.length > 0
                      ? summary.topRisks.slice(0, 3).map(r => `${r.department}: High Risk (${r.score}/100)`)
                      : [
                          'Engineering overload detected',
                          'SLA breach risk rising',
                          'Support backlog increasing'
                        ]
                    ).slice(0, 3).map((risk, idx) => (
                      <li key={idx} className="flex items-start gap-1 leading-tight text-[11px] truncate">
                        <span className="text-emerald-400 select-none shrink-0">•</span>
                        <span className="truncate block max-w-full" title={risk}>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-[9.5px] uppercase font-bold text-amber-400 tracking-wider mb-1 font-mono">Recommended Actions</h4>
                  <ul className="space-y-1 text-xs text-slate-300">
                    {(summary.recommendationQueue.length > 0
                      ? summary.recommendationQueue.slice(0, 3).map(rec => rec.title)
                      : [
                          'Reassign API Migration project load',
                          'Escalate Ticket Backlog Cleanup',
                          'Monitor Operations workload fatigue'
                        ]
                    ).slice(0, 3).map((action, idx) => (
                      <li key={idx} className="flex items-start gap-1 leading-tight text-[11px] truncate">
                        <span className="text-amber-400 select-none shrink-0">•</span>
                        <span className="truncate block max-w-full" title={action}>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-2.5 border-t border-slate-850">
            <button 
              onClick={() => setActiveTab('ai-insights')}
              className="w-full bg-[#10b981] hover:bg-emerald-500 text-slate-950 font-bold text-xs py-2 rounded transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 shadow-sm font-sans"
            >
              View Full AI Briefing
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* Grid: Department Risk Matrix (Reference Image 2) and Recommendation Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Department Risk Matrix */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase font-mono tracking-wider">Department Risk Matrix</h3>
              <p className="text-[11px] text-slate-450 mt-0.5">Continuous evaluation of department risk score thresholds</p>
            </div>
            <button 
              onClick={() => setActiveTab('manual-entry')}
              className="text-slate-500 hover:text-[#10b981] text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
            >
              <PlusSquare className="w-3.5 h-3.5" />
              Adjust Log
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-mono text-slate-450 uppercase tracking-wider">
                  <th className="py-3 px-5 font-semibold">Department</th>
                  <th className="py-3 px-4 font-semibold text-center">Calculated Action Risk</th>
                  <th className="py-3 px-4 font-semibold">Status Indicator</th>
                  <th className="py-3 px-4 font-semibold text-center">Workload (Hours)</th>
                  <th className="py-3 px-4 font-semibold text-center font-bold">Priority Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {summary.topRisks.map((risk, index) => {
                  return (
                    <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-5 font-medium text-slate-900 border-l-2 border-slate-200 group-hover:border-slate-400">
                        {risk.department}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-center">
                        <span className="text-slate-900 font-semibold">{risk.score}</span>
                        <span className="text-slate-400">/100</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold leading-none ${
                          risk.status === 'Critical' ? 'bg-red-50 text-red-700 border border-red-100' :
                          risk.status === 'Warning' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        }`}>
                          ● {risk.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-600">
                        {risk.category === 'Workload' ? (
                          <span className="text-amber-600 font-semibold">{risk.score}h total</span>
                        ) : (
                          <span>Active queue logs</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button 
                          onClick={() => {
                            if (risk.department.toLowerCase().includes('chain')) {
                              setActiveTab('alerts');
                            } else {
                              setActiveTab('recommendations');
                            }
                          }}
                          className="bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-[10px] font-medium py-1 px-3.5 rounded transition-all cursor-pointer"
                        >
                          Execute Remediation
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Recommendation Queue */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-lg shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase font-mono tracking-wider">Recommendation Queue</h3>
              <span className="text-[10px] bg-slate-100 font-mono text-slate-500 px-2 py-0.5 rounded">{summary.recommendationQueue.length} Active</span>
            </div>

            <div className="space-y-4 mt-4">
              {summary.recommendationQueue.map((rec, i) => (
                <div key={i} className="p-3 bg-slate-50 border border-slate-205 rounded-md hover:border-slate-300 transition-colors flex gap-2.5 items-start">
                  <div className="mt-0.5 rounded-full p-1 bg-emerald-50 border border-emerald-100 text-emerald-600">
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-450 uppercase">{rec.department}</span>
                      {getSeverityBadge(rec.severity)}
                    </div>
                    <p className="text-xs font-semibold text-slate-900 mt-1 truncate">{rec.title}</p>
                    <p className="text-[11px] text-slate-550 leading-relaxed mt-1 line-clamp-2">{rec.actionablePlan}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100">
            <button 
              onClick={() => setActiveTab('recommendations')}
              className="text-slate-600 hover:text-indigo-600 text-xs font-semibold flex items-center justify-center gap-1 w-full transition-all cursor-pointer"
            >
              Analyze Recommendation Engine
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Dynamic Alerts timeline preview panel */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></div>
            <h3 className="text-xs font-bold text-slate-800 uppercase font-mono tracking-wider">Active threat alerts</h3>
          </div>
          <button 
            onClick={() => setActiveTab('alerts')}
            className="text-xs font-medium text-[#10b981] hover:underline cursor-pointer"
          >
            Review Alerts Control Center
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {alerts.slice(0, 3).map((alert, i) => (
            <div key={i} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {getSeverityBadge(alert.severity)}
                  <span className="text-xs font-bold text-slate-900">{alert.title}</span>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded">{alert.department}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed max-w-4xl line-clamp-1">{alert.description}</p>
              </div>

              <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                <span className="text-[10px] font-mono text-slate-400">Assignee: <span className="text-slate-850 font-semibold">{alert.assignedOwner || 'Unassigned'}</span></span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase leading-none border ${
                  alert.status === 'Resolved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                  alert.status === 'In Progress' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                  'bg-red-50 text-red-600 border-red-100'
                }`}>
                  {alert.status}
                </span>
                <button 
                  onClick={() => setActiveTab('alerts')}
                  className="bg-slate-900 hover:bg-black text-white text-[10px] font-semibold py-1 px-3 rounded transition-all cursor-pointer"
                >
                  Manage
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
