/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Zap, 
  ArrowRight, 
  Activity, 
  CheckCircle, 
  Play, 
  Percent, 
  Timer,
  AlertTriangle,
  RotateCw,
  Sparkles,
  Award,
  User,
  Filter,
  Shield,
  Check,
  Flame,
  ShieldAlert,
  Gauge,
  Users
} from 'lucide-react';
import { PredictionResult, Recommendation } from '../types.js';

interface PredictionsRecommendationsTabProps {
  onWorkflowRecalculation: () => void;
  activeGroup?: 'predictions' | 'recommendations';
}

export default function PredictionsRecommendationsTab({ 
  onWorkflowRecalculation, 
  activeGroup = 'predictions' 
}: PredictionsRecommendationsTabProps) {
  const [tab, setTab] = useState<'pred' | 'rec'>(activeGroup === 'predictions' ? 'pred' : 'rec');
  const [preds, setPreds] = useState<PredictionResult[]>([]);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Controls & Filters for Mitigation Engine
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  const loadData = () => {
    setIsCalculating(true);
    Promise.all([
      fetch('/api/predictions').then(r=>r.json()),
      fetch('/api/recommendations').then(r=>r.json())
    ]).then(([predData, recData]) => {
      setPreds(predData);
      setRecs(recData);
      setIsCalculating(false);
    }).catch(err => {
      console.error(err);
      setIsCalculating(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  // Action status transition callback
  const handleUpdateStatus = (recId: string, title: string, nextStatus: 'Pending' | 'In Progress' | 'Completed') => {
    setIsCalculating(true);
    
    fetch(`/api/recommendations/${recId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus })
    })
    .then(r => {
      if (!r.ok) throw new Error('Status update failed');
      return r.json();
    })
    .then(() => {
      let customMsg = `Mitigation status updated to ${nextStatus}: "${title}"`;
      if (nextStatus === 'Completed') {
        customMsg = `Mitigation plan executed! Workloads stabilized, changes saved to operational database registers.`;
      }
      setSuccessMsg(customMsg);
      onWorkflowRecalculation(); // Recalculate parent dashboard metrics
      
      setTimeout(() => {
        setSuccessMsg(null);
        loadData();
      }, 2500);
    })
    .catch(err => {
      console.error(err);
      setIsCalculating(false);
    });
  };

  const getProbabilityColor = (prob: number) => {
    if (prob > 80) return 'text-red-650 bg-red-50 stroke-red-500';
    if (prob > 50) return 'text-amber-650 bg-amber-50 stroke-amber-500';
    return 'text-emerald-650 bg-emerald-50 stroke-emerald-500';
  };

  // Filter recommendations based on active tabs/dropdown select
  const filteredRecs = recs.filter(rec => {
    const matchesCategory = selectedCategory === 'all' || rec.category === selectedCategory;
    const matchesPriority = selectedPriority === 'all' || rec.severity === selectedPriority;
    return matchesCategory && matchesPriority;
  });

  // KPI Calculations
  const pendingCount = recs.filter(r => r.status === 'Pending').length;
  const inProgressCount = recs.filter(r => r.status === 'In Progress').length;
  const completedCount = recs.filter(r => r.status === 'Completed').length;
  const criticalCount = recs.filter(r => r.severity === 'Critical' && r.status !== 'Completed').length;

  return (
    <div className="space-y-6">
      
      {/* Tab select head */}
      <div className="flex border-b border-slate-200 bg-[#0f172a] p-2 rounded-lg shadow-sm gap-1">
        <button
          onClick={() => setTab('pred')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
            tab === 'pred' ? 'bg-[#10b981] text-[#0f172a] shadow font-bold' : 'text-slate-300 hover:text-white hover:bg-[#1e294b]'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          SLA Predictive Risk Index
        </button>
        <button
          onClick={() => setTab('rec')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
            tab === 'rec' ? 'bg-[#10b981] text-[#0f172a] shadow font-bold' : 'text-slate-300 hover:text-white hover:bg-[#1e294b]'
          }`}
        >
          <Zap className="w-4 h-4" />
          Mitigation Engine Board
        </button>
      </div>

      {/* Success Banner */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-850 p-4 rounded-lg text-xs font-medium flex gap-2.5 items-center animate-pulse shadow">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 animate-bounce" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ========================================================
          SLA FORECAST TAB 
          ======================================================== */}
      {tab === 'pred' && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-tight font-mono">Predictive SLA Risk Forecast Engine</h2>
              <p className="text-xs text-slate-500 mt-1">Continuous Bayesian metrics modeling mapping active backlog pressure against resource capacities.</p>
            </div>
            
            <button
              disabled={isCalculating}
              onClick={loadData}
              className="bg-slate-50 hover:bg-slate-100 text-slate-750 text-xs font-bold border border-slate-200 py-1.5 px-3 rounded transition-all cursor-pointer flex items-center gap-1 leading-none shadow-sm"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isCalculating ? 'animate-spin' : ''}`} />
              Run Prediction Recalc
            </button>
          </div>

          {isCalculating && preds.length === 0 ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-20 bg-slate-100 rounded"></div>
              <div className="h-20 bg-slate-100 rounded"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {preds.map((pred, i) => {
                const isHigh = pred.probability > 75;
                const isMed = pred.probability >= 50 && pred.probability <= 75;
                return (
                  <div key={i} className="border border-slate-200 hover:border-slate-300 rounded-lg p-5 bg-slate-50/50 flex flex-col justify-between hover:shadow-md transition-all">
                    <div className="space-y-3">
                      
                      {/* Metric Category row */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] bg-slate-200/50 text-slate-600 font-bold px-2 py-0.5 rounded font-mono uppercase">
                          {pred.targetType}
                        </span>
                        <span className="text-[10px] text-slate-450 font-mono flex items-center gap-1">
                          <Timer className="w-3 h-3" />
                          EXPIRY: {pred.timeframe}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 leading-tight">Target Node: {pred.targetName}</h3>
                      <p className="text-xs text-slate-650 leading-relaxed font-sans">{pred.keyFactor}</p>
                    </div>

                    {/* Progress score bar */}
                    <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-semibold text-slate-500">Bayesian Probability:</span>
                        <span className={`font-bold ${isHigh ? 'text-red-650' : isMed ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {pred.probability}% CAP
                        </span>
                      </div>

                      {/* Color customized indicators */}
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className={`h-2.5 rounded-full transition-all duration-300 ${
                            isHigh ? 'bg-red-500' : isMed ? 'bg-amber-500' : 'bg-emerald-500'
                          }`} 
                          style={{ width: `${pred.probability}%` }}
                        ></div>
                      </div>

                      <div className="p-2.5 rounded bg-white border border-slate-150 mt-3 font-mono text-[9px] text-slate-450 leading-snug">
                        <span className="font-bold text-slate-600">ENGINE EXPLANATION:</span> {pred.calculationExplanation}
                      </div>
                    </div>

                  </div>
                );
              })}

              {preds.length === 0 && (
                <div className="col-span-2 text-center p-12 text-slate-400">All systems operational. Backlog parameters well within bounds.</div>
              )}
            </div>
          )}

        </div>
      )}

      {/* ========================================================
          MITIGATION ENGINE TAB
          ======================================================== */}
      {tab === 'rec' && (
        <div className="space-y-6">
          
          {/* Summary Executive Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1e294b]/10 flex items-center justify-center text-slate-700">
                <Shield className="w-5 h-5 text-[#10b981]" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-450 uppercase tracking-wider font-mono">Pending Mitigations</p>
                <p className="text-xl font-black text-slate-800 leading-tight">{pendingCount}</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1e294b]/10 flex items-center justify-center text-slate-700">
                <RotateCw className="w-5 h-5 text-amber-500 animate-spin" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-450 uppercase tracking-wider font-mono">In Progress</p>
                <p className="text-xl font-black text-slate-800 leading-tight">{inProgressCount}</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-450 uppercase tracking-wider font-mono">Completed Mitigations</p>
                <p className="text-xl font-black text-[#10b981] leading-tight">{completedCount}</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-450 uppercase tracking-wider font-mono">Active Critical Risks</p>
                <p className="text-xl font-black text-red-650 leading-tight">{criticalCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-6">
            
            {/* Header controls */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-tight font-mono flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] inline-block animate-ping"></span>
                  Mitigation Action Control Queue
                </h2>
                <p className="text-xs text-slate-500 mt-1">Convert real-time active department risks and SLA failures into concrete action items, rank by urgency, and audit status.</p>
              </div>

              {/* Filtering Block */}
              <div className="flex flex-wrap items-center gap-3">
                
                {/* Category Dropdown */}
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-[#10b981]"
                  >
                    <option value="all">All Action Categories</option>
                    <option value="Reassign overloaded employee tasks">Reassign overloaded employee tasks</option>
                    <option value="Resolve SLA breach incidents">Resolve SLA breach incidents</option>
                    <option value="Reduce delivery delay risk">Reduce delivery delay risk</option>
                    <option value="Stabilize department workload">Stabilize department workload</option>
                  </select>
                </div>

                {/* Priority Dropdown */}
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-[#10b981]"
                >
                  <option value="all">All Priorities</option>
                  <option value="Critical">Critical Only</option>
                  <option value="High">High Only</option>
                  <option value="Moderate">Moderate Only</option>
                  <option value="Low">Low Only</option>
                </select>

                <button
                  disabled={isCalculating}
                  onClick={loadData}
                  className="bg-slate-900 hover:bg-black text-white text-xs font-bold py-1.5 px-3 rounded shadow transition-all cursor-pointer flex items-center gap-1 leading-none h-full"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isCalculating ? 'animate-spin' : ''}`} />
                  Sync Queue
                </button>
              </div>
            </div>

            {/* Recommendations Action List */}
            {isCalculating && recs.length === 0 ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-24 bg-slate-100 rounded"></div>
                <div className="h-24 bg-slate-100 rounded"></div>
                <div className="h-24 bg-slate-100 rounded"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRecs.map((rec, i) => {
                  const isCritical = rec.severity === 'Critical';
                  const isHigh = rec.severity === 'High';
                  const isCompleted = rec.status === 'Completed';
                  const isInProgress = rec.status === 'In Progress';
                  
                  // Category Styling badges
                  let categoryColor = "bg-indigo-50 border-indigo-150 text-indigo-750";
                  if (rec.category === "Reassign overloaded employee tasks") {
                    categoryColor = "bg-rose-50 border-rose-150 text-rose-700";
                  } else if (rec.category === "Resolve SLA breach incidents") {
                    categoryColor = "bg-amber-50 border-amber-150 text-amber-700";
                  } else if (rec.category === "Reduce delivery delay risk") {
                    categoryColor = "bg-sky-50 border-sky-150 text-sky-700";
                  } else if (rec.category === "Stabilize department workload") {
                    categoryColor = "bg-emerald-50 border-emerald-150 text-emerald-700";
                  }

                  return (
                    <div 
                      key={rec.id} 
                      className={`border rounded-lg p-5 transition-all relative ${
                        isCompleted ? 'border-emerald-250 bg-emerald-50/10 opacity-75' : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-350 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6">
                        
                        {/* Action Content Details */}
                        <div className="space-y-3.5 flex-1 min-w-0">
                          
                          {/* Top Metadata Row */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono border ${
                              isCritical ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' :
                              isHigh ? 'bg-amber-50 text-amber-600 border-amber-100' :
                              'bg-indigo-50 text-indigo-650 border-indigo-150'
                            }`}>
                              {rec.severity} priority
                            </span>
                            
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${categoryColor}`}>
                              {rec.category || "General Optimization"}
                            </span>

                            <span className="text-[10px] font-mono text-slate-400 bg-slate-200/50 px-2 py-0.5 rounded uppercase">
                              {rec.department}
                            </span>
                          </div>

                          {/* Primary Fields Display */}
                          <div className="space-y-1">
                            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                              {rec.title}
                              {isCompleted && <CheckCircle className="w-4 h-4 text-[#10b981] inline-block" />}
                            </h3>
                            <p className="text-xs text-slate-650 leading-relaxed max-w-4xl font-sans">
                              {rec.actionablePlan}
                            </p>
                          </div>

                          {/* Requirement 3 Checklist Fields */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white border border-slate-150 p-3 rounded-md shadow-inner text-xs font-mono">
                            
                            {/* OWNER */}
                            <div className="space-y-0.5 border-r border-slate-100 pr-2">
                              <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider block">Assigned Owner</span>
                              <div className="flex items-center gap-1.5 text-slate-700">
                                <User className="w-3.5 h-3.5 text-slate-400" />
                                <span className="font-semibold truncate">{rec.owner || "Operations Team"}</span>
                              </div>
                            </div>

                            {/* RISK SOURCE */}
                            <div className="space-y-0.5 border-r border-slate-100 pr-2">
                              <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider block">Risk Source</span>
                              <div className="text-red-650 flex items-center gap-1 truncate font-semibold">
                                <Flame className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                <span className="truncate">{rec.riskSource || "Nominal Parameters"}</span>
                              </div>
                            </div>

                            {/* RECOMMENDED ACTION */}
                            <div className="space-y-0.5 border-r border-slate-100 pr-2 col-span-1 sm:col-span-1 lg:col-span-1">
                              <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider block">Impact Action</span>
                              <div className="text-slate-650 truncate italic">
                                {rec.recommendedAction || "Re-stabilize queues"}
                              </div>
                            </div>

                            {/* EXPECTED IMPACT % */}
                            <div className="space-y-1">
                              <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider flex items-center justify-between">
                                <span>Expected Impact</span>
                                <span className="text-emerald-600 font-bold">+{rec.expectedImpactPercent || 40}% Eff</span>
                              </span>
                              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className="h-1.5 rounded-full bg-[#10b981]" 
                                  style={{ width: `${rec.expectedImpactPercent || 40}%` }}
                                ></div>
                              </div>
                            </div>

                          </div>

                        </div>

                        {/* Interactive Status Transition Dropdowns/Buttons */}
                        <div className="shrink-0 flex sm:flex-row xl:flex-col items-center gap-2 xl:self-center">
                          
                          {/* Transition State Button Options */}
                          <div className="flex items-center border border-slate-200 rounded overflow-hidden shadow-sm text-xs select-none">
                            <button
                              disabled={isCalculating || isCompleted}
                              onClick={() => handleUpdateStatus(rec.id, rec.title, 'Pending')}
                              className={`px-2.5 py-1.5 font-bold transition-all ${
                                rec.status === 'Pending' 
                                  ? 'bg-slate-350 text-slate-700' 
                                  : 'bg-white text-slate-500 hover:bg-slate-50 border-r border-slate-150'
                              }`}
                            >
                              Pending
                            </button>
                            <button
                              disabled={isCalculating || isCompleted}
                              onClick={() => handleUpdateStatus(rec.id, rec.title, 'In Progress')}
                              className={`px-2.5 py-1.5 font-bold transition-all ${
                                isInProgress 
                                  ? 'bg-amber-500 text-white font-black' 
                                  : 'bg-white text-slate-500 hover:bg-slate-50 border-r border-slate-150'
                              }`}
                            >
                              In Progress
                            </button>
                            <button
                              disabled={isCalculating || isCompleted}
                              onClick={() => handleUpdateStatus(rec.id, rec.title, 'Completed')}
                              className={`px-2.5 py-1.5 font-bold transition-all flex items-center gap-1 ${
                                isCompleted 
                                  ? 'bg-[#10b981] text-[#0f172a] font-black' 
                                  : 'bg-white text-slate-500 hover:bg-slate-50'
                              }`}
                            >
                              {isCompleted && <Check className="w-3.5 h-3.5 text-[#0f172a]" />}
                              Complete
                            </button>
                          </div>

                        </div>

                      </div>
                    </div>
                  );
                })}

                {filteredRecs.length === 0 && (
                  <div className="text-center p-12 text-slate-400 bg-slate-50 border border-slate-200 rounded">
                    No active mitigation actions matched the selected filters. All indices are optimized.
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
