/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  RotateCw, 
  TrendingUp, 
  AlertOctagon, 
  Cpu, 
  Compass, 
  CornerDownRight, 
  FileText, 
  CheckCircle,
  HelpCircle,
  ShieldCheck,
  Zap,
  Activity
} from 'lucide-react';
import { AiInsightLog } from '../types.js';

interface AIInsightsTabProps {
  onBriefingGenerated: (text: string) => void;
  aiBriefingLoading: boolean;
  setAiBriefingLoading: (b: boolean) => void;
}

export default function AIInsightsTab({ onBriefingGenerated, aiBriefingLoading, setAiBriefingLoading }: AIInsightsTabProps) {
  const [briefings, setBriefings] = useState<AiInsightLog[]>([]);
  const [selectedBriefing, setSelectedBriefing] = useState<AiInsightLog | null>(null);
  
  // Custom compiler progress checks for AI briefing
  const [compilerStep, setCompilerStep] = useState(0);
  const compilerMessages = [
    'Gathering real-time enterprise metrics & capacity metrics...',
    'Evaluating current SLA breach percentages & queues latency...',
    'Contacting server-side Google GenAI LLM models gateway...',
    'Synthesizing C-Suite executive briefing summaries & priority plan...'
  ];

  const loadBriefingsHistory = () => {
    fetch('/api/ai-insights')
      .then(res => res.json())
      .then(data => {
        setBriefings(data);
        if (data.length > 0 && !selectedBriefing) {
          setSelectedBriefing(data[0]);
          onBriefingGenerated(data[0].executiveSummary); // populate preview on dashboard
        }
      })
      .catch(err => console.error('Failed to load past briefings:', err));
  };

  useEffect(() => {
    loadBriefingsHistory();
  }, []);

  const handleGenerateBriefing = () => {
    setAiBriefingLoading(true);
    setCompilerStep(0);
    
    // Animate compiler steps
    const stepInterval = setInterval(() => {
      setCompilerStep(prev => {
        if (prev < 3) return prev + 1;
        clearInterval(stepInterval);
        return prev;
      });
    }, 700);

    // Call server endpoint
    fetch('/api/ai/generate-briefing', { method: 'POST' })
      .then(res => res.json())
      .then(newBriefing => {
        clearInterval(stepInterval);
        setAiBriefingLoading(false);
        setCompilerStep(0);
        loadBriefingsHistory();
        setSelectedBriefing(newBriefing);
        onBriefingGenerated(newBriefing.executiveSummary);
      })
      .catch(err => {
        console.error(err);
        clearInterval(stepInterval);
        setAiBriefingLoading(false);
        setCompilerStep(0);
      });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Left Column: List of historical briefings briefings */}
      <div className="lg:col-span-4 bg-white border border-slate-200 rounded-lg p-5 shadow-sm h-fit">
        <div className="border-b border-slate-150 pb-3 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase font-mono">Briefing Timeline</h3>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded font-bold">
            {briefings.length} Reports
          </span>
        </div>

        <button
          disabled={aiBriefingLoading}
          onClick={handleGenerateBriefing}
          className="w-full bg-[#0f172a] hover:bg-black text-white text-xs font-semibold py-2.5 px-4 rounded-md transition-all shadow-sm flex items-center justify-center gap-1.5 mt-4 cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-[#10b981]" />
          Compile Strategic Briefing
        </button>

        {/* List index */}
        <div className="space-y-2.5 mt-5">
          {briefings.map((brief, idx) => {
            const isSelected = selectedBriefing?.id === brief.id;
            return (
              <div
                key={idx}
                onClick={() => setSelectedBriefing(brief)}
                className={`p-3.5 border rounded-lg text-xs cursor-pointer transition-all ${
                  isSelected 
                    ? 'border-indigo-505 bg-indigo-50/20 shadow-sm border-[#10b981]' 
                    : 'border-slate-200 hover:border-slate-350 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between font-mono text-[10px] text-slate-400 flex-wrap">
                  <span className="font-semibold text-slate-650">REF_ID: {brief.id}</span>
                  <span>{new Date(brief.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <h4 className="font-bold text-slate-900 mt-1.5 line-clamp-1">Executive Report: {brief.id}</h4>
                <p className="text-slate-500 mt-1 line-clamp-2 leading-relaxed">{brief.executiveSummary}</p>
              </div>
            );
          })}

            {briefings.length === 0 && (
              <div className="text-center text-slate-400 py-12">No reports compiled. Trigger compilation above.</div>
            )}
          </div>
      </div>

      {/* Right Column: Active briefing visual dossier */}
      <div className="lg:col-span-8 bg-white border border-slate-200 rounded-lg p-6 shadow-sm flex flex-col justify-between">
        {aiBriefingLoading ? (
          /* High compliance loader animation */
          <div className="py-20 flex flex-col items-center justify-center space-y-6">
            <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-[#10b981] animate-spin"></div>
            
            <div className="text-center space-y-3.5 max-w-sm">
              <h3 className="text-xs font-bold font-mono text-slate-700 uppercase tracking-widest animate-pulse">Running executive intelligence mapping</h3>
              
              <div className="bg-slate-50 border border-slate-200 rounded p-4 font-mono text-[11px] text-slate-500 leading-normal h-16 flex items-center justify-center">
                &gt; {compilerMessages[compilerStep]}
              </div>

              {/* Incremental steps verification check list */}
              <div className="text-left font-mono text-[10px] space-y-1.5 pl-4 pt-4 border-t border-slate-100 text-slate-450">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className={`w-3.5 h-3.5 ${compilerStep >= 0 ? 'text-[#10b981]' : 'text-slate-200'}`} />
                  <span>Metrics Aggregation Core INGEST: Completed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className={`w-3.5 h-3.5 ${compilerStep >= 1 ? 'text-[#10b981]' : 'text-slate-200'}`} />
                  <span>Predictive SLA Breaches Calculus: Active</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className={`w-3.5 h-3.5 ${compilerStep >= 2 ? 'text-[#10b981]' : 'text-slate-200'}`} />
                  <span>Server-Side Handshake Model (Gemini 3.5): Handshaking</span>
                </div>
              </div>
            </div>
          </div>
        ) : selectedBriefing ? (
          /* Dossier View */
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#10b981]" />
                <div>
                  <h2 className="text-sm font-bold text-slate-905 uppercase font-mono tracking-tight">C-Suite Operations Strategic Dossier</h2>
                  <span className="text-[10px] text-slate-450 font-mono">Report Ref ID: {selectedBriefing.id} | Timestamp: {new Date(selectedBriefing.timestamp).toLocaleString()}</span>
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-400 border border-slate-200 px-2 py-0.5 rounded uppercase flex items-center gap-1">
                <Activity className="w-3 h-3 text-indigo-500" />
                Auth Verified
              </span>
            </div>

            {/* Core Summary in beautiful highlight display font */}
            <div className="bg-slate-50 border-l-4 border-[#10b981] p-4 rounded-r-lg">
              <span className="text-[9px] font-mono font-bold text-slate-400 block uppercase mb-1">Executive Advisory Summary</span>
              <p className="text-sm text-slate-800 leading-relaxed font-sans font-medium">
                {selectedBriefing.executiveSummary}
              </p>
            </div>

            {/* Comprehensive Dossier Grid Modules */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-700">
              
              {/* Strategic Risks & Department Warnings */}
              <div className="space-y-3.5">
                <h4 className="font-bold text-slate-800 uppercase font-mono text-[10px] tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600 animate-pulse" />
                  Calculated Strategic Hazards
                </h4>
                <ul className="space-y-2.5 font-sans leading-relaxed text-slate-650">
                  {selectedBriefing.topRisks.map((item, i) => (
                    <li key={i} className="flex gap-2.5 items-start">
                      <CornerDownRight className="w-3.5 h-3.5 text-[#10b981] mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Department Issues */}
              <div className="space-y-3.5">
                <h4 className="font-bold text-slate-800 uppercase font-mono text-[10px] tracking-wider flex items-center gap-1.5">
                  <AlertOctagon className="w-4 h-4 text-amber-500 animate-pulse" />
                  Resource & Department Load Warnings
                </h4>
                <ul className="space-y-2.5 font-sans leading-relaxed text-slate-650">
                  {selectedBriefing.departmentIssues.map((item, i) => (
                    <li key={i} className="flex gap-2.5 items-start">
                      <CornerDownRight className="w-3.5 h-3.5 text-[#10b981] mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* SAP Connection Concerns */}
              <div className="space-y-3.5 pt-4 border-t border-slate-100">
                <h4 className="font-bold text-slate-800 uppercase font-mono text-[10px] tracking-wider flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-indigo-600 animate-pulse" />
                  SAP Integration Handshake Concerns
                </h4>
                <ul className="space-y-2.5 font-sans leading-relaxed text-slate-650">
                  {selectedBriefing.sapConcerns.map((item, i) => (
                    <li key={i} className="flex gap-2.5 items-start">
                      <CornerDownRight className="w-3.5 h-3.5 text-[#10b981] mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Operational Bottlenecks */}
              <div className="space-y-3.5 pt-4 border-t border-slate-100">
                <h4 className="font-bold text-slate-800 uppercase font-mono text-[10px] tracking-wider flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-[#06b6d4] animate-pulse" />
                  Core Business bottlenecks
                </h4>
                <ul className="space-y-2.5 font-sans leading-relaxed text-slate-650">
                  {selectedBriefing.bottlenecks.map((item, i) => (
                    <li key={i} className="flex gap-2.5 items-start">
                      <CornerDownRight className="w-3.5 h-3.5 text-[#10b981] mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

            {/* High level 24 Hour Priority Action list (look at checklist design!) */}
            <div className="border-t border-slate-200 pt-5 space-y-4">
              <h3 className="font-bold text-slate-800 uppercase font-mono text-[10px] tracking-wider flex items-center gap-1.5">
                <Zap className="w-4.5 h-4.5 text-[#f59e0b] animate-bounce" />
                24-Hour Corporate Priority Action Checklist
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 font-sans">
                {selectedBriefing.priorityPlan24h.map((plan, i) => (
                  <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-md flex gap-3 items-center hover:bg-slate-100/50 transition-colors">
                    <div className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center font-bold font-mono text-[10px] text-indigo-650">
                      {i + 1}
                    </div>
                    <span className="text-xs text-slate-700 font-medium">{plan}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        ) : (
          <div className="py-24 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
             <Sparkles className="w-8 h-8 text-indigo-250 animate-pulse" />
             <p className="text-xs font-mono uppercase tracking-widest col-span-2">No Strategic advisory compiled currently.</p>
             <button 
               onClick={handleGenerateBriefing} 
               className="bg-slate-900 border border-black text-white hover:bg-black font-semibold text-xs px-5 py-2 rounded transition-all cursor-pointer shadow"
             >
               Compile Primary Executive Briefing
             </button>
          </div>
        )}
      </div>

    </div>
  );
}
