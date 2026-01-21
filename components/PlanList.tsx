
import React, { useState, useMemo } from 'react';
import { Plan, DayType } from '../types';
import { supabase } from '../services/supabase';

interface PlanListProps {
  plans: Plan[];
  onEdit: (plan: Plan) => void;
  onAdd: (dayType: DayType) => void;
  onRefresh: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Work': '#FF375F',
  'Health': '#32D74B',
  'Leisure': '#FF9F0A',
  'Essentials': '#64D2FF',
  'Education': '#5E5CE6',
};

const PlanList: React.FC<PlanListProps> = ({ plans, onEdit, onAdd, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<DayType>('weekday');

  const filteredPlans = useMemo(() => 
    plans.filter(p => p.day_type === activeTab),
    [plans, activeTab]
  );

  const totalMinutes = useMemo(() => 
    filteredPlans.reduce((acc, curr) => acc + curr.target_minutes, 0),
    [filteredPlans]
  );

  const formatTotal = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const disablePlan = async (id: string) => {
    await supabase.from('plans').update({ is_active: false }).eq('id', id);
    onRefresh();
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end px-1">
        <div className="space-y-1">
          <h2 className="text-2xl font-medium tracking-tight text-white/90">Activity Rules</h2>
          <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${totalMinutes > 1440 ? 'text-red-400' : 'text-white/40'}`}>
            Budget: {formatTotal(totalMinutes)} of 24h
          </p>
        </div>
        <button 
          onClick={() => onAdd(activeTab)}
          className="bg-white text-[#0B0C10] text-xs font-bold px-5 py-2.5 rounded-full transition-all active:scale-95 shadow-lg"
        >
          New Rule
        </button>
      </div>

      <div className="flex p-1 bg-[#12141A] backdrop-blur-xl rounded-full border border-white/[0.04]">
        {(['weekday', 'weekend', 'holiday'] as DayType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-[9px] font-bold uppercase tracking-[0.15em] rounded-full transition-all duration-300 ${
              activeTab === tab 
                ? 'bg-[#1E2230] text-white shadow-md' 
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filteredPlans.length === 0 ? (
          <div className="py-24 text-center text-white/20 text-sm font-medium border border-dashed border-white/[0.04] rounded-[32px]">
            No rules set for {activeTab}s.
          </div>
        ) : (
          filteredPlans.map((plan) => (
            <div key={plan.id} className="bg-[#12141A]/60 border border-white/[0.04] rounded-[28px] p-6 flex justify-between items-center group transition-all hover:bg-[#181B23] active:scale-[0.99]">
              <div className="flex items-center gap-4">
                <div 
                  className="w-1 h-10 rounded-full" 
                  style={{ backgroundColor: CATEGORY_COLORS[plan.category] || '#FF375F' }} 
                />
                <div className="space-y-1">
                  <p className="font-medium text-lg tracking-tight text-white/90">{plan.activity_name}</p>
                  <div className="flex gap-3 items-center">
                    <span className="text-[9px] text-white/40 font-bold uppercase tracking-widest">{plan.category}</span>
                    <span className="w-1 h-1 bg-white/[0.04] rounded-full" />
                    <span className="text-xs text-white/60 tabular-nums">{plan.target_minutes}m budget</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => onEdit(plan)}
                  className="p-3 text-white/40 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button 
                  onClick={() => disablePlan(plan.id)}
                  className="p-3 text-white/40 hover:text-red-400 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PlanList;
