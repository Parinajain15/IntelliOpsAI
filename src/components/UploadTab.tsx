/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState } from 'react';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp, 
  Server, 
  ArrowRight,
  Sparkles,
  Clipboard,
  Database
} from 'lucide-react';

interface UploadGridRec {
  EmployeeName: string;
  Department: string;
  TaskStatus: string;
  HoursWorked: number;
  SLA_Breached: boolean;
  Timestamp: string;
  Priority: string;
  DueDate: string;
  Notes: string;
}

interface UploadTabProps {
  onSuccessUpload: (fileName: string, importedRecords: number) => void;
  addOperationalLog: (message: string, dept: string, priority: string) => void;
  triggerRefresh: () => void;
}

export default function UploadTab({ onSuccessUpload, addOperationalLog, triggerRefresh }: UploadTabProps) {
  const [dragActive, setDragActive] = useState(false);
  const [parsingState, setParsingState] = useState<'idle' | 'parsing' | 'completed' | 'failed'>('idle');
  const [pastedCsv, setPastedCsv] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileName, setFileName] = useState('');
  const [feedback, setFeedback] = useState<{ success: boolean; message: string; count: number } | null>(null);

  const [recentUploads, setRecentUploads] = useState([
    { name: 'logistics_asia_q2_raw.csv', count: 184, status: 'Processed', time: '10 hrs ago', user: 'Elena Rostova' },
    { name: 'incidents_europe_v4.csv', count: 42, status: 'Processed', time: 'Yesterday', user: 'Marcus Vance' },
    { name: 'staff_hours_archive_2026.csv', count: 88, status: 'Processed', time: '2 days ago', user: 'Hiroshi Tanaka' }
  ]);

  // Premium corporate mock template CSV data
  const sampleCsvData = `EmployeeName,Department,TaskStatus,HoursWorked,SLA_Breached,Timestamp,Priority,DueDate,Notes
Marcus Vance,Engineering,Completed,48,no,2026-05-25T15:00:00Z,High,2026-05-24T18:00:00Z,Infrastructure load testing
David Kim,Engineering,In Progress,32,yes,2026-05-26T09:00:00Z,Critical,2026-05-25T17:00:00Z,Core SQL Database scaling
Priya Patel,Engineering,Completed,24,no,2026-05-24T12:00:00Z,Medium,2026-05-25T12:00:00Z,Integrate secure telemetry service
Elena Rostova,Supply Chain,Pending,40,yes,2026-05-23T11:00:00Z,Critical,2026-05-22T19:00:00Z,Shanghai custom terminal delay bypass
Lisa Wong,Supply Chain,Completed,45,no,2026-05-25T10:00:00Z,Low,2026-05-26T12:00:00Z,Carrier contracts dispatch validation
Amina Bello,Customer Support,In Progress,42,no,2026-05-26T08:00:00Z,High,2026-05-27T18:00:00Z,Remediate VIP client portal lag`;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setFeedback({ success: false, message: 'Invalid file format. Please upload a structured .csv file.', count: 0 });
      setParsingState('failed');
      return;
    }

    setFileName(file.name);
    setParsingState('parsing');
    setUploadProgress(0);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      simulateParse(text, file.name);
    };
    reader.readAsText(file);
  };

  const simulateParse = (csvText: string, fileTitle: string) => {
    // Increment progress bar to simulate ingestion server handshake
    let prog = 0;
    const interval = setInterval(() => {
      prog += 25;
      setUploadProgress(prog);
      if (prog >= 100) {
        clearInterval(interval);
        parseAndSubmit(csvText, fileTitle);
      }
    }, 200);
  };

  const parseAndSubmit = (csvText: string, fileTitle: string) => {
    try {
      const lines = csvText.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        throw new Error('CSV is empty or missing headers');
      }

      const headers = lines[0].split(',').map(h => h.trim());
      
      const parsedRecords: UploadGridRec[] = [];
      
      // Basic CSV parser to handle fields
      for (let i = 1; i < lines.length; i++) {
        const columns = lines[i].split(',').map(c => c.trim());
        if (columns.length < headers.length) continue;

        const row: any = {};
        headers.forEach((header, idx) => {
          row[header] = columns[idx];
        });

        parsedRecords.push({
          EmployeeName: row.EmployeeName || row.Employee || 'Unknown',
          Department: row.Department || 'Engineering',
          TaskStatus: row.TaskStatus || row.Status || 'Pending',
          HoursWorked: Number(row.HoursWorked) || 20,
          SLA_Breached: String(row.SLA_Breached).toLowerCase() === 'yes' || String(row.SLA_Breached).toLowerCase() === 'true',
          Timestamp: row.Timestamp || new Date().toISOString(),
          Priority: row.Priority || 'Medium',
          DueDate: row.DueDate || new Date().toISOString(),
          Notes: row.Notes || 'Imported bulk row ledger'
        });
      }

      // POST to backend API
      fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: fileTitle,
          records: parsedRecords
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setFeedback({
            success: true,
            message: `Successfully validated and parsed operational database entries.`,
            count: data.importedCount
          });
          onSuccessUpload(fileTitle, data.importedCount);
          triggerRefresh();
          setParsingState('completed');
          // Add to local history list
          setRecentUploads(prev => [
            { name: fileTitle, count: data.importedCount, status: 'Processed', time: 'Just now', user: 'Operations Manager' },
            ...prev
          ]);
        } else {
          setFeedback({ success: false, message: 'Parsing validation failed in headers mapping.', count: 0 });
          setParsingState('failed');
        }
      })
      .catch(err => {
        setFeedback({ success: false, message: err.message || 'Server network handshake timeout.', count: 0 });
        setParsingState('failed');
      });

    } catch (err: any) {
      setFeedback({ success: false, message: err.message || 'Corrupted CSV table formatting.', count: 0 });
      setParsingState('failed');
    }
  };

  const handleDemoUpload = () => {
    setFileName('sap_mm_ops_export_demo.csv');
    setParsingState('parsing');
    setUploadProgress(0);
    simulateParse(sampleCsvData, 'sap_mm_ops_export_demo.csv');
  };

  const handlePasteSubmit = () => {
    if (!pastedCsv.trim()) return;
    setFileName('manual_paste_buffer.csv');
    setParsingState('parsing');
    setUploadProgress(0);
    simulateParse(pastedCsv, 'manual_paste_buffer.csv');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Left side: Ingestion center */}
      <div className="lg:col-span-8 bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-tight font-mono">Operations & Ingestion Dashboard</h2>
          <p className="text-xs text-slate-500 mt-1">Bulk load operational registers or CSV dumps directly into the platform core</p>
        </div>

        {/* Drag n Drop portal */}
        <div 
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center transition-all ${
            dragActive ? 'border-[#10b981] bg-emerald-50/10' : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#10b981]">
            <Upload className="w-6 h-6" />
          </div>
          
          <h3 className="text-sm font-semibold text-slate-800 mt-4">Drag and drop your data files</h3>
          <p className="text-xs text-slate-450 mt-1 text-center max-w-sm">Select CSV or generic operational logs sheets file compiled in standard columns mapping guidelines</p>
          
          <div className="mt-5 flex gap-3">
            <label className="bg-slate-900 hover:bg-black text-white text-xs font-semibold px-4 py-2 rounded shadow-sm cursor-pointer transition-all">
              Browse Files
              <input 
                type="file" 
                accept=".csv" 
                onChange={handleFileChange} 
                className="hidden" 
              />
            </label>
            <button 
              onClick={handleDemoUpload}
              className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded shadow-sm transition-all flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              Use Enterprise Demo CSV Template
            </button>
          </div>
        </div>

        {/* Clipboard Manual Copy Paste box */}
        <div className="space-y-2 border-t border-slate-100 pt-5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase font-mono">
            <Clipboard className="w-3.5 h-3.5" />
            Paste Raw Ledger Data
          </label>
          <textarea
            placeholder="EmployeeName,Department,TaskStatus,HoursWorked,SLA_Breached,Timestamp,Priority,DueDate,Notes..."
            value={pastedCsv}
            onChange={(e) => setPastedCsv(e.target.value)}
            rows={4}
            className="w-full bg-slate-50 border border-slate-200 rounded p-3 text-xs font-mono focus:outline-none focus:border-indigo-500 focus:bg-white transition-all resize-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400">Header names are case-sensitive.</span>
            <button
              disabled={!pastedCsv.trim() || parsingState === 'parsing'}
              onClick={handlePasteSubmit}
              className="bg-slate-900 hover:bg-black disabled:bg-slate-100 disabled:text-slate-400 text-white text-xs font-medium px-4 py-1.5 rounded transition-all cursor-pointer"
            >
              Parse Paste Ingestion
            </button>
          </div>
        </div>

        {/* Parsing state loader panel */}
        {parsingState !== 'idle' && (
          <div className="p-4 rounded-lg border border-slate-100 bg-slate-50/50 space-y-3 transition-opacity">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-500" />
                Ingesting: {fileName}
              </span>
              <span className="font-mono text-slate-500">{uploadProgress}%</span>
            </div>
            
            {parsingState === 'parsing' && (
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-[#10b981] h-2 transition-all duration-200" style={{ width: `${uploadProgress}%` }}></div>
              </div>
            )}

            {parsingState === 'completed' && feedback && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-3 rounded text-xs flex gap-2 items-start">
                <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-semibold">LEDGER PARSERS SUCCESS</p>
                  <p className="mt-0.5 text-emerald-700 font-sans">{feedback.message}</p>
                  <p className="font-mono mt-1 font-semibold">Count: {feedback.count} compiled transaction records injected.</p>
                </div>
              </div>
            )}

            {parsingState === 'failed' && feedback && (
              <div className="bg-red-50 border border-red-100 text-red-800 p-3 rounded text-xs flex gap-2 items-start">
                <AlertCircle className="w-4 h-4 mt-0.5 text-red-600 shrink-0" />
                <div>
                  <p className="font-semibold">STRUCTURE CHECK FAILURE</p>
                  <p className="mt-0.5 text-red-700">{feedback.message}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recent timeline table */}
        <div className="border-t border-slate-100 pt-5 space-y-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase font-mono">Recent CSV Uploads</h3>
          <div className="divide-y divide-slate-100 text-xs">
            {recentUploads.map((up, i) => (
              <div key={i} className="py-2.5 flex items-center justify-between text-slate-600">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span className="font-semibold text-slate-800">{up.name}</span>
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-mono">{up.count} records</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-mono">
                  <span className="text-slate-400">By {up.user}</span>
                  <span className="text-slate-400">{up.time}</span>
                  <span className="text-[#10b981] font-bold">Processed</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Right side: Schematic explaining engine pipeline logic (Reference Image 4) */}
      <div className="lg:col-span-4 bg-[#0b1329] border border-[#1e294b] text-slate-300 rounded-lg p-5 flex flex-col justify-between shadow-md">
        <div className="space-y-6">
          <div className="border-b border-[#1e294b] pb-3 flex items-center gap-2">
            <Server className="w-4 h-4 text-[#10b981]" />
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-white">Ingestion Pipeline Pipeline</h3>
          </div>

          <div className="space-y-6 font-sans">
            <div className="relative pl-7 border-l border-[#1e294b]">
              <div className="absolute -left-3.5 top-0 w-7 h-7 rounded-full bg-[#1e294b] text-[#10b981] font-bold text-xs flex items-center justify-center font-mono border-2 border-[#0b1329]">
                01
              </div>
              <h4 className="text-xs font-bold text-white uppercase tracking-tight">Structured Ledger Parsing</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Automated regex checks schema limits. Trims and sanitizes employee names, maps strings into normalized priority levels (High, Low).
              </p>
            </div>

            <div className="relative pl-7 border-l border-[#1e294b]">
              <div className="absolute -left-3.5 top-0 w-7 h-7 rounded-full bg-[#1e294b] text-[#1e294b] font-bold text-xs flex items-center justify-center font-mono border-2 border-[#0b1329] group-active:text-[#10b981]">
                02
              </div>
              <h4 className="text-xs font-bold text-white uppercase tracking-tight">Capacity Allocations mapping</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Connects employee task hours into standard work buckets, flagging developers logging metrics above standard 45 hours threshold as High-tier anomaly parameters.
              </p>
            </div>

            <div className="relative pl-7">
              <div className="absolute -left-3.5 top-0 w-7 h-7 rounded-full bg-[#1e294b] text-slate-400 font-bold text-xs flex items-center justify-center font-mono border-2 border-[#0b1329]">
                03
              </div>
              <h4 className="text-xs font-bold text-white uppercase tracking-tight">Enterprise Risk Engine Integration</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Initiates full recalculations: recalculates corporate SLA breach percentages, adjusts overall multi-tier health score ratios, writes audit logs history ledger.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-5 border-t border-[#1e294b] flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>AI UPTIME STATUS: 99.98%</span>
          <div className="flex gap-1 items-center">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
            <span className="text-[#10b981]">ACTIVE</span>
          </div>
        </div>
      </div>

    </div>
  );
}
