
import React, { useState } from 'react';
import { User } from '../types';
import { supabase } from '../services/supabase';

interface ProfileEditProps {
  user: User;
  onCancel: () => void;
  onSave: (updated: User) => void;
}

const ProfileEdit: React.FC<ProfileEditProps> = ({ user, onCancel, onSave }) => {
  const [name, setName] = useState(user.name);
  const [age, setAge] = useState(user.age?.toString() || '');
  const [profession, setProfession] = useState(user.profession || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const updated: User = {
      ...user,
      name,
      age: age ? parseInt(age) : undefined,
      profession
    };
    const { error } = await supabase.from('users').update({
      name,
      age: age ? parseInt(age) : null,
      profession
    }).eq('id', user.id);
    
    setLoading(false);
    if (!error) onSave(updated);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <button onClick={onCancel} className="p-2 -ml-2 text-white/40 hover:text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg></button>
        <h2 className="text-2xl font-medium tracking-tight">Profile</h2>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-medium uppercase tracking-widest text-white/30 ml-1">Display Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-[#12141A] border border-white/[0.04] rounded-2xl p-4 text-white outline-none focus:border-white/10" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-medium uppercase tracking-widest text-white/30 ml-1">Age</label>
            <input type="number" value={age} onChange={e => setAge(e.target.value)} className="w-full bg-[#12141A] border border-white/[0.04] rounded-2xl p-4 text-white outline-none focus:border-white/10" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-medium uppercase tracking-widest text-white/30 ml-1">Profession</label>
            <input type="text" value={profession} onChange={e => setProfession(e.target.value)} className="w-full bg-[#12141A] border border-white/[0.04] rounded-2xl p-4 text-white outline-none focus:border-white/10" />
          </div>
        </div>
        <div className="pt-8">
          <button type="submit" disabled={loading} className="w-full py-4 bg-white text-[#0B0C10] font-bold rounded-2xl active:scale-95 transition-transform disabled:opacity-50">
            {loading ? 'Saving...' : 'Update Details'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileEdit;
