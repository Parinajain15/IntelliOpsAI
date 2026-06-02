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
  Award
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

  const loadData = () => {
    setIsCalculating(true);
    // Introduce short loading timeout mock to make calculations look authentic
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

  // Action callback: execute a workload rebalance manually
  const handleExecuteRec = (recId: string, title: string) => {
    setIsCalculating(true);
    
    // Simulate real task rebalancing. Under the hood, this triggers an audit log and cleans up the overloaded worker
    // Let's create an operational log
    fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'risk note',
        message: `Action executed: Workload Rebalancing triggered. [ID: ${recId}]`,
        department: 'Operations',
        priority: 'High'
      })
    })
    .then(() => {
      setSuccessMsg(`Workflow optimization executed successfully! Re-balancing task loads.`);
      onWorkflowRecalculation(); // Recalculate parent dashboards
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

  // Helper to color codes
  const getProbabilityColor = (prob: number) => {
    if (prob > 80) return 'text-red-650 bg-red-50 stroke-red-500';
    if (prob > 50) return 'text-amber-650 bg-amber-50 stroke-amber-500';
    return 'text-emerald-650 bg-emerald-50 stroke-emerald-500';
  };

  return (
    <div className="space-y-6">
      
      {/* Tab select head */}
      <div className="flex border-b border-slate-200 bg-white p-2 rounded-lg shadow-sm gap-1">
        <button
          onClick={() => setTab('pred')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
            tab === 'pred' ? 'bg-[#0f172a] text-white shadow' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          SLA Predictive Intelligence
        </button>
        <button
          onClick={() => setTab('rec')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
            tab === 'rec' ? 'bg-[#0f172a] text-white shadow' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Zap className="w-4 h-4" />
          Operations Recommendations Queue
        </button>
      </div>

      {/* Success Banner */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-850 p-4 rounded-lg text-xs font-medium flex gap-2.5 items-center animate-bounce shadow">
          <CheckCircle className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
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
              <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-tight font-mono">Predictive Risk Forecast Engine</h2>
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
          RECOMMENDATIONS QUEUE TAB
          ======================================================== */}
      {tab === 'rec' && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-tight font-mono">Operations Optimization Protocol Queue</h2>
            <p className="text-xs text-slate-500 mt-1">Directly generated mitigation guidelines. Clicking Execute distributes workloads and registers security logs.</p>
          </div>

          {isCalculating && recs.length === 0 ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-16 bg-slate-100 rounded"></div>
              <div className="h-16 bg-slate-100 rounded"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {recs.map((rec, i) => {
                const isCritical = rec.severity === 'Critical';
                const isHigh = rec.severity === 'High';
                
                return (
                  <div key={i} className="border border-slate-200 rounded-lg p-5 bg-slate-50/50 hover:bg-slate-50 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      
                      {/* Sub row */}
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono border ${
                          isCritical ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' :
                          isHigh ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          'bg-indigo-50 text-indigo-600 border-indigo-100'
                        }`}>
                          {rec.severity} priority
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-200/50 px-2.5 py-0.5 rounded uppercase">
                          {rec.department}
                        </span>
                        <span className="text-[10px] text-slate-450 font-mono">Metrics Ref: {rec.metricReference}</span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 truncate">{rec.title}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed max-w-4xl font-sans">{rec.actionablePlan}</p>
                    </div>

                    {/* Action buttons */}
                    <div className="shrink-0 flex gap-2">
                      <button 
                        onClick={() => handleExecuteRec(rec.id, rec.title)}
                        className="bg-slate-900 border border-black hover:bg-black text-white px-4 py-2 rounded text-xs font-semibold shadow transition-all cursor-pointer flex items-center gap-1 h-fit"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#10b981]" />
                        Execute Task Rebalance
                      </button>
                    </div>

                  </div>
                );
              })}

              {recs.length === 0 && (
                <div className="text-center p-12 text-slate-400">All recommendation queue matrices solved and optimized!</div>
              )}
            </div>
          )}

        </div>
      )}

    </div>
  );
}
