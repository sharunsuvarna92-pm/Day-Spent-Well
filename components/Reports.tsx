
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { CATEGORY_CONFIG } from '../constants/categories';

interface ReportsProps {
  onBack: () => void;
}

type RangeType = 'rolling' | 'week';

const Reports: React.FC<ReportsProps> = ({ onBack }) => {
  const [range, setRange] = useState<RangeType>('rolling');
  const [sessions, setSessions] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      let startDateStr: string;

      if (range === 'rolling') {
        const start = new Date(now);
        start.setDate(now.getDate() - 6);
        startDateStr = start.toISOString().split('T')[0];
      } else {
        const start = new Date(now);
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        start.setDate(diff);
        startDateStr = start.toISOString().split('T')[0];
      }

      const [sessionsRes, plansRes] = await Promise.all([
        supabase.from('activity_sessions').select('*').gte('activity_date', startDateStr).not('end_time', 'is', null),
        supabase.from('plans').select('*').eq('is_active', true)
      ]);

      setSessions(sessionsRes.data || []);
      setPlans(plansRes.data || []);
      setIsLoading(false);
    };
    fetchData();
  }, [range]);

  const reportData = useMemo(() => {
    const categories = Object.keys(CATEGORY_CONFIG);
    const dayCount = range === 'rolling' ? 7 : new Date().getDay() || 7;
    
    const results = categories.map(cat => {
      const catPlans = plans.filter(p => p.category === cat);
      // Planned: Average minutes per day based on target
      const totalPlannedDaily = catPlans.reduce((sum, p) => sum + p.target_minutes, 0);
      
      const catSessions = sessions.filter(s => s.activity_name === catPlans.find(p => p.id === s.plan_id)?.activity_name || s.plan_id && catPlans.some(cp => cp.id === s.plan_id));
      const totalActualSec = sessions.reduce((sum, s) => {
        const plan = plans.find(p => p.id === s.plan_id);
        if (plan?.category === cat) return sum + (s.duration_seconds || 0);
        return sum;
      }, 0);

      const actualAvgMins = (totalActualSec / 60) / dayCount;
      const diff = actualAvgMins - totalPlannedDaily;

      // Variance/Consistency (mock logic based on daily presence)
      const dailyPresence = sessions.reduce((acc, s) => {
        const plan = plans.find(p => p.id === s.plan_id);
        if (plan?.category === cat) acc.add(s.activity_date);
        return acc;
      }, new Set()).size;
      
      const consistency = dailyPresence >= dayCount * 0.8 ? 'High' : dailyPresence >= dayCount * 0.4 ? 'Medium' : 'Low';

      return { cat, plannedAvg: totalPlannedDaily, actualAvg: actualAvgMins, diff, consistency };
    });

    const mostOverspent = [...results].sort((a, b) => b.diff - a.diff)[0];
    const mostUnderspent = [...results].sort((a, b) => a.diff - b.diff)[0];
    
    const absDevSum = results.reduce((sum, r) => sum + (r.plannedAvg > 0 ? Math.abs(r.diff) / r.plannedAvg : 0), 0);
    const balanceIndex = absDevSum < 0.15 ? 'Stable' : absDevSum < 0.4 ? 'Slightly Skewed' : 'Skewed';
    
    const totalActualSecOverall = sessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
    const avgTrackedMins = (totalActualSecOverall / 60) / dayCount;
    const hh = Math.floor(avgTrackedMins / 60);
    const mm = Math.floor(avgTrackedMins % 60);
    const formattedAvgTime = `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;

    return { results, mostOverspent, mostUnderspent, balanceIndex, formattedAvgTime };
  }, [sessions, plans, range]);

  if (isLoading) return <div className="py-20 text-center text-white/20 animate-pulse">Analyzing timeline...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 -ml-2 text-white/40 hover:text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg></button>
        <h2 className="text-2xl font-medium tracking-tight">Insights</h2>
      </div>

      <div className="flex p-1 bg-[#12141A] rounded-full border border-white/[0.04]">
        <button onClick={() => setRange('rolling')} className={`flex-1 py-2 text-[9px] font-bold uppercase tracking-widest rounded-full transition-all ${range === 'rolling' ? 'bg-[#1E2230] text-white' : 'text-white/30'}`}>Last 7 Days</button>
        <button onClick={() => setRange('week')} className={`flex-1 py-2 text-[9px] font-bold uppercase tracking-widest rounded-full transition-all ${range === 'week' ? 'bg-[#1E2230] text-white' : 'text-white/30'}`}>This Week</button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#12141A] p-5 rounded-[28px] border border-white/[0.04] space-y-1">
          <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Spent Avg</p>
          <p className="text-2xl font-light tracking-tight">{reportData.formattedAvgTime}</p>
        </div>
        <div className="bg-[#12141A] p-5 rounded-[28px] border border-white/[0.04] space-y-1">
          <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Balance</p>
          <p className="text-xl font-light tracking-tight">{reportData.balanceIndex}</p>
        </div>
      </div>

      <div className="bg-[#12141A] p-6 rounded-[32px] border border-white/[0.04] space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-white/[0.02]">
          <span className="text-xs text-white/40">Most Overspent</span>
          <span className="text-xs font-bold text-red-400">+{Math.round(reportData.mostOverspent?.diff || 0)}m/d</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-white/40">Most Underspent</span>
          <span className="text-xs font-bold text-blue-400">{Math.round(reportData.mostUnderspent?.diff || 0)}m/d</span>
        </div>
      </div>

      <div className="space-y-3 pb-12">
        <h3 className="text-[11px] font-bold text-white/20 uppercase tracking-widest px-1">Category Breakdown</h3>
        {reportData.results.map(r => {
          const config = CATEGORY_CONFIG[r.cat];
          const diffAbs = Math.abs(r.diff);
          const isOver = r.diff > 1; // More than 1 min tolerance
          const isUnder = r.diff < -1;
          const statusColor = isOver ? 'text-red-400' : isUnder ? 'text-blue-400' : 'text-white/30';

          return (
            <div key={r.cat} className="bg-[#12141A]/60 border border-white/[0.04] p-5 rounded-[28px] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: config.color }} />
                  <span className="font-medium text-white/90">{config.label}</span>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-bold ${statusColor}`}>{isOver ? '+' : ''}{Math.round(r.diff)}m/day</p>
                  <p className="text-[10px] text-white/20 uppercase font-bold tracking-widest">{r.consistency} Consistency</p>
                </div>
              </div>
              <div className="flex gap-8 px-1">
                <div className="space-y-0.5">
                  <p className="text-[9px] text-white/20 uppercase font-bold tracking-widest">Goal</p>
                  <p className="text-sm font-medium tabular-nums text-white/40">{Math.round(r.plannedAvg)}m</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] text-white/20 uppercase font-bold tracking-widest">Actual</p>
                  <p className="text-sm font-medium tabular-nums text-white/60">{Math.round(r.actualAvg)}m</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Reports;
