/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Database, 
  Network, 
  RefreshCw, 
  Plus, 
  CheckCircle, 
  XOctagon, 
  Check, 
  HelpCircle,
  AlertTriangle,
  Play,
  RotateCcw,
  PlusSquare,
  Lock
} from 'lucide-react';
import { SapConnector, DataSource, ApiIntegration } from '../types.js';

interface IntegrationsTabsProps {
  onActivityLog: () => void;
  activeSubSection?: 'sap' | 'db' | 'api';
}

export default function IntegrationsTabs({ onActivityLog, activeSubSection = 'sap' }: IntegrationsTabsProps) {
  const [subTab, setSubTab] = useState<'sap' | 'db' | 'api'>(activeSubSection);

  // Lists state
  const [saps, setSaps] = useState<SapConnector[]>([]);
  const [dbs, setDbs] = useState<DataSource[]>([]);
  const [apis, setApis] = useState<ApiIntegration[]>([]);

  // Registration loading / syncing state per item
  const [syncingId, setSyncingId] = useState<string | null>(null);

  // Forms state
  const [showSapForm, setShowSapForm] = useState(false);
  const [sapName, setSapName] = useState('');
  const [sapEndpoint, setSapEndpoint] = useState('');
  const [sapAuth, setSapAuth] = useState('OAuth2');
  const [sapModule, setSapModule] = useState('SAP MM');

  const [showDbForm, setShowDbForm] = useState(false);
  const [dbName, setDbName] = useState('');
  const [dbServer, setDbServer] = useState('');
  const [dbDatabase, setDbDatabase] = useState('');
  const [dbUser, setDbUser] = useState('');

  const [showApiForm, setShowApiForm] = useState(false);
  const [apiName, setApiName] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [apiFreq, setApiFreq] = useState('Hourly');

  const loadAllIntegrations = () => {
    fetch('/api/connectors/sap').then(r => r.json()).then(data => setSaps(data));
    fetch('/api/connectors/db').then(r => r.json()).then(data => setDbs(data));
    fetch('/api/connectors/api').then(r => r.json()).then(data => setApis(data));
  };

  useEffect(() => {
    loadAllIntegrations();
  }, []);

  // SAP Action Handshake test
  const handleTestSap = (id: string) => {
    setSyncingId(id);
    fetch(`/api/connectors/sap/${id}/test`, { method: 'POST' })
      .then(res => res.json())
      .then(() => {
        setTimeout(() => {
          setSyncingId(null);
          loadAllIntegrations();
          onActivityLog();
        }, 1500); // realistic mock networking lag
      })
      .catch(err => {
        console.error(err);
        setSyncingId(null);
      });
  };

  // Database Action test
  const handleTestDb = (id: string) => {
    setSyncingId(id);
    fetch(`/api/connectors/db/${id}/test`, { method: 'POST' })
      .then(res => res.json())
      .then(() => {
        setTimeout(() => {
          setSyncingId(null);
          loadAllIntegrations();
          onActivityLog();
        }, 800);
      })
      .catch(err => {
        console.error(err);
        setSyncingId(null);
      });
  };

  // API Inactive/Active Toggle switch
  const handleToggleApi = (id: string) => {
    fetch(`/api/connectors/api/${id}/toggle`, { method: 'POST' })
      .then(res => res.json())
      .then(() => {
        loadAllIntegrations();
        onActivityLog();
      })
      .catch(err => console.error(err));
  };

  // Submit forms
  const handleCreateSap = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sapName || !sapEndpoint) return;

    fetch('/api/connectors/sap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: sapName, endpoint: sapEndpoint, authentication: sapAuth, module: sapModule })
    })
      .then(r => r.json())
      .then(() => {
        setShowSapForm(false);
        setSapName('');
        setSapEndpoint('');
        loadAllIntegrations();
        onActivityLog();
      });
  };

  const handleCreateDb = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbName || !dbServer || !dbDatabase) return;

    fetch('/api/connectors/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: dbName, server: dbServer, database: dbDatabase, username: dbUser })
    })
      .then(r => r.json())
      .then(() => {
        setShowDbForm(false);
        setDbName('');
        setDbServer('');
        setDbDatabase('');
        setDbUser('');
        loadAllIntegrations();
        onActivityLog();
      });
  };

  const handleCreateApi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiName || !apiUrl) return;

    fetch('/api/connectors/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: apiName, url: apiUrl, frequency: apiFreq })
    })
      .then(r => r.json())
      .then(() => {
        setShowApiForm(false);
        setApiName('');
        setApiUrl('');
        loadAllIntegrations();
        onActivityLog();
      });
  };

  return (
    <div className="space-y-6">
      
      {/* Selection Sub-tabs */}
      <div className="flex border-b border-slate-200 bg-white p-2 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.02)] gap-1">
        <button
          onClick={() => setSubTab('sap')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
            subTab === 'sap' ? 'bg-[#0f172a] text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Cpu className="w-4 h-4" />
          SAP ERP Connectors
        </button>
        <button
          onClick={() => setSubTab('db')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
            subTab === 'db' ? 'bg-[#0f172a] text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Database className="w-4 h-4" />
          Database Connections
        </button>
        <button
          onClick={() => setSubTab('api')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
            subTab === 'api' ? 'bg-[#0f172a] text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Network className="w-4 h-4" />
          REST API Outlets
        </button>
      </div>

      {/* =======================================================
          SAP CONNECTORS MODULE PANELS 
          ======================================================= */}
      {subTab === 'sap' && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-tight font-mono">SAP System Interface Modules</h2>
              <p className="text-xs text-slate-500 mt-1">Manage direct RFC / SOAP / REST connections sitting inside your SAP NetWeaver and SuccessFactors landscapes.</p>
            </div>
            <button
              onClick={() => setShowSapForm(!showSapForm)}
              className="bg-slate-900 hover:bg-black text-white text-xs font-semibold px-3 py-1.5 rounded transition-all shadow-sm flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Register Module Interface
            </button>
          </div>

          {showSapForm && (
            <form onSubmit={handleCreateSap} className="p-4 rounded-lg bg-slate-50 border border-slate-150 text-xs space-y-4 max-w-xl">
              <h3 className="font-semibold text-slate-800">New SAP ERP Handshake Configuration</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-600 block">System Interface Name</label>
                  <input required placeholder="e.g. Frankfurt Sales Sync" type="text" value={sapName} onChange={e=>setSapName(e.target.value)} className="w-full border border-slate-200 p-2 rounded focus:outline-none focus:border-indigo-500 bg-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-600 block">SAP Target Module</label>
                  <select value={sapModule} onChange={e=>setSapModule(e.target.value)} className="w-full border border-slate-200 p-2 rounded focus:outline-none bg-white cursor-pointer">
                    <option value="SAP PP">SAP PP (Production Planning)</option>
                    <option value="SAP MM">SAP MM (Materials Management)</option>
                    <option value="SAP SD">SAP SD (Sales & Distribution)</option>
                    <option value="SAP HCM">SAP HCM (Human Capital)</option>
                    <option value="SAP SuccessFactors">SAP SuccessFactors (HR Cloud)</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1 text-xs">
                <label className="text-slate-600 block text-xs">Destination Host Endpoint</label>
                <input required placeholder="https://sap-gateway.internal-corp.net:8443/rfc/sync" type="text" value={sapEndpoint} onChange={e=>setSapEndpoint(e.target.value)} className="w-full border border-slate-200 p-2 rounded focus:outline-none focus:border-indigo-500 bg-white font-mono text-[11px]" />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="bg-[#10b981] hover:bg-emerald-600 text-white font-bold px-4 py-2 rounded transition-all cursor-pointer">Register Interface Router</button>
                <button type="button" onClick={()=>setShowSapForm(false)} className="text-slate-400 hover:text-slate-600">Cancel</button>
              </div>
            </form>
          )}

          {/* Grid list of SAP items */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-mono text-[10px] text-slate-450 uppercase">
                  <th className="py-2.5 px-4">Connector System</th>
                  <th className="py-2.5 px-4 font-semibold">Endpoint</th>
                  <th className="py-2.5 px-4">SAP Module</th>
                  <th className="py-2.5 px-4">Security Auth</th>
                  <th className="py-2.5 px-4">Sync state</th>
                  <th className="py-2.5 px-4 text-center">Status Handshake</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-650">
                {saps.map((sap, i) => {
                  const isSyncing = syncingId === sap.id;
                  return (
                    <tr key={i} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">{sap.name}</td>
                      <td className="py-3 px-4 font-mono text-[#01416e]">{sap.endpoint}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono text-[10px]">
                          {sap.module}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono">{sap.authentication}</td>
                      <td className="py-3 px-4">
                        {isSyncing ? (
                          <span className="text-blue-500 font-bold flex items-center gap-1">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            TEST_RFC_SYNC...
                          </span>
                        ) : sap.status === 'Connected' ? (
                          <span className="text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            SYS_ONLINE
                          </span>
                        ) : sap.status === 'Error' ? (
                          <span className="text-red-500 font-bold flex items-center gap-1">
                            <XOctagon className="w-3.5 h-3.5 animate-pulse" />
                            GATEWAY_AUTH_FAIL
                          </span>
                        ) : (
                          <span className="text-slate-400 font-bold flex items-center gap-1">
                            DISCONNECTED
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          disabled={isSyncing}
                          onClick={() => handleTestSap(sap.id)}
                          className="bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-indigo-500 text-[10px] font-bold py-1 px-3 rounded transition-all cursor-pointer"
                        >
                          Test Authentication Sync
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =======================================================
          DATABASE CONNECTION MODULE PANELS
          ======================================================= */}
      {subTab === 'db' && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-tight font-mono">Operations Database Connection Hub</h2>
              <p className="text-xs text-slate-500 mt-1">Replicate transactional tables from external company standard SQL clusters (MS SQL, Oracle, Postgres) as streaming datasets.</p>
            </div>
            <button
              onClick={() => setShowDbForm(!showDbForm)}
              className="bg-slate-900 hover:bg-black text-white text-xs font-semibold px-3 py-1.5 rounded transition-all shadow-sm flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Connect SQL Database
            </button>
          </div>

          {showDbForm && (
            <form onSubmit={handleCreateDb} className="p-4 rounded-lg bg-slate-50 border border-slate-150 text-xs space-y-4 max-w-xl">
              <h3 className="font-semibold text-slate-800">Register Relational Transaction Store</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-600 block">System Connection Identifier</label>
                  <input required placeholder="e.g. EU Warehouse Replica" type="text" value={dbName} onChange={e=>setDbName(e.target.value)} className="w-full border border-slate-200 p-2 rounded focus:outline-none focus:border-indigo-500 bg-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-600 block">Database Server Host IP</label>
                  <input required placeholder="10.84.120.25" type="text" value={dbServer} onChange={e=>setDbServer(e.target.value)} className="w-full border border-slate-200 p-2 rounded focus:outline-none focus:border-indigo-500 bg-white font-mono" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-600 block">Initial Database Name</label>
                  <input required placeholder="warehouse_incidents_db" type="text" value={dbDatabase} onChange={e=>setDbDatabase(e.target.value)} className="w-full border border-slate-200 p-2 rounded focus:outline-none focus:border-indigo-500 bg-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-600 block">SQL Login Username</label>
                  <input required placeholder="db_read_sync" type="text" value={dbUser} onChange={e=>setDbUser(e.target.value)} className="w-full border border-slate-200 p-2 rounded focus:outline-none focus:border-indigo-500 bg-white" />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="bg-[#10b981] hover:bg-emerald-600 text-white font-bold px-4 py-2 rounded transition-all cursor-pointer">Register SQL Dataset</button>
                <button type="button" onClick={()=>setShowDbForm(false)} className="text-slate-400 hover:text-slate-600">Cancel</button>
              </div>
            </form>
          )}

          {/* Grid list of SQL Db items */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-mono text-[10px] text-slate-450 uppercase">
                  <th className="py-2.5 px-4 font-semibold">Datastore Name</th>
                  <th className="py-2.5 px-4">Server Node IP</th>
                  <th className="py-2.5 px-4 font-semibold">Database Schema</th>
                  <th className="py-2.5 px-4 text-center">Sync Schedule</th>
                  <th className="py-2.5 px-4 text-center">Status Index</th>
                  <th className="py-2.5 px-4 text-center">Handshake Credentials</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-650">
                {dbs.map((dbNode, i) => {
                  const isSyncing = syncingId === dbNode.id;
                  return (
                    <tr key={i} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">{dbNode.name}</td>
                      <td className="py-2 px-4 font-mono text-[#01416e]">{dbNode.server}</td>
                      <td className="py-2 px-4 font-mono">{dbNode.database}</td>
                      <td className="py-2 px-4 text-center font-semibold text-indigo-600">{dbNode.syncSchedule}</td>
                      <td className="py-2 px-4 text-center">
                        {isSyncing ? (
                          <span className="text-blue-500 font-bold flex items-center justify-center gap-1.5 animate-pulse">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            TEST_SQL_PING
                          </span>
                        ) : dbNode.status === 'Connected' ? (
                          <span className="text-emerald-600 font-bold flex items-center justify-center gap-1">
                            <Check className="w-4 h-4" />
                            AUTH_SUCCESS
                          </span>
                        ) : (
                          <span className="text-slate-450 font-bold">UNTESTED</span>
                        )}
                      </td>
                      <td className="py-2 px-4 text-center">
                        <button
                          disabled={isSyncing}
                          onClick={() => handleTestDb(dbNode.id)}
                          className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] font-semibold py-1 px-3.5 rounded transition-colors cursor-pointer"
                        >
                          Ping Credential Host
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =======================================================
          REST API OUTLETS MODULE PANELS
          ======================================================= */}
      {subTab === 'api' && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-tight font-mono">Outbound REST Gateway Outlets</h2>
              <p className="text-xs text-slate-500 mt-1">Bind external corporate platforms (Jira API, Salesforce Webhooks, Workday) into the IntelliOps intelligence pipeline.</p>
            </div>
            <button
              onClick={() => setShowApiForm(!showApiForm)}
              className="bg-slate-900 hover:bg-black text-white text-xs font-semibold px-3 py-1.5 rounded transition-all shadow-sm flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Register REST Outlet
            </button>
          </div>

          {showApiForm && (
            <form onSubmit={handleCreateApi} className="p-4 rounded-lg bg-slate-50 border border-slate-150 text-xs space-y-4 max-w-xl">
              <h3 className="font-semibold text-slate-800">Register Outbound API Synchronization Target</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-600 block">Platform Endpoint Name</label>
                  <input required placeholder="e.g. Jira Incidents Stream" type="text" value={apiName} onChange={e=>setApiName(e.target.value)} className="w-full border border-slate-200 p-2 rounded focus:outline-none focus:border-indigo-500 bg-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-600 block">Fetch Frequency</label>
                  <select value={apiFreq} onChange={e=>setApiFreq(e.target.value)} className="w-full border border-slate-200 p-2 rounded focus:outline-none bg-white cursor-pointer">
                    <option value="Realtime">Realtime (Streaming)</option>
                    <option value="Hourly">Hourly Sweep</option>
                    <option value="Daily">Daily Sync</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-slate-600 block">REST Target URL</label>
                <input required placeholder="https://api.atlassian.corp/v3/projects/ops/issues" type="text" value={apiUrl} onChange={e=>setApiUrl(e.target.value)} className="w-full border border-slate-200 p-2 rounded focus:outline-none focus:border-indigo-500 bg-white font-mono text-[11px]" />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="bg-[#10b981] hover:bg-emerald-600 text-white font-bold px-4 py-2 rounded transition-all cursor-pointer">Inscribe Target Gateway</button>
                <button type="button" onClick={()=>setShowApiForm(false)} className="text-slate-400 hover:text-slate-600">Cancel</button>
              </div>
            </form>
          )}

          {/* Grid list of REST API items */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-205 font-mono text-[10px] text-slate-450 uppercase">
                  <th className="py-2.5 px-4 font-semibold">Integrator Gateway</th>
                  <th className="py-2.5 px-4">REST URL Endpoint</th>
                  <th className="py-2.5 px-4 text-center">Frequency</th>
                  <th className="py-2.5 px-4 text-center">Encryption Client Token</th>
                  <th className="py-2.5 px-4 text-center">Active Target Toggle</th>
                  <th className="py-2.5 px-4 text-center">Last Synchronized</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-650">
                {apis.map((api, i) => {
                  return (
                    <tr key={i} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">{api.name}</td>
                      <td className="py-2 px-4 font-mono text-indigo-600">{api.url}</td>
                      <td className="py-2 px-4 text-center font-mono font-medium">{api.frequency}</td>
                      <td className="py-2 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-[10px] bg-slate-100 px-2 py-0.5 rounded font-mono text-slate-650">
                          <Lock className="w-3 h-3 text-[#10b981]" />
                          SECURED_AES_256
                        </span>
                      </td>
                      <td className="py-2 px-4 text-center">
                        <button
                          onClick={() => handleToggleApi(api.id)}
                          className={`inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded font-bold transition-all cursor-pointer border ${
                            api.status === 'Active' 
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' 
                              : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          ● {api.status === 'Active' ? 'ACTIVE_ROUTING' : 'SUSPENDED'}
                        </button>
                      </td>
                      <td className="py-2 px-4 text-center font-mono text-slate-450">
                        {new Date(api.lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
