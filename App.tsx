
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { supabase } from './services/supabase';
import { 
  DayType, User, Plan, DashboardRow, DailyTotals, RunningSession 
} from './types';

import Login from './components/Login';
import Dashboard from './components/Dashboard';
import PlanList from './components/PlanList';
import PlanForm from './components/PlanForm';
import Navigation from './components/Navigation';
import ProfileMenu from './components/ProfileMenu';
import ProfileEdit from './components/ProfileEdit';
import Reports from './components/Reports';

const App: React.FC = () => {
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [tempDate, setTempDate] = useState<string>(todayStr);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const [dayType, setDayType] = useState<DayType>('weekday');
  const isHistorical = useMemo(() => selectedDate !== todayStr, [selectedDate, todayStr]);

  const [plans, setPlans] = useState<Plan[]>([]);
  const [dashboardRows, setDashboardRows] = useState<DashboardRow[]>([]);
  const [dailyTotals, setDailyTotals] = useState<DailyTotals | null>(null);
  
  const [runningSession, setRunningSession] = useState<RunningSession | null>(null);
  const [baseDaySeconds, setBaseDaySeconds] = useState<number>(0);
  const [liveSessionSeconds, setLiveSessionSeconds] = useState<number>(0);
  
  const [currentScreen, setCurrentScreen] = useState<'dashboard' | 'plans' | 'add-plan' | 'edit-plan' | 'edit-profile' | 'reports'>('dashboard');
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  const timerRef = useRef<number | null>(null);

  const determineDayType = useCallback((dateStr: string): DayType => {
    const date = new Date(dateStr + 'T12:00:00'); 
    const day = date.getDay();
    if (day === 0 || day === 6) return 'weekend';
    return 'weekday';
  }, []);

  useEffect(() => {
    setDayType(determineDayType(selectedDate));
  }, [selectedDate, determineDayType]);

  useEffect(() => {
    setLiveSessionSeconds(0);
    if (!isHistorical) {
      recoverActiveSession();
    } else {
      setRunningSession(null);
    }
  }, [selectedDate, isHistorical]);

  const activePlansForDashboard = useMemo(() => {
    return plans.filter(p => p.day_type === dayType);
  }, [plans, dayType]);

  const initApp = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).maybeSingle();
      if (profile) {
        setUserProfile(profile);
        setIsAuthenticated(true);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    initApp();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) initApp();
      else {
        setIsAuthenticated(false);
        setUserProfile(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchData = useCallback(async () => {
    if (!isAuthenticated) return;
    
    const [plansRes, dashRes, totalsRes] = await Promise.all([
      supabase.from('plans').select('*').eq('is_active', true),
      supabase.from('daily_dashboard').select('*').eq('activity_date', selectedDate),
      supabase.from('daily_totals').select('*').eq('activity_date', selectedDate).maybeSingle()
    ]);

    if (plansRes.data) setPlans(plansRes.data);
    setDashboardRows(dashRes.data || []);
    
    if (totalsRes.data) {
      const totalSec = (totalsRes.data as any).total_seconds || 0;
      setBaseDaySeconds(totalSec);
      setDailyTotals(totalsRes.data);
    } else {
      setBaseDaySeconds(0);
      setDailyTotals(null);
    }
  }, [isAuthenticated, selectedDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const recoverActiveSession = async () => {
    if (!isAuthenticated) return;
    const { data } = await supabase
      .from('activity_sessions')
      .select('*')
      .is('end_time', null)
      .order('start_time', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (data) {
      setRunningSession({
        sessionId: data.id,
        planId: data.plan_id,
        activityName: data.activity_name,
        startTime: data.start_time
      });
    }
  };

  useEffect(() => {
    recoverActiveSession();
  }, [isAuthenticated]);

  useEffect(() => {
    if (runningSession && !isHistorical) {
      const startTimestamp = new Date(runningSession.startTime).getTime();
      const update = () => {
        const elapsed = Math.floor((Date.now() - startTimestamp) / 1000);
        setLiveSessionSeconds(Math.max(0, elapsed));
      };
      update();
      timerRef.current = window.setInterval(update, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [runningSession, isHistorical]);

  const stopSession = async (session: RunningSession) => {
    if (!userProfile || isHistorical) return;
    const end = new Date().toISOString();
    setRunningSession(null);
    setLiveSessionSeconds(0);
    await supabase.from('activity_sessions')
      .update({ 
        end_time: end, 
        duration_seconds: Math.floor((new Date(end).getTime() - new Date(session.startTime).getTime()) / 1000)
      })
      .eq('id', session.sessionId);
    fetchData();
  };

  const startSession = async (planId: string, name: string) => {
    if (!userProfile || isHistorical) return;
    if (runningSession) await stopSession(runningSession);
    const start = new Date().toISOString();
    const { data } = await supabase.from('activity_sessions').insert({
      user_id: userProfile.id,
      plan_id: planId,
      activity_name: name,
      activity_date: todayStr,
      start_time: start
    }).select().single();
    if (data) {
      setRunningSession({ 
        sessionId: data.id, 
        planId: planId, 
        activityName: name, 
        startTime: start 
      });
    }
    fetchData();
  };

  const formattedDate = useMemo(() => {
    return new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    });
  }, [selectedDate]);

  if (isLoading) return <div className="min-h-screen bg-[#0B0C10] flex items-center justify-center text-white/30 font-sans text-xs tracking-wide">Syncing your journey...</div>;
  if (!isAuthenticated) return <Login onAuthSuccess={() => initApp()} />;

  return (
    <div className="flex flex-col min-h-screen bg-[#0B0C10] max-w-md mx-auto relative border-x border-white/[0.04] text-white/90 selection:bg-white selection:text-black">
      <header className="px-6 pt-10 pb-6 sticky top-0 bg-[#0B0C10]/80 backdrop-blur-2xl z-30 flex justify-between items-end border-b border-white/[0.02]">
        <div className="space-y-1">
          <h1 className="text-sm font-medium tracking-wide text-white/30">Day Spent Well</h1>
          <p className="text-xl font-medium tracking-tight text-white/90">{formattedDate}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsPickerOpen(true)}
            className="bg-[#12141A] hover:bg-[#181B23] transition-all border border-white/[0.04] rounded-full px-4 py-2 text-xs font-medium text-white/60 flex items-center gap-2"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Calendar
          </button>
          
          <button 
            onClick={() => setIsProfileOpen(true)}
            className="w-10 h-10 rounded-full bg-[#12141A] border border-white/[0.04] flex items-center justify-center text-white/40 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          </button>
        </div>

        <Dialog.Root open={isPickerOpen} onOpenChange={setIsPickerOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="DialogOverlay" />
            <Dialog.Content className="DialogContent focus:outline-none">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <Dialog.Title className="text-xl font-medium tracking-tight text-white">Select a day</Dialog.Title>
                  <Dialog.Close asChild><button className="p-2 text-white/30"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button></Dialog.Close>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-medium uppercase tracking-widest text-white/20">Specific Date</label>
                  <input type="date" value={tempDate} onChange={(e) => setTempDate(e.target.value)} className="w-full bg-[#181B23] border border-white/5 rounded-2xl p-4 text-white outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Dialog.Close asChild><button className="py-4 rounded-2xl bg-white/5 text-white/60 font-medium text-sm">Cancel</button></Dialog.Close>
                  <button onClick={() => { setSelectedDate(tempDate); setIsPickerOpen(false); }} className="py-4 rounded-2xl bg-white text-[#0B0C10] font-medium text-sm">View Day</button>
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        <ProfileMenu 
          isOpen={isProfileOpen} 
          onClose={() => setIsProfileOpen(false)} 
          onNavigate={(screen) => { setCurrentScreen(screen); setIsProfileOpen(false); }}
        />
      </header>

      <main className="flex-1 px-6 pt-4 pb-32 overflow-y-auto no-scrollbar">
        {currentScreen === 'dashboard' && (
          <Dashboard rows={dashboardRows} plans={activePlansForDashboard} totals={dailyTotals} baseDaySeconds={baseDaySeconds} runningSession={runningSession} onStart={startSession} onStop={() => runningSession && stopSession(runningSession)} liveSessionSeconds={liveSessionSeconds} isLoading={isLoading} isHistorical={isHistorical} />
        )}
        {currentScreen === 'plans' && (
          <PlanList plans={plans} onEdit={(p) => { setEditingPlan(p); setCurrentScreen('edit-plan'); }} onAdd={() => { setCurrentScreen('add-plan'); }} onRefresh={fetchData} />
        )}
        {(currentScreen === 'add-plan' || currentScreen === 'edit-plan') && (
          <PlanForm plan={editingPlan} dayType={dayType} allPlans={plans} onCancel={() => { setCurrentScreen('plans'); setEditingPlan(null); }} onSave={() => { fetchData(); setCurrentScreen('plans'); }} />
        )}
        {currentScreen === 'edit-profile' && (
          <ProfileEdit user={userProfile!} onCancel={() => setCurrentScreen('dashboard')} onSave={(updated) => { setUserProfile(updated); setCurrentScreen('dashboard'); }} />
        )}
        {currentScreen === 'reports' && (
          <Reports onBack={() => setCurrentScreen('dashboard')} />
        )}
      </main>

      <Navigation current={currentScreen} onNavigate={setCurrentScreen} />
    </div>
  );
};

export default App;
