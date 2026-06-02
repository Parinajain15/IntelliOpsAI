/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  User, 
  MessageSquare, 
  CheckSquare, 
  Clock, 
  ArrowUpRight, 
  UserPlus, 
  Send,
  Bookmark,
  CheckCircle,
  HelpCircle,
  Loader
} from 'lucide-react';
import { Alert, Employee } from '../types.js';

interface AlertsTabProps {
  onRefreshAll: () => void;
  userRole: 'Director' | 'Operations Manager' | 'Team Lead';
}

export default function AlertsTab({ onRefreshAll, userRole }: AlertsTabProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Resolution inputs state
  const [assignedOwner, setAssignedOwner] = useState('');
  const [resolutionRemarks, setResolutionRemarks] = useState('');
  const [newComment, setNewComment] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [operationSuccess, setOperationSuccess] = useState<string | null>(null);

  const loadAlertsAndStaff = () => {
    fetch('/api/alerts').then(r=>r.json()).then(data=>setAlerts(data));
    fetch('/api/employees').then(r=>r.json()).then(data=>setEmployees(data));
  };

  useEffect(() => {
    loadAlertsAndStaff();
  }, []);

  const handleExpand = (alert: Alert) => {
    if (expandedId === alert.id) {
      setExpandedId(null);
    } else {
      setExpandedId(alert.id);
      setAssignedOwner(alert.assignedOwner || '');
      setResolutionRemarks(alert.resolutionNotes || '');
    }
  };

  const handleUpdateAlert = (id: string, newStatus: 'Open' | 'In Progress' | 'Resolved') => {
    setSubmitLoading(true);
    
    const payload = {
      status: newStatus,
      assignedOwner: assignedOwner || 'Operations Manager',
      remarks: 'Status updated via alert terminal',
      resolutionNotes: newStatus === 'Resolved' ? resolutionRemarks || 'Resolved issue' : ''
    };

    fetch(`/api/alerts/${id}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(() => {
      setOperationSuccess(`Alert successfully updated to ${newStatus}`);
      onRefreshAll();
      loadAlertsAndStaff();
      setSubmitLoading(false);
      setTimeout(() => {
        setOperationSuccess(null);
        if (newStatus === 'Resolved') setExpandedId(null);
      }, 2000);
    })
    .catch(err => {
      console.error(err);
      setSubmitLoading(false);
    });
  };

  const handleAddComment = (id: string) => {
    if (!newComment.trim()) return;
    
    fetch(`/api/alerts/${id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user: `${userRole} User`,
        text: newComment
      })
    })
    .then(res => res.json())
    .then(() => {
      setNewComment('');
      loadAlertsAndStaff();
    })
    .catch(err => console.error(err));
  };

  const getAlertBadge = (sev: 'Low' | 'Moderate' | 'High' | 'Critical') => {
    switch (sev) {
      case 'Critical':
        return <span className="bg-red-50 text-red-600 border border-red-200 text-[10px] uppercase font-bold px-2 py-0.5 rounded font-mono animate-pulse">Critical</span>;
      case 'High':
        return <span className="bg-amber-50 text-amber-600 border border-amber-250 text-[10px] uppercase font-bold px-2 py-0.5 rounded font-mono">High Warning</span>;
      case 'Moderate':
        return <span className="bg-blue-50 text-blue-600 border border-blue-200 text-[10px] uppercase font-bold px-2 py-0.5 rounded font-mono">Moderate</span>;
      default:
        return <span className="bg-slate-50 text-slate-500 border border-slate-200 text-[10px] uppercase font-bold px-2 py-0.5 rounded font-mono">Low Threat</span>;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-6">
      
      {/* Head */}
      <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-tight font-mono flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            Alerts Management Portal
          </h2>
          <p className="text-xs text-slate-500 mt-1">Investigate, assign ownership, thread developer notes, and execute manual SLA resolutions.</p>
        </div>
        <span className="text-[10px] bg-red-50 border border-red-100 font-mono text-red-700 font-bold px-2.5 py-1 rounded">
          {alerts.filter(a => a.status !== 'Resolved').length} Unresolved Threats
        </span>
      </div>

      {operationSuccess && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-3 rounded-lg text-xs font-semibold flex items-center gap-2 animate-bounce shadow">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          {operationSuccess}
        </div>
      )}

      {/* Main expanded checklist details */}
      <div className="space-y-4">
        {alerts.map((alert, i) => {
          const isExpanded = expandedId === alert.id;
          const isResolved = alert.status === 'Resolved';
          const isPending = alert.status === 'Open';
          const isWorking = alert.status === 'In Progress';
          
          return (
            <div 
              key={i} 
              className={`border rounded-lg transition-all ${
                isExpanded ? 'border-indigo-500 shadow-md bg-slate-50/50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/20'
              }`}
            >
              {/* Alert header row summary line */}
              <div 
                onClick={() => handleExpand(alert)}
                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getAlertBadge(alert.severity)}
                    <h3 className="text-sm font-bold text-slate-900">{alert.title}</h3>
                    <span className="text-[10px] uppercase font-mono font-bold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded">
                      {alert.department}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-sans">{alert.description}</p>
                </div>

                <div className="flex items-center gap-4 self-end md:self-center shrink-0">
                  <div className="text-right">
                    <p className="text-[10px] font-mono text-slate-400">Assigned Owner:</p>
                    <p className="text-xs font-semibold text-slate-800 font-mono">{alert.assignedOwner || 'Unassigned'}</p>
                  </div>
                  
                  <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase font-mono border ${
                    isResolved ? 'bg-emerald-50 border-emerald-150 text-emerald-700' :
                    isWorking ? 'bg-blue-50 border-blue-150 text-blue-700' : 'bg-red-50 border-red-150 text-red-700'
                  }`}>
                    {alert.status}
                  </span>
                </div>
              </div>

              {/* Expansion block: detailed RCA desk */}
              {isExpanded && (
                <div className="p-5 border-t border-slate-200 bg-white grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs text-slate-700 font-sans">
                  
                  {/* Left Column: Actions and settings */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                      <h4 className="font-mono text-[10px] text-slate-450 font-bold uppercase tracking-wider mb-2">Root Cause Analysis (RCA)</h4>
                      <p className="leading-relaxed text-xs text-slate-650">
                        {alert.title.includes('Ningbo') 
                          ? 'A physical congestion backup in Terminal 3 customs inspection lanes is currently delaying outbound logistics tracking. Average release latency has elevated to +180 mins above SLA tolerances. Bypass routes via Shanghai are active.'
                          : alert.title.includes('Priya') 
                          ? 'Engineering backlog load analysis reveals Priya Patel is currently allocated 5 active, high-priority tasks (54 total estimated hours worked) with zero redundant reviewers, introducing a direct SLA exposure.'
                          : alert.title.includes('Database') 
                          ? 'Internal telemetry is reporting login router handshake gateway timeouts. Connection buffers are approaching standard pool allocation limits.'
                          : alert.title.includes('SuccessFactors') 
                          ? 'Direct API schema mismatch encountered between local employee sync directory and core corporate SAP cloud hosts.'
                          : `Standard operational telemetry validation: Calculated load thresholds exceeded limits for the assigned resources queue. Immediate investigation initiated regarding the active duties of ${alert.assignedOwner || 'the designated team lead'} in ${alert.department || 'Operations'}.`}
                      </p>
                    </div>

                    {/* Operational controls */}
                    <div className="grid grid-cols-2 gap-4">
                      
                      {/* Owner Dropdown assignment */}
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-600 block">Designated Incident Owner</label>
                        <select 
                          value={assignedOwner} 
                          onChange={(e) => setAssignedOwner(e.target.value)}
                          className="w-full border border-slate-200 rounded p-2 focus:outline-none focus:border-indigo-500 bg-white cursor-pointer"
                        >
                          <option value="">-- Assign Staff --</option>
                          {employees.filter(e => e.department === alert.department).map((emp, i) => (
                            <option key={i} value={emp.name}>{emp.name} ({emp.department})</option>
                          ))}
                          <option value="Operations Manager">Operations Manager (Local)</option>
                        </select>
                      </div>

                      {/* Immediate Status buttons */}
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-600 block">Incident Mitigation Stage</label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={isWorking || isResolved}
                            onClick={() => handleUpdateAlert(alert.id, 'In Progress')}
                            className="flex-1 bg-slate-900 border border-black hover:bg-black text-white p-2 rounded font-semibold transition-all cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200"
                          >
                            Mark: In Progress
                          </button>
                        </div>
                      </div>

                    </div>

                    {/* Resolution Notes form */}
                    <div className="space-y-1.5 pt-2">
                      <label className="font-semibold text-slate-700 block">Resolution Compliance Logs notes</label>
                      <textarea
                        rows={3}
                        placeholder="Provide formal structural documentation regarding how this issue was permanently cleared down..."
                        value={resolutionRemarks}
                        onChange={(e) => setResolutionRemarks(e.target.value)}
                        className="w-full border border-slate-200 focus:border-emerald-500 rounded p-2.5 focus:outline-none transition-all resize-none"
                      />
                      <button
                        type="button"
                        disabled={submitLoading || isResolved}
                        onClick={() => handleUpdateAlert(alert.id, 'Resolved')}
                        className="w-full bg-[#10b981] hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold p-2.5 rounded shadow-sm transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        {submitLoading && <Loader className="w-4 h-4 animate-spin" />}
                        Approve Resolution Protocol & Close Alert
                      </button>
                    </div>

                  </div>

                  {/* Right Column: Threaded comments section */}
                  <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col justify-between">
                    <div>
                      <h4 className="font-mono text-[10px] text-slate-450 font-bold uppercase tracking-wider mb-3">Operational Thread Log</h4>
                      
                      <div className="space-y-3 max-h-56 overflow-y-auto scrollbar-thin mb-3.5 pr-1">
                        {alert.comments.map((comment, idx) => (
                          <div key={idx} className="p-2.5 bg-white border border-slate-200 rounded text-[11px] space-y-1 leading-snug">
                            <div className="flex items-center justify-between text-[10px] text-slate-450 font-mono font-semibold">
                              <span>User: {comment.user}</span>
                              <span>{new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-slate-700">{comment.text}</p>
                          </div>
                        ))}
                        {alert.comments.length === 0 && (
                          <div className="text-center text-slate-450 py-12">No internal comments logged on alert thread.</div>
                        )}
                      </div>
                    </div>

                    {/* Submit comment inline layout */}
                    <div className="flex gap-1.5 pt-3 border-t border-slate-100">
                      <input
                        type="text"
                        placeholder="Type comment to thread..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="flex-1 border border-slate-200 bg-white rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 font-sans"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddComment(alert.id)}
                        className="bg-indigo-650 hover:bg-indigo-750 text-white rounded p-1.5 transition-all cursor-pointer bg-slate-900 border border-black hover:bg-black"
                        title="Add Comment"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>

                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
