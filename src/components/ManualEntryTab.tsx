/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  PenTool, 
  Send, 
  Clock, 
  HelpCircle, 
  AlertCircle,
  Zap,
  Activity,
  User,
  PlusCircle,
  CheckCircle2,
  Bookmark
} from 'lucide-react';
import { TaskRecord, OperationalLog } from '../types.js';

interface ManualEntryTabProps {
  onTaskCreated: () => void;
  onLogAdded: () => void;
}

export default function ManualEntryTab({ onTaskCreated, onLogAdded }: ManualEntryTabProps) {
  // Manual Task input state
  const [employeeName, setEmployeeName] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [taskStatus, setTaskStatus] = useState<'Pending' | 'In Progress' | 'Completed'>('Pending');
  const [hoursWorked, setHoursWorked] = useState('0');
  const [slaBreached, setSlaBreached] = useState(false);
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().substring(0, 10);
  });
  const [notes, setNotes] = useState('');
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const [taskSuccess, setTaskSuccess] = useState(false);

  // Quick Operational Log state
  const [quickMsg, setQuickMsg] = useState('');
  const [quickType, setQuickType] = useState<'issue' | 'delay' | 'escalation' | 'overload' | 'incident' | 'risk note'>('risk note');
  const [quickDept, setQuickDept] = useState('Engineering');
  const [quickPriority, setQuickPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [liveLogs, setLiveLogs] = useState<OperationalLog[]>([]);
  const [isSubmittingLog, setIsSubmittingLog] = useState(false);

  // Load existing operational log stream
  const loadLogStream = () => {
    fetch('/api/logs')
      .then(res => res.json())
      .then(data => setLiveLogs(data))
      .catch(err => console.error('Failed to load logs stream:', err));
  };

  useEffect(() => {
    loadLogStream();
  }, []);

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeName.trim() || !notes.trim()) return;

    setIsSubmittingTask(true);
    setTaskSuccess(false);

    const taskPayload = {
      employeeName,
      department,
      status: taskStatus,
      hoursWorked: Number(hoursWorked) || 0,
      slaBreached,
      priority,
      dueDate: new Date(dueDate).toISOString(),
      notes
    };

    fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskPayload)
    })
    .then(res => res.json())
    .then(() => {
      setEmployeeName('');
      setNotes('');
      setHoursWorked('0');
      setSlaBreached(false);
      setTaskSuccess(true);
      setIsSubmittingTask(false);
      onTaskCreated(); // Recalc metrics on parent
      setTimeout(() => setTaskSuccess(false), 3000);
    })
    .catch(err => {
      console.error(err);
      setIsSubmittingTask(false);
    });
  };

  const handleQuickLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickMsg.trim()) return;

    setIsSubmittingLog(true);

    const logPayload = {
      type: quickType,
      message: quickMsg,
      department: quickDept,
      priority: quickPriority,
      reportedBy: 'Operations Manager'
    };

    fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logPayload)
    })
    .then(res => res.json())
    .then(() => {
      setQuickMsg('');
      setIsSubmittingLog(false);
      onLogAdded(); // Refresh parent
      loadLogStream(); // Refresh local list
    })
    .catch(err => {
      console.error(err);
      setIsSubmittingLog(false);
    });
  };

  // Instant pre-set triggers for Quick Logging ("One-click" logging buttons)
  const triggerFastLog = (type: typeof quickType, msg: string, dept: string, prio: typeof quickPriority) => {
    setQuickType(type);
    setQuickMsg(msg);
    setQuickDept(dept);
    setQuickPriority(prio);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Left side: Robust Task Entry Form */}
      <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-tight font-mono flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-[#10b981]" />
            Enterprise Records Logging Portal
          </h2>
          <p className="text-xs text-slate-500 mt-1">Deploy or track custom task items, workload reports, or SLA events manually</p>
        </div>

        <form onSubmit={handleTaskSubmit} className="space-y-4 text-xs">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Employee Name */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 block">Responsible Employee</label>
              <input
                type="text"
                required
                placeholder="e.g. Priya Patel"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                className="w-full border border-slate-200 hover:border-slate-305 focus:border-indigo-500 rounded p-2 focus:outline-none transition-all font-sans"
              />
            </div>

            {/* Department Selector */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 block">Department Node</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full border border-slate-205 focus:border-indigo-500 rounded p-2 focus:outline-none transition-all cursor-pointer bg-white"
              >
                <option value="Engineering">Engineering</option>
                <option value="Supply Chain">Supply Chain</option>
                <option value="Quality Assurance">Quality Assurance</option>
                <option value="Customer Support">Customer Support</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Hour limit worked */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 block">Hours worked on Task</label>
              <input
                type="number"
                min="0"
                required
                value={hoursWorked}
                onChange={(e) => setHoursWorked(e.target.value)}
                className="w-full border border-slate-200 focus:border-indigo-500 rounded p-2 focus:outline-none transition-all font-mono"
              />
            </div>

            {/* Priority level */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 block">Priority Class</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full border border-slate-205 focus:border-indigo-500 rounded p-2 focus:outline-none transition-all cursor-pointer bg-white"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            {/* Status Type */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 block">Operational Status</label>
              <select
                value={taskStatus}
                onChange={(e) => setTaskStatus(e.target.value as any)}
                className="w-full border border-slate-205 focus:border-indigo-500 rounded p-2 focus:outline-none transition-all cursor-pointer bg-white"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Due Date picker */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 block">Task Due Date</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full border border-slate-200 focus:border-indigo-500 rounded p-2 focus:outline-none transition-all font-mono"
              />
            </div>

            {/* SLA Breachtoggle checkbox */}
            <div className="space-y-1.5 flex flex-col justify-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={slaBreached}
                  onChange={(e) => setSlaBreached(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-0 cursor-pointer"
                />
                <div className="text-slate-700 font-semibold flex items-center gap-1">
                  Task Breaches SLA Limits
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" title="Check if this workflow is actively threatening SLA limit compliance" />
                </div>
              </label>
            </div>
          </div>

          {/* Operational Notes */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 block">Operational Logs Notes</label>
            <textarea
              required
              rows={4}
              placeholder="Provide a clear, detailed operational memo explaining this ticket update..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-slate-200 focus:border-indigo-500 rounded p-2.5 focus:outline-none transition-all font-sans resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              {taskSuccess && (
                <div className="text-emerald-600 font-bold flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded border border-emerald-100 animate-bounce">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  Task ledger injected successfully
                </div>
              )}
            </div>
            
            <button
              type="submit"
              disabled={isSubmittingTask}
              className="bg-slate-900 border border-black hover:bg-black text-white px-5 py-2 rounded font-semibold transition-all shadow-sm cursor-pointer disabled:bg-slate-400 flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              {isSubmittingTask ? 'Inscribing...' : 'Register Task Ledger'}
            </button>
          </div>

        </form>
      </div>

      {/* Right side: Lightweight Fast Quick Logging Panel */}
      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex flex-col justify-between">
        <div className="space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-tight font-mono flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[#f59e0b] animate-bounce" />
              Quick Operational Memos
            </h2>
            <p className="text-[11px] text-slate-450 mt-0.5">Instant ledger tracking for live operational incidents or workload shifts</p>
          </div>

          {/* One-click templates bubble list */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-slate-450 uppercase block mb-1">Instant Scenario Injectors</span>
            <div className="flex flex-wrap gap-1.5">
              <button 
                type="button"
                onClick={() => triggerFastLog('delay', 'Fulfillment queue congestion reported on shipping port lane A', 'Supply Chain', 'High')}
                className="bg-slate-50 hover:bg-slate-100 hover:border-slate-300 border border-slate-200 text-[10px] py-1 px-2 rounded-full cursor-pointer transition-colors"
              >
                🚨 Log Cargo Delay
              </button>
              <button 
                type="button"
                onClick={() => triggerFastLog('overload', 'Resource overload: Engineering unit requests temporary staffing unblock', 'Engineering', 'Medium')}
                className="bg-slate-50 hover:bg-slate-100 hover:border-slate-300 border border-slate-200 text-[10px] py-1 px-2 rounded-full cursor-pointer transition-colors"
              >
                ⚠️ Log Team Overload
              </button>
              <button 
                type="button"
                onClick={() => triggerFastLog('incident', 'Physical inventory calibration discrepancy discovered at Zone-B shelf ledger', 'Supply Chain', 'Medium')}
                className="bg-slate-50 hover:bg-slate-100 hover:border-slate-300 border border-slate-200 text-[10px] py-1 px-2 rounded-full cursor-pointer transition-colors"
              >
                ⚡ Log Stock Anomaly
              </button>
              <button 
                type="button"
                onClick={() => triggerFastLog('escalation', 'EMEA router database reported timeout spikes during login handshake', 'Engineering', 'High')}
                className="bg-slate-50 hover:bg-slate-100 hover:border-slate-300 border border-slate-200 text-[10px] py-1 px-2 rounded-full cursor-pointer transition-colors"
              >
                🔥 Log Server Deficit
              </button>
            </div>
          </div>

          {/* Quick submission form */}
          <form onSubmit={handleQuickLogSubmit} className="space-y-3.5 pt-3.5 border-t border-slate-100 text-xs text-slate-650">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-600 block">Log Type</label>
                <select
                  value={quickType}
                  onChange={(e) => setQuickType(e.target.value as any)}
                  className="w-full border border-slate-200 rounded p-1.5 focus:outline-none focus:border-amber-500 cursor-pointer bg-white"
                >
                  <option value="risk note">Risk Note</option>
                  <option value="delay">Delay</option>
                  <option value="incident">Incident</option>
                  <option value="overload">Overload</option>
                  <option value="escalation">Escalation</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-600 block">Department</label>
                <select
                  value={quickDept}
                  onChange={(e) => setQuickDept(e.target.value)}
                  className="w-full border border-slate-200 rounded p-1.5 focus:outline-none focus:border-amber-500 cursor-pointer bg-white"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Supply Chain">Supply Chain</option>
                  <option value="Quality Assurance">QA</option>
                  <option value="Customer Support">Support</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-600 block">Log Message</label>
              <input
                type="text"
                required
                placeholder="Briefly describe what happened..."
                value={quickMsg}
                onChange={(e) => setQuickMsg(e.target.value)}
                className="w-full border border-slate-200 focus:border-amber-500 rounded p-2 focus:outline-none font-sans"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmittingLog || !quickMsg.trim()}
              className="w-full bg-[#f59e0b] hover:bg-amber-600 disabled:bg-slate-100 disabled:text-slate-400 text-white font-semibold py-2 rounded shadow-sm text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 text-xs"
            >
              <Send className="w-3.5 h-3.5" />
              {isSubmittingLog ? 'Registering...' : 'Dispatch Quick Memo'}
            </button>
          </form>
        </div>

        {/* Live logs console */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Activity className="w-3 h-3 text-indigo-500 animate-pulse" />
              Real-time Logs Console
            </span>
            <span className="text-[9px] font-mono text-slate-400">Node_ID: 3000_INGRES</span>
          </div>

          <div className="bg-[#0b1329] border border-[#1e294b] rounded p-2.5 h-32 overflow-y-auto font-mono text-[10px] text-slate-300 space-y-1.5 scrollbar-thin">
            {liveLogs.map((log, i) => (
              <div key={i} className="leading-snug hover:bg-slate-800/30 p-1 rounded transition-colors flex items-start gap-1">
                <span className="text-slate-500 font-semibold flex shrink-0">&gt;</span>
                <span className="flex-1">
                  <span className={`${
                    log.type === 'incident' || log.type === 'escalation' ? 'text-red-400 font-bold' :
                    log.type === 'delay' || log.type === 'overload' ? 'text-amber-400 font-bold' : 'text-[#10b981]'
                  } mr-1`}>
                    [{log.type.toUpperCase()}]
                  </span>
                  <span className="text-slate-400 mr-1">({log.department})</span>
                  <span>{log.message}</span>
                </span>
                <span className="text-slate-550 shrink-0 text-[8px] self-center">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            {liveLogs.length === 0 && (
              <div className="text-slate-500 text-center py-6">No operational logs logged.</div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
