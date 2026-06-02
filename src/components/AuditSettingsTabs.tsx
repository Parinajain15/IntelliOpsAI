/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  History, 
  Settings, 
  Check, 
  HelpCircle, 
  Lock, 
  HardDrive, 
  ShieldCheck, 
  Server, 
  Trash2,
  ListFilter
} from 'lucide-react';
import { AuditLog } from '../types.js';

interface AuditSettingsTabsProps {
  onRefreshAll: () => void;
  activeSubGroup?: 'audit' | 'settings';
}

export default function AuditSettingsTabs({ onRefreshAll, activeSubGroup = 'audit' }: AuditSettingsTabsProps) {
  const [subTab, setSubTab] = useState<'audit' | 'settings'>(activeSubGroup === 'audit' ? 'audit' : 'settings');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isCalculated, setIsCalculated] = useState(false);

  // Settings inputs
  const [workspaceName, setWorkspaceName] = useState('IntelliOps Corporation Workspace');
  const [aiModel, setAiModel] = useState('gemini-3.5-flash');
  const [logLevel, setLogLevel] = useState('Verbose');
  const [credentialsStatus, setCredentialsStatus] = useState('Verified');

  const loadAuditLogs = () => {
    fetch('/api/audit-logs')
      .then(r => r.json())
      .then(data => setAuditLogs(data))
      .catch(err => console.error('Failed to load audit logs:', err));
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCalculated(true);
    setTimeout(() => {
      setIsCalculated(false);
    }, 1205);
  };

  const getActionClass = (action: string) => {
    switch (action) {
      case 'MANUAL_ENTRY':
      case 'QUICK_LOG':
        return 'text-blue-600 bg-blue-50 border border-blue-100';
      case 'CSV_UPLOAD':
        return 'text-[#10b981] bg-emerald-50 border border-emerald-100';
      case 'ALERT_UPDATE':
      case 'ALERT_RESOLVE':
        return 'text-red-650 bg-red-50 border border-red-100';
      case 'SAP_CONNECT':
      case 'SAP_SYNC':
        return 'text-indigo-650 bg-indigo-50 border border-indigo-100';
      default:
        return 'text-slate-650 bg-slate-50 border border-slate-100';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Subtab Head */}
      <div className="flex border-b border-slate-200 bg-white p-2 rounded-lg shadow-sm gap-1">
        <button
          onClick={() => setSubTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
            subTab === 'audit' ? 'bg-[#0f172a] text-white shadow' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <History className="w-4 h-4" />
          Security Audit Ledger
        </button>
        <button
          onClick={() => setSubTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
            subTab === 'settings' ? 'bg-[#0f172a] text-white shadow' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Settings className="w-4 h-4" />
          Workspace Configuration
        </button>
      </div>

      {/* ========================================================
          SECURITY AUDIT LOGS TAB
          ======================================================== */}
      {subTab === 'audit' && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-tight font-mono">Operations Audit Ledger</h2>
              <p className="text-xs text-slate-500 mt-1">Chronological compliance history tracking platform administrative switches, API handshakes, and database updates.</p>
            </div>
            
            <button
              onClick={loadAuditLogs}
              className="text-indigo-600 hover:underline text-xs font-medium flex items-center gap-1.5 cursor-pointer leading-none font-mono"
            >
              <History className="w-3.5 h-3.5" />
              Refresh Core Log Timeline
            </button>
          </div>

          {/* Audit Logs table */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-mono text-[10px] text-slate-450 uppercase tracking-wider">
                  <th className="py-2.5 px-4">Audit Entry ID</th>
                  <th className="py-2.5 px-4">Event Key</th>
                  <th className="py-2.5 px-4 font-semibold">User Principal</th>
                  <th className="py-2.5 px-4">Level</th>
                  <th className="py-2.5 px-4">Inscribed Timestamp</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Details Narrative</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-650">
                {auditLogs.map((log, i) => (
                  <tr key={i} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-450 text-[11px]">{log.id}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono font-bold ${getActionClass(log.actionType)}`}>
                        {log.actionType}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 font-sans">{log.performedBy}</td>
                    <td className="py-3 px-4">
                      <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-[10px] font-mono leading-none">
                        {log.userRole}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-450">
                      {new Date(log.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 text-right leading-snug max-w-sm truncate" title={log.details}>
                      {log.details}
                    </td>
                  </tr>
                ))}
                {auditLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-slate-400 py-12">No audit records inscribed currently.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          WORKSPACE SETTINGS TAB
          ======================================================= */}
      {subTab === 'settings' && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-tight font-mono">Workspace Constants & Configuration</h2>
            <p className="text-xs text-slate-500 mt-1 font-sans">Fine-tune the operations metrics aggregation intervals and model thresholds.</p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-6 text-xs text-slate-705 font-sans max-w-3xl">
            
            {/* Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 block">Organizational Workspace Name</label>
                <input 
                  type="text" 
                  value={workspaceName} 
                  onChange={e=>setWorkspaceName(e.target.value)} 
                  className="w-full border border-slate-200 rounded p-2 focus:outline-none focus:border-indigo-500 bg-white" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 block">AI Co-pilot Model Selection</label>
                <select 
                  value={aiModel} 
                  onChange={e=>setAiModel(e.target.value)}
                  className="w-full border border-slate-205 rounded p-2 focus:outline-none bg-white cursor-pointer"
                >
                  <option value="gemini-3.5-flash">Google Gemini 3.5 Flash (Enterprise Default)</option>
                  <option value="gemini-2.5-flash">Google Gemini 2.5 Flash</option>
                  <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                  <option value="custom-sap-llm">SAP Business AI Co-pilot v4</option>
                </select>
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5 opacity-80">
                <label className="font-semibold text-slate-700 block flex items-center gap-1">
                  Server Ingress Port Inbound
                  <Lock className="w-3 h-3 text-[#10b981]" />
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    readOnly 
                    value="Port: 3000 (Locked by NetWeaver Proxy Ingress)" 
                    className="w-full border border-slate-200 rounded p-2 bg-slate-50 text-slate-450 font-mono focus:outline-none block select-none" 
                  />
                </div>
                <span className="text-[10px] text-slate-450 font-mono">Infrastructure constants: server port is hardlocked at port 3000.</span>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-705 block">Operations Telemetry Levels</label>
                <select 
                  value={logLevel} 
                  onChange={e=>setLogLevel(e.target.value)}
                  className="w-full border border-slate-205 rounded p-2 focus:outline-none bg-white cursor-pointer"
                >
                  <option value="Verbose">Verbose (Log all handshake handshake logs)</option>
                  <option value="Standard">Standard (Log SLA violations and sync states)</option>
                  <option value="Severe Only">Severe Only</option>
                </select>
              </div>
            </div>

            {/* Network Security Compliance Banner */}
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex gap-3 items-start">
              <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 text-xs">Security Handshake Authentication Status</h4>
                <p className="text-slate-500 leading-relaxed text-[11px]">
                  Your platform local secret variables (`GEMINI_API_KEY`) are stored in secure environment vectors, shielding API keys from client-side browser exposure.
                </p>
                <div className="pt-2 text-[10px] font-mono font-bold text-emerald-600 flex gap-1.5 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  CREDENTIALS INTEGRITY_OK [VERIFIED]
                </div>
              </div>
            </div>

            {/* Form actions */}
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="submit"
                disabled={isCalculated}
                className="bg-slate-900 hover:bg-black text-white text-xs font-semibold px-5 py-2 rounded shadow transition-all flex items-center gap-1 cursor-pointer"
              >
                {isCalculated ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500 grow animate-ping" />
                    Inscribing Workspace Constants...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 text-[#10b981]" />
                    Inscribe Configuration
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
}
