
import React, { useMemo } from 'react';
import { DashboardRow, RunningSession, Plan, DailyTotals } from '../types';
import { CATEGORY_CONFIG } from '../constants/categories';
import { 
  Briefcase, 
  HeartPulse, 
  Moon, 
  ShoppingBag, 
  Smile, 
  BookOpen 
} from 'lucide-react';

interface DashboardProps {
  rows: DashboardRow[];
  plans: Plan[];
  totals: DailyTotals | null;
  baseDaySeconds: number;
  runningSession: RunningSession | null;
  sessionHistory: string[];
  onStart: (planId: string, name: string) => void;
  onStop: () => void;
  liveSessionSeconds: number;
  isLoading: boolean;
  isHistorical?: boolean;
}

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

const TimerText: React.FC<{ seconds: number; className?: string }> = ({ seconds, className = "" }) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  
  return (
    <span className={`tabular-nums font-medium tracking-tight ${className}`}>
      {h > 0 && `${h}:`}{m.toString().padStart(h > 0 ? 2 : 1, '0')}:{s.toString().padStart(2, '0')}
    </span>
  );
};

const ActivityRing: React.FC<{ progress: number; category: string; size?: number; strokeWidth?: number; active?: boolean; historical?: boolean }> = ({ 
  progress, category, size = 48, strokeWidth = 5, active = false, historical = false 
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const cappedProgress = Math.min(progress, 1);
  const offset = circumference - (cappedProgress * circumference);
  
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.work;
  const color = config.color;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="absolute inset-0 transform -rotate-90 w-full h-full" viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-white/[0.04]"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ 
            transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            filter: active && !historical ? `drop-shadow(0 0 6px ${color}80)` : 'none',
            opacity: historical ? 0.3 : 1
          }}
          strokeLinecap="round"
        />
      </svg>
      <CategoryIcon 
        category={category} 
        className="w-4 h-4 opacity-40 relative z-10" 
        style={{ color: active ? 'white' : color }}
      />
      {active && !historical && (
        <div 
          className="absolute inset-0 rounded-full animate-pulse" 
          style={{ width: size, height: size, backgroundColor: `${color}08` }}
        />
      )}
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ 
  rows, plans, totals, runningSession, sessionHistory, onStart, onStop, liveSessionSeconds, isHistorical 
}) => {
  const calculateDisplayMinutes = (totalSeconds: number) => Math.floor(totalSeconds / 60);

  const overallTrackedSeconds = useMemo(() => {
    const baseSeconds = (totals as any)?.total_seconds || 0;
    const live = (!isHistorical && runningSession) ? liveSessionSeconds : 0;
    return baseSeconds + live;
  }, [totals, runningSession, liveSessionSeconds, isHistorical]);

  const untrackedMinutes = useMemo(() => {
    return Math.max(0, 1440 - Math.floor(overallTrackedSeconds / 60));
  }, [overallTrackedSeconds]);

  const dayProgress = Math.min(overallTrackedSeconds / 86400, 1);
  const mainRadius = 118;
  const mainCircumference = mainRadius * 2 * Math.PI;
  const mainOffset = mainCircumference - (dayProgress * mainCircumference);

  const displayRows = useMemo(() => {
    const items = plans.map(plan => {
      const sessionData = rows.find(r => r.plan_id === plan.id);
      return {
        plan_id: plan.id,
        activity_name: plan.activity_name,
        target_minutes: plan.target_minutes,
        category: plan.category === 'education' ? 'learning' : plan.category,
        baseActivitySeconds: sessionData?.actual_seconds || 0,
      };
    });

    // Sort by Most Recently Used (MRU)
    // 1. If currently active, it's always #1.
    // 2. Otherwise, check its position in the sessionHistory.
    // 3. Otherwise, maintain original order.
    return [...items].sort((a, b) => {
      const aIsActive = !isHistorical && runningSession?.planId === a.plan_id;
      const bIsActive = !isHistorical && runningSession?.planId === b.plan_id;
      
      if (aIsActive) return -1;
      if (bIsActive) return 1;

      const aHistoryIdx = sessionHistory.indexOf(a.plan_id);
      const bHistoryIdx = sessionHistory.indexOf(b.plan_id);

      // If both were previously active, the one active most recently (lower index) comes first
      if (aHistoryIdx !== -1 && bHistoryIdx !== -1) return aHistoryIdx - bHistoryIdx;
      // If only 'a' was previously active
      if (aHistoryIdx !== -1) return -1;
      // If only 'b' was previously active
      if (bHistoryIdx !== -1) return 1;

      return 0;
    });
  }, [plans, rows, runningSession, sessionHistory, isHistorical]);

  return (
    <div className="space-y-10 pb-12">
      <section className="flex flex-col items-center justify-center pt-4">
        <div className="relative w-64 h-64 flex items-center justify-center">
          <svg className="absolute inset-0 transform -rotate-90 w-full h-full" viewBox="0 0 256 256">
            <circle
              cx="128"
              cy="128"
              r={mainRadius}
              stroke="#12141A"
              strokeWidth="12"
              fill="transparent"
            />
            <circle
              cx="128"
              cy="128"
              r={mainRadius}
              stroke="white"
              strokeWidth="12"
              fill="transparent"
              strokeDasharray={mainCircumference}
              strokeDashoffset={mainOffset}
              style={{ 
                transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: isHistorical ? 0.3 : 0.9,
                filter: (!isHistorical && runningSession) ? 'drop-shadow(0 0 8px rgba(255,255,255,0.3))' : 'none'
              }}
              strokeLinecap="round"
            />
          </svg>
          
          <div className="flex flex-col items-center justify-center text-center space-y-1 z-10">
            <p className="text-[10px] font-medium text-white/40 uppercase tracking-[0.2em] mb-1">Day Spent</p>
            <TimerText seconds={overallTrackedSeconds} className={`text-4xl font-light transition-colors ${isHistorical ? 'text-white/60' : 'text-white'}`} />
            <div className="flex items-center gap-1.5 pt-2">
              <span className={`w-1.5 h-1.5 rounded-full ${(runningSession && !isHistorical) ? 'bg-white animate-pulse' : 'bg-[#181B23]'}`} />
              <p className="text-[10px] font-medium text-white/40 tabular-nums">
                {untrackedMinutes}m unaccounted
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex justify-between items-end px-1">
          <h2 className="text-[11px] font-medium text-white/30 uppercase tracking-widest">Planned Timeline</h2>
          {isHistorical && (
             <span className="text-[9px] text-white/20 italic">This day has already been lived</span>
          )}
        </div>
        
        {isHistorical && displayRows.every(r => r.baseActivitySeconds === 0) ? (
          <div className="py-12 text-center text-white/20 text-sm font-light italic border border-white/[0.02] rounded-[24px]">
            No time logged for this day
          </div>
        ) : (
          <div className="grid gap-3">
            {displayRows.map((row) => {
              const isActive = !isHistorical && runningSession?.planId === row.plan_id;
              const activitySeconds = row.baseActivitySeconds + (isActive ? liveSessionSeconds : 0);
              const currentMins = calculateDisplayMinutes(activitySeconds);
              const progress = row.target_minutes > 0 ? (currentMins / row.target_minutes) : 0;
              const config = CATEGORY_CONFIG[row.category] || CATEGORY_CONFIG.work;
              
              return (
                <div 
                  key={row.plan_id} 
                  className={`group relative overflow-hidden transition-all duration-500 ease-out rounded-[24px] p-5 border ${
                    isActive ? 'bg-[#12141A] border-white/10 shadow-xl' : 'bg-[#12141A]/40 border-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                      <ActivityRing progress={progress} category={row.category} active={isActive} historical={isHistorical} />
                      <div className="space-y-0.5">
                        <h3 className={`font-medium text-base transition-colors ${isActive ? 'text-white' : 'text-white/70'}`}>
                          {row.activity_name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/[0.03] text-white/30">
                            {config.label}
                          </span>
                          <p className="text-xs text-white/40 font-medium tabular-nums">
                            {currentMins} of {row.target_minutes}m spent
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {(isActive || (activitySeconds > 0)) && (
                        <TimerText seconds={activitySeconds} className="text-sm font-medium text-white pr-2" />
                      )}
                      
                      {!isHistorical ? (
                        <button 
                          onClick={() => isActive ? onStop() : onStart(row.plan_id, row.activity_name)}
                          className={`h-11 w-11 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                            isActive ? 'text-[#0B0C10]' : 'bg-[#181B23] text-white/40 hover:text-white hover:bg-[#1E2230]'
                          }`}
                          style={isActive ? { backgroundColor: config.color } : {}}
                        >
                          {isActive ? (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="1" /></svg>
                          ) : (
                            <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                          )}
                        </button>
                      ) : (
                        <div className="text-[10px] font-medium text-white/10 uppercase tracking-widest border border-white/5 px-3 py-1.5 rounded-full">
                          Past
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
