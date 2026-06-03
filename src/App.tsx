/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Search, 
  Sparkles, 
  Shield, 
  RefreshCw, 
  ShieldAlert,
  Sliders,
  LogOut,
  ChevronDown
} from 'lucide-react';

// Subcomponents
import Sidebar from './components/Sidebar.js';
import KPICards from './components/KPICards.js';
import DashboardTab from './components/DashboardTab.js';
import UploadTab from './components/UploadTab.js';
import ManualEntryTab from './components/ManualEntryTab.js';
import IntegrationsTabs from './components/IntegrationsTabs.js';
import PredictionsRecommendationsTab from './components/PredictionsRecommendationsTab.js';
import AlertsTab from './components/AlertsTab.js';
import AIInsightsTab from './components/AIInsightsTab.js';
import AuditSettingsTabs from './components/AuditSettingsTabs.js';

import { Alert, Employee } from './types.js';

interface DashboardSummary {
  operationalHealthScore: number;
  healthCategory: 'Healthy' | 'Moderate' | 'Degraded' | 'Critical';
  employeesCount: number;
  tasksCount: number;
  completionRate: number;
  slaBreachRate: number;
  activeAlertsCount: number;
  averageHours: number;
  overloadedDepartments: string[];
  topRisks: any[];
  activeAnomalies: any[];
  predictedSlaRisks: any[];
  recommendationQueue: any[];
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userRole, setUserRole] = useState<'Director' | 'Operations Manager' | 'Team Lead'>('Operations Manager');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [aiBriefingLoading, setAiBriefingLoading] = useState(false);
  const [latestBriefingText, setLatestBriefingText] = useState('');

  const loadData = () => {
    setRefreshing(true);
    fetch('/api/dashboard-summary')
      .then(res => res.json())
      .then(data => {
        setSummary(data);
        setLoading(false);
        setRefreshing(false);
      })
      .catch(err => {
        console.error('Failed to load dashboard metrics summary:', err);
        setLoading(false);
        setRefreshing(false);
      });

    fetch('/api/alerts')
      .then(res => res.json())
      .then(data => setAlerts(data))
      .catch(err => console.error('Failed to load active alerts:', err));
  };

  useEffect(() => {
    loadData();
  }, []);

  const triggerGlobalRefresh = () => {
    loadData();
  };

  // Run initial briefing synthesis if empty
  const handleAutoTriggerAi = () => {
    setAiBriefingLoading(true);
    fetch('/api/ai/generate-briefing', { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        setLatestBriefingText(data.executiveSummary);
        setAiBriefingLoading(false);
        loadData();
      })
      .catch(err => {
        console.error('Failed to autotrigger briefing:', err);
        setAiBriefingLoading(false);
      });
  };

  const handleBriefingUpdate = (text: string) => {
    setLatestBriefingText(text);
  };

  // Helper title selector
  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Executive Operations Commander';
      case 'upload': return 'Ops Ledger Data Ingestion';
      case 'manual-entry': return 'Operational Manual Entry Terminal';
      case 'sap-integrations': return 'SAP ERP Interface Outlets';
      case 'db-sources': return 'Database Sources Replication';
      case 'api-integrations': return 'Outbound Webhook REST APIs';
      case 'predictions': return 'Predictive SLA Risks Forecasting';
      case 'recommendations': return 'Operational Remediation Queue';
      case 'alerts': return 'Incident Audits & Alerts Desk';
      case 'ai-insights': return 'C-Suite AI Strategicbriefings';
      case 'audit-logs': return 'Chronological Security Audits';
      case 'settings': return 'Workspace Control Configuration';
      default: return 'Platform Operations Hub';
    }
  };

  // Handle alerts unread count
  const unreadAlerts = alerts.filter(a => a.status !== 'Resolved').length;

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc] text-[#0f172a] antialiased">
      
      {/* Sidebar Navigation frame container */}
      <Sidebar 
        activeTab={activeTab === 'sap-integrations' || activeTab === 'db-sources' || activeTab === 'api-integrations' ? 'sap-integrations' : activeTab === 'predictions' || activeTab === 'recommendations' ? 'predictions' : activeTab === 'audit-logs' || activeTab === 'settings' ? 'audit-logs' : activeTab}
        setActiveTab={(tabId) => {
          if (tabId === 'sap-integrations') {
            setActiveTab('sap-integrations');
          } else if (tabId === 'predictions') {
            setActiveTab('predictions');
          } else if (tabId === 'audit-logs') {
            setActiveTab('audit-logs');
          } else {
            setActiveTab(tabId);
          }
        }} 
        userRole={userRole}
        setUserRole={setUserRole}
      />

      {/* Main Content Workspace Layout */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Global Enterprise Header banner */}
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.01)] relative z-10">
          
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded font-mono border ${
              userRole === 'Director' 
                ? 'bg-emerald-50 border-emerald-150 text-emerald-700' 
                : userRole === 'Operations Manager'
                ? 'bg-blue-50 border-blue-150 text-blue-700'
                : 'bg-amber-50 border-amber-150 text-amber-700'
            }`}>
              <Shield className="w-3.5 h-3.5" />
              {userRole} VIEW
            </span>
            <div className="w-px h-4 bg-slate-250"></div>
            <h1 className="text-sm font-semibold tracking-tight uppercase font-mono text-slate-800">{getTabTitle()}</h1>
          </div>

          <div className="flex items-center gap-4">
            
            {/* Real Search bar */}
            <div className="relative max-w-xs shrink-0 hidden md:block">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search operational nodes..."
                className="w-56 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:outline-none focus:border-indigo-500 text-xs rounded pl-9 pr-3.5 py-1.5 transition-all font-sans"
              />
            </div>

            {/* Glowing Active Alert notification badge (jumps to Alerts panel) */}
            <button 
              onClick={() => setActiveTab('alerts')}
              title={`${unreadAlerts} Unresolved Threat Alerts`}
              className="relative p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-all cursor-pointer border border-transparent hover:border-slate-200"
            >
              <Bell className="w-4.5 h-4.5" />
              {unreadAlerts > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-mono font-bold text-white animate-pulse">
                  {unreadAlerts}
                </span>
              )}
            </button>

            {/* Database refresh trigger */}
            <button
              onClick={triggerGlobalRefresh}
              title="Recalculate Operational Models"
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-900 border border-transparent hover:border-slate-200 transition-all cursor-pointer flex items-center"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#10b981]' : ''}`} />
            </button>

            {/* Operational User indicator */}
            <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
            <div className="items-center gap-2 hidden sm:flex">
              <div className="w-8 h-8 rounded-full bg-slate-900 border border-black flex items-center justify-center font-bold text-white text-xs font-mono select-none">
                {userRole[0]}
              </div>
              <div className="text-left leading-none">
                <p className="text-xs font-semibold text-slate-900">{userRole}</p>
                <span className="text-[9px] font-mono text-slate-450 uppercase">Internal Corp IP</span>
              </div>
            </div>

          </div>
        </header>

        {/* Scrollable central content dashboard body workspace */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50/50 space-y-6">
          
          {loading ? (
            /* System Loading State */
            <div className="flex flex-col items-center justify-center h-full space-y-3 py-20 animate-pulse">
              <div className="w-10 h-10 border-4 border-slate-200 border-t-[#10b981] rounded-full animate-spin"></div>
              <p className="text-xs font-semibold font-mono text-slate-500 uppercase tracking-widest">BOOTSTRAPPING INTELLIOPS ENGINE HANDSHAKE...</p>
            </div>
          ) : summary ? (
            /* Active view sheets renderer */
            <div className="space-y-6 max-w-[1600px] mx-auto">
              
              {/* Contextual statistics block (KPI) displayed across all analytical/input tabs to give visual authority */}
              {(activeTab === 'dashboard' || activeTab === 'upload' || activeTab === 'manual-entry') && (
                <KPICards metrics={summary} />
              )}

              {/* ROUTER SWITCH */}
              {activeTab === 'dashboard' && (
                <DashboardTab 
                  summary={summary} 
                  alerts={alerts}
                  userRole={userRole}
                  setActiveTab={setActiveTab}
                  triggerAiCalculation={handleAutoTriggerAi}
                  aiBriefingLoading={aiBriefingLoading}
                  latestBriefingText={latestBriefingText}
                />
              )}

              {activeTab === 'upload' && (
                <UploadTab 
                  onSuccessUpload={triggerGlobalRefresh}
                  addOperationalLog={(msg, d, p) => console.log('Log entry: ', msg)}
                  triggerRefresh={triggerGlobalRefresh}
                />
              )}

              {activeTab === 'manual-entry' && (
                <ManualEntryTab 
                  onTaskCreated={triggerGlobalRefresh}
                  onLogAdded={triggerGlobalRefresh}
                />
              )}

              {(activeTab === 'sap-integrations' || activeTab === 'db-sources' || activeTab === 'api-integrations') && (
                <IntegrationsTabs 
                  onActivityLog={triggerGlobalRefresh}
                  activeSubSection={
                    activeTab === 'sap-integrations' ? 'sap' :
                    activeTab === 'db-sources' ? 'db' : 'api'
                  }
                />
              )}

              {(activeTab === 'predictions' || activeTab === 'recommendations') && (
                <PredictionsRecommendationsTab 
                  onWorkflowRecalculation={triggerGlobalRefresh}
                  activeGroup={activeTab === 'predictions' ? 'predictions' : 'recommendations'}
                />
              )}

              {activeTab === 'alerts' && (
                <AlertsTab 
                  onRefreshAll={triggerGlobalRefresh}
                  userRole={userRole}
                />
              )}

              {activeTab === 'ai-insights' && (
                <AIInsightsTab 
                  onBriefingGenerated={handleBriefingUpdate}
                  aiBriefingLoading={aiBriefingLoading}
                  setAiBriefingLoading={setAiBriefingLoading}
                />
              )}

              {(activeTab === 'audit-logs' || activeTab === 'settings') && (
                <AuditSettingsTabs 
                  onRefreshAll={triggerGlobalRefresh}
                  activeSubGroup={activeTab === 'audit-logs' ? 'audit' : 'settings'}
                />
              )}

            </div>
          ) : (
            <div className="text-center py-20 text-slate-500 font-semibold">Failed to reconcile system aggregates. Verify DB connections.</div>
          )}

        </main>

      </div>
    </div>
  );
}
