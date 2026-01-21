
import React from 'react';

interface NavigationProps {
  current: string;
  onNavigate: (screen: 'dashboard' | 'plans') => void;
}

const Navigation: React.FC<NavigationProps> = ({ current, onNavigate }) => {
  return (
    <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-[340px] bg-[#12141A]/90 backdrop-blur-3xl border border-white/[0.04] p-2 rounded-full z-50 flex justify-between items-center shadow-2xl">
      <button 
        onClick={() => onNavigate('dashboard')}
        className={`flex-1 py-3 rounded-full flex flex-col items-center gap-1.5 transition-all duration-300 active:scale-95 ${current === 'dashboard' ? 'bg-[#1E2230] text-white' : 'text-white/30'}`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-[9px] font-bold uppercase tracking-widest">Dash</span>
      </button>

      <button 
        onClick={() => onNavigate('plans')}
        className={`flex-1 py-3 rounded-full flex flex-col items-center gap-1.5 transition-all duration-300 active:scale-95 ${current.includes('plan') ? 'bg-[#1E2230] text-white' : 'text-white/30'}`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <span className="text-[9px] font-bold uppercase tracking-widest">Plans</span>
      </button>

      <button 
        className="flex-1 py-3 rounded-full flex flex-col items-center gap-1.5 text-white/10 transition-all duration-300 active:scale-95 hover:text-red-400"
        onClick={() => {
          import('../services/supabase').then(({ supabase }) => supabase.auth.signOut());
        }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        <span className="text-[9px] font-bold uppercase tracking-widest text-white/10">Out</span>
      </button>
    </nav>
  );
};

export default Navigation;
