/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Users, 
  CheckSquare, 
  Percent, 
  Flame, 
  AlertOctagon, 
  Clock, 
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';

interface KPICardsProps {
  metrics: {
    employeesCount: number;
    tasksCount: number;
    completionRate: number;
    slaBreachRate: number;
    activeAlertsCount: number;
    averageHours: number;
    overloadedDepartments: string[];
  };
}

export default function KPICards({ metrics }: KPICardsProps) {
  const list = [
    {
      title: 'Total Employees',
      value: metrics.employeesCount,
      icon: Users,
      color: 'border-slate-200 text-slate-700 bg-slate-50',
      sparkline: [20, 24, 25, 26, 28, 28, 30],
      trend: { direction: 'up', text: '+4% this wk', val: '+2' },
      insight: 'Full active headcount allocated'
    },
    {
      title: 'Active Tasks Tracker',
      value: metrics.tasksCount,
      icon: CheckSquare,
      color: 'border-[#10b981] text-[#10b981] bg-emerald-50/10',
      sparkline: [40, 52, 48, 62, 59, 65, 71],
      trend: { direction: 'up', text: '+15.2% intensity', val: '+11% trend' },
      insight: 'High pending priority backlog'
    },
    {
      title: 'System Completion Rate',
      value: `${metrics.completionRate}%`,
      icon: Percent,
      color: 'border-[#06b6d4] text-[#06b6d4] bg-cyan-50/10',
      sparkline: [60, 64, 72, 70, 75, 78, 81],
      trend: { direction: 'up', text: 'Velocity is recovering', val: '+3.1%' },
      insight: 'QA processing unblocked'
    },
    {
      title: 'SLA Breach Rate',
      value: `${metrics.slaBreachRate}%`,
      icon: Flame,
      color: metrics.slaBreachRate > 15 ? 'border-[#f59e0b] text-[#f59e0b] bg-amber-50/15' : 'border-slate-200 text-slate-500',
      sparkline: [12, 18, 15, 22, 24, 21, 19],
      trend: { direction: metrics.slaBreachRate > 15 ? 'up' : 'down', text: metrics.slaBreachRate > 15 ? 'Warning threshold breached' : 'Stable levels', val: `${metrics.slaBreachRate}%` },
      insight: 'Concentrated in SC channels'
    },
    {
      title: 'Severe Operations Alerts',
      value: metrics.activeAlertsCount,
      icon: AlertOctagon,
      color: metrics.activeAlertsCount > 2 ? 'border-red-400 text-red-500 bg-red-50/10' : 'border-slate-200 text-amber-500',
      sparkline: [2, 3, 4, 3, 5, 4, metrics.activeAlertsCount],
      trend: { direction: 'neutral', text: 'Critical threat state', val: `${metrics.activeAlertsCount} active` },
      insight: '1 Critical blockage unresolved'
    },
    {
      title: 'Capacity Avg Hours',
      value: `${metrics.averageHours}h`,
      icon: Clock,
      color: 'border-slate-200 text-slate-700',
      sparkline: [38, 40, 39, 41, 42, 40, metrics.averageHours],
      trend: { direction: 'up', text: 'Resource burnout exposure', val: '+2.4h backlog' },
      insight: metrics.overloadedDepartments.length > 0 ? `Overloaded: ${metrics.overloadedDepartments.join(', ')}` : 'Backlog workload stable'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {list.map((card, i) => {
        const Icon = card.icon;
        return (
          <div 
            key={i} 
            id={`kpi_card_${i}`}
            className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-md transition-all group"
          >
            {/* Title and Icon */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 tracking-tight">{card.title}</span>
              <div className={`p-1.5 rounded-md border ${card.color.split(' ')[0]} ${card.color.split(' ')[2] || 'bg-slate-50'}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Main Value */}
            <div className="mt-2.5">
              <h3 className="text-2xl font-bold font-mono tracking-tight text-slate-900 group-hover:text-black transition-colors">
                {card.value}
              </h3>
            </div>

            {/* Sparkline and Trend */}
            <div className="mt-3.5 flex items-end justify-between">
              {/* Custom SVG Sparkline path */}
              <div className="w-20 h-6">
                <svg className="w-full h-full overflow-visible">
                  <path
                    d={`M ${card.sparkline.map((val, idx) => `${(idx * 20) / (card.sparkline.length - 1)},${24 - ((val - Math.min(...card.sparkline)) / (Math.max(...card.sparkline) - Math.min(...card.sparkline) || 1)) * 18}`).join(' L ')}`}
                    fill="none"
                    stroke={
                      card.title.includes('Alerts') && metrics.activeAlertsCount > 2 
                        ? '#ef4444' 
                        : card.title.includes('Breach') && metrics.slaBreachRate > 15 
                        ? '#f59e0b' 
                        : '#10b981'
                    }
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* Trend Badge */}
              <div className="flex items-center gap-0.5 text-[10px] font-mono leading-none">
                {card.trend.direction === 'up' && (
                  <ArrowUpRight className={`w-3 h-3 ${card.title.includes('Breach') || card.title.includes('Alerts') ? 'text-red-500' : 'text-emerald-500'}`} />
                )}
                {card.trend.direction === 'down' && (
                  <ArrowDownRight className="w-3 h-3 text-emerald-500" />
                )}
                {card.trend.direction === 'neutral' && (
                  <Minus className="w-3 h-3 text-slate-400" />
                )}
                <span className={`font-semibold ${
                  card.trend.direction === 'neutral'
                    ? 'text-slate-500'
                    : card.title.includes('Breach') || card.title.includes('Alerts')
                    ? 'text-amber-600'
                    : 'text-emerald-600'
                }`}>
                  {card.trend.val}
                </span>
              </div>
            </div>

            {/* Micro operational insight */}
            <div className="mt-3.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
              <span className="truncate max-w-[85%]">{card.insight}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0"></span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
