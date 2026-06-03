/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  BarChart3, 
  Upload, 
  Cpu, 
  Database, 
  Network, 
  TrendingUp, 
  Zap, 
  AlertTriangle, 
  Sparkles, 
  History, 
  Settings, 
  PenTool, 
  User,
  ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: 'Director' | 'Operations Manager' | 'Team Lead';
  setUserRole: (role: 'Director' | 'Operations Manager' | 'Team Lead') => void;
}

export default function Sidebar({ activeTab, setActiveTab, userRole, setUserRole }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: BarChart3, category: 'Analytics' },
    { id: 'upload', label: 'Upload Operational Data', icon: Upload, category: 'Ingestion' },
    { id: 'manual-entry', label: 'Manual Entry Portal', icon: PenTool, category: 'Ingestion' },
    { id: 'sap-integrations', label: 'SAP ERP Connectors', icon: Cpu, category: 'Integrations' },
    { id: 'db-sources', label: 'Database Sources', icon: Database, category: 'Integrations' },
    { id: 'api-integrations', label: 'REST API Connections', icon: Network, category: 'Integrations' },
    { id: 'predictions', label: 'SLA Risk Predictions', icon: TrendingUp, category: 'Predictive Intelligence' },
    { id: 'recommendations', label: 'Ops Recommendations', icon: Zap, category: 'Predictive Intelligence' },
    { id: 'alerts', label: 'Alerts Control Center', icon: AlertTriangle, category: 'Workflows' },
    { id: 'ai-insights', label: 'C-Suite AI Insights', icon: Sparkles, category: 'Workflows' },
    { id: 'audit-logs', label: 'Audit Security Logs', icon: History, category: 'System' },
    { id: 'settings', label: 'Workspace Settings', icon: Settings, category: 'System' }
  ];

  // Group items by category to make it look like a highly structured enterprise application
  const categories = ['Analytics', 'Ingestion', 'Integrations', 'Predictive Intelligence', 'Workflows', 'System'];

  return (
    <aside className="w-64 bg-[#0b1329] text-slate-300 flex flex-col h-screen shrink-0 border-r border-[#1e294b]">
      {/* Platform Branding header */}
      <div className="p-5 border-b border-[#1e294b] flex items-center gap-3">
        <div className="w-8 h-8 rounded-md bg-[#10b981] flex items-center justify-center text-[#0b1329] font-bold text-lg shadow-sm">
          Ω
        </div>
        <div>
          <h1 className="font-semibold text-white tracking-tight leading-none text-base">IntelliOps AI</h1>
          <span className="text-[10px] text-slate-400 font-mono">OPERATIONAL INTEL</span>
        </div>
      </div>

      {/* Role-Based Controller Picker */}
      <div className="px-4 pt-4 pb-2 border-b border-[#131f42]">
        <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Active Authority Role</label>
        <div className="relative">
          <select 
            value={userRole} 
            onChange={(e) => {
              const selectedRole = e.target.value as 'Director' | 'Operations Manager' | 'Team Lead';
              setUserRole(selectedRole);
              // Fire custom event to log role change audit
              fetch('/api/audit-logs')
                .then(() => {
                  console.log(`Role switched to ${selectedRole}`);
                });
            }}
            className="w-full bg-[#111c3a] border border-[#1e294b] text-xs text-white rounded px-2.5 py-1.5 focus:outline-none focus:border-[#10b981] cursor-pointer font-sans"
          >
            <option value="Director">Director (Executive)</option>
            <option value="Operations Manager">Operations Manager</option>
            <option value="Team Lead">Team Lead (Operations)</option>
          </select>
          <div className="mt-1 flex items-center gap-1.5 px-1">
            <ShieldCheck className="w-3 h-3 text-[#10b981]" />
            <span className="text-[10px] text-slate-400 font-mono">
              {userRole === 'Director' && 'Full executive brief access'}
              {userRole === 'Operations Manager' && 'Control integration & alerts'}
              {userRole === 'Team Lead' && 'Log logs & claim tasks'}
            </span>
          </div>
        </div>
      </div>

      {/* Scrollable Navigation section */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {categories.map(cat => {
          const items = menuItems.filter(i => i.category === cat);
          return (
            <div key={cat} className="space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest px-3 block mb-1">
                {cat}
              </span>
              {items.map(item => {
                const Icon = item.icon;
                const isSelected = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded transition-all text-left ${
                      isSelected 
                        ? 'bg-[#10b981]/10 text-white border-l-2 border-[#10b981] font-semibold' 
                        : 'text-slate-400 hover:bg-[#111c3a] hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#10b981]' : 'text-slate-400 hover:text-white'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Corporate User profile at the footer */}
      <div className="p-4 bg-[#080d1d] border-t border-[#1e294b] flex items-center gap-2 text-xs">
        <div className="w-8 h-8 rounded-full bg-[#1e294b] text-slate-350 flex items-center justify-center font-bold font-mono">
          {userRole[0]}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-200 truncate">{userRole}</p>
          <p className="text-[10px] text-slate-500 truncate">ops-console@internal.corp</p>
        </div>
      </div>
    </aside>
  );
}
