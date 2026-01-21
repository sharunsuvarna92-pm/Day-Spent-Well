
import React, { useState } from 'react';
import { Plan, DayType } from '../types';
import { supabase } from '../services/supabase';
import { CATEGORY_CONFIG } from '../constants/categories';

interface PlanFormProps {
  plan: Plan | null;
  dayType: DayType;
  allPlans: Plan[];
  onCancel: () => void;
  onSave: () => void;
}

const PlanForm: React.FC<PlanFormProps> = ({ plan, dayType, allPlans, onCancel, onSave }) => {
  // Map legacy 'education' to 'learning'
  const initialCategory = plan?.category === 'education' ? 'learning' : (plan?.category || 'work');
  
  const [name, setName] = useState(plan?.activity_name || '');
  const [category, setCategory] = useState(initialCategory);
  const [target, setTarget] = useState(plan?.target_minutes?.toString() || '60');
  const [localDayType, setLocalDayType] = useState<DayType>(plan?.day_type || dayType);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const targetMins = parseInt(target);
    if (isNaN(targetMins) || targetMins <= 0) {
      setError("Please enter a valid duration.");
      setLoading(false);
      return;
    }

    const existingMinsForType = allPlans
      .filter(p => p.day_type === localDayType && p.id !== plan?.id)
      .reduce((acc, curr) => acc + curr.target_minutes, 0);

    const totalProposed = existingMinsForType + targetMins;

    if (totalProposed > 1440) {
      const over = totalProposed - 1440;
      setError(`Cannot exceed 24 hours. You are over by ${over} minutes for ${localDayType}s.`);
      setLoading(false);
      return;
    }

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) throw new Error("Authentication session expired.");
      const userId = session.user.id;

      const payload = {
        activity_name: name,
        category,
        target_minutes: targetMins,
        day_type: localDayType,
        user_id: userId,
        is_active: true
      };

      if (plan) {
        const { error: updateError } = await supabase.from('plans').update(payload).eq('id', plan.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from('plans').insert(payload);
        if (insertError) throw insertError;
      }

      onSave();
    } catch (err: any) {
      setError(err.message || "Failed to save rule.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <h2 className="text-xl font-medium text-white/90">{plan ? 'Edit Activity Rule' : 'New Activity Rule'}</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-400/10 border border-red-400/20 rounded-xl text-red-400 text-xs font-medium">
            {error}
          </div>
        )}

        <div className="space-y-1">
          <label className="block text-sm font-medium text-white/30 mb-1 ml-1">Activity Name</label>
          <input 
            type="text" 
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[#12141A] border border-white/[0.04] rounded-2xl p-4 focus:outline-none focus:border-white/10 text-white placeholder-white/20"
            placeholder="e.g. Deep Work, Gym, Reading"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-white/30 mb-1 ml-1">Category</label>
            <div className="relative">
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#12141A] border border-white/[0.04] rounded-2xl p-4 focus:outline-none focus:border-white/10 appearance-none text-white font-medium capitalize"
                style={{ color: CATEGORY_CONFIG[category]?.color || 'white' }}
              >
                {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key} style={{ color: cfg.color }} className="bg-[#12141A]">
                    {cfg.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-white/30 mb-1 ml-1">Target (min)</label>
            <input 
              type="number" 
              required
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full bg-[#12141A] border border-white/[0.04] rounded-2xl p-4 focus:outline-none focus:border-white/10 text-white tabular-nums"
            />
          </div>
        </div>

        <div className="space-y-1">
           <label className="block text-sm font-medium text-white/30 mb-2 ml-1">Day Type</label>
           <div className="flex gap-2 p-1 bg-[#12141A] rounded-2xl border border-white/[0.04]">
             {(['weekday', 'weekend', 'holiday'] as DayType[]).map((type) => (
               <button
                key={type}
                type="button"
                onClick={() => setLocalDayType(type)}
                className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                  localDayType === type ? 'bg-[#1E2230] text-white shadow-lg' : 'text-white/30'
                }`}
               >
                 {type}
               </button>
             ))}
           </div>
        </div>

        <div className="pt-6 flex gap-3">
          <button 
            type="button" 
            onClick={onCancel}
            className="flex-1 bg-[#12141A] text-white/60 font-bold py-4 rounded-2xl transition-colors border border-white/[0.04] active:scale-95"
          >
            Cancel
          </button>
          <button 
            type="submit"
            disabled={loading}
            className="flex-1 bg-white text-[#0B0C10] font-bold py-4 rounded-2xl transition-opacity disabled:opacity-50 active:scale-95 shadow-xl"
          >
            {loading ? 'Saving...' : 'Save Rule'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PlanForm;
