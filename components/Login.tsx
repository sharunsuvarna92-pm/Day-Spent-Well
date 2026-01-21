
import React, { useState } from 'react';
import { supabase } from '../services/supabase';

interface LoginProps {
  onAuthSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onAuthSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [profession, setProfession] = useState('');
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegistering) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("Signup failed.");

        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            name,
            email,
            age: age ? parseInt(age) : null,
            profession: profession || null
          });

        if (profileError) {
          console.error("Profile creation error:", profileError);
          throw new Error("Account created but profile setup failed.");
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (signInError) throw signInError;
      }

      onAuthSuccess();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8 bg-[#0B0C10] text-white/90 max-w-md mx-auto">
      <div className="w-full space-y-8 py-12">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#12141A] border border-white/[0.04] rounded-2xl mx-auto mb-6 flex items-center justify-center">
            <div className="w-8 h-8 bg-white/90 rounded-full"></div>
          </div>
          <h1 className="text-3xl font-medium tracking-tight text-white/90">Day Spent Well</h1>
          <p className="text-white/40 mt-2 font-light">
            {isRegistering ? 'Start your journey to a balanced life.' : 'Reflective time tracking for a life lived well.'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-400/10 border border-red-400/20 rounded-xl text-red-400 text-xs text-center font-medium">
              {error}
            </div>
          )}

          {isRegistering && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div>
                <label className="block text-xs font-medium text-white/20 uppercase tracking-widest mb-1 ml-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#12141A] border border-white/[0.06] rounded-xl p-3 focus:outline-none focus:border-white/10 text-white placeholder-white/20"
                  placeholder="John Doe"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-white/20 uppercase tracking-widest mb-1 ml-1">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#12141A] border border-white/[0.06] rounded-xl p-3 focus:outline-none focus:border-white/10 text-white placeholder-white/20"
              placeholder="name@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/20 uppercase tracking-widest mb-1 ml-1">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#12141A] border border-white/[0.06] rounded-xl p-3 focus:outline-none focus:border-white/10 text-white placeholder-white/20"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-white text-[#0B0C10] font-medium py-3 rounded-xl hover:opacity-90 transition-opacity active:scale-95 disabled:opacity-50 mt-4"
          >
            {loading ? 'Entering...' : (isRegistering ? 'Begin Journey' : 'Step In')}
          </button>
        </form>

        <button 
          onClick={() => setIsRegistering(!isRegistering)}
          className="w-full text-sm text-white/30 hover:text-white/80 transition-colors font-light"
        >
          {isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  );
};

export default Login;
