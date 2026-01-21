
import React, { useState, useMemo } from 'react';
import { Plan, DayType } from '../types';
import { supabase } from '../services/supabase';
import { CATEGORY_CONFIG } from '../constants/categories';
import { 
  Briefcase, 
  HeartPulse, 
  Moon, 
  ShoppingBag, 
  Smile, 
  BookOpen,
  Pencil,
  Trash2
} from 'lucide-react';

interface PlanListProps {
  plans: Plan[];
  onEdit: (plan: Plan) => void;
  onAdd: (dayType: DayType) => void;
  onRefresh: () => void;
}

// Added style to the props interface to fix type error on line 111
const CategoryIcon: React.FC<{ category: string; className?: string; style?: React.CSSProperties }> = ({ category, className, style }) => {
  switch (category) {
    case 'work': return <Briefcase className={className} style={style} />;
    case 'health': return <HeartPulse className={className} style={style} />;
    case 'sleep': return <Moon className={className} style={style} />;
    case 'essentials': return <ShoppingBag className={className} style={style} />;
    case 'leisure': return <Smile className={className} style={style} />;
    case 'learning':
    case 'education': return <BookOpen className={className} style={style} />;
    default: return <Briefcase className={className} style={style} />;
  }
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
          filteredPlans.map((plan) => {
            const catKey = plan.category === 'education' ? 'learning' : plan.category;
            const config = CATEGORY_CONFIG[catKey] || CATEGORY_CONFIG.work;
            
            return (
              <div key={plan.id} className="bg-[#12141A]/60 border border-white/[0.04] rounded-[28px] p-5 flex justify-between items-center group transition-all hover:bg-[#181B23] active:scale-[0.99]">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-11 h-11 rounded-2xl flex items-center justify-center transition-colors"
                    style={{ backgroundColor: `${config.color}15` }}
                  >
                    <CategoryIcon category={catKey} className="w-5 h-5" style={{ color: config.color }} />
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-medium text-base tracking-tight text-white/90">{plan.activity_name}</p>
                    <div className="flex gap-2 items-center">
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: config.color }}>
                        {config.label}
                      </span>
                      <span className="w-0.5 h-0.5 bg-white/10 rounded-full" />
                      <span className="text-[10px] text-white/30 font-medium tabular-nums uppercase tracking-widest">
                        {plan.target_minutes}m budget
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => onEdit(plan)}
                    className="p-2 text-white/40 hover:text-white transition-colors"
                    title="Edit Rule"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => disablePlan(plan.id)}
                    className="p-2 text-white/40 hover:text-red-400 transition-colors"
                    title="Remove Rule"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PlanList;