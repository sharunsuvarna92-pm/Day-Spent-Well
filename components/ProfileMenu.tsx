
import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { supabase } from '../services/supabase';

interface ProfileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (screen: 'edit-profile' | 'reports') => void;
}

const ProfileMenu: React.FC<ProfileMenuProps> = ({ isOpen, onClose, onNavigate }) => {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    onClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="DialogOverlay" />
        <Dialog.Content className="DialogContent">
          {/* Accessible Title (Visually Hidden via utility class or minimal styling) */}
          <Dialog.Title className="sr-only text-white mb-4 text-lg font-medium">
            Account Options
          </Dialog.Title>
          
          <div className="space-y-2">
            <button 
              onClick={() => onNavigate('edit-profile')}
              className="w-full text-left py-5 px-6 rounded-2xl bg-white/[0.03] text-white/90 font-medium flex items-center justify-between active:bg-white/[0.06] transition-colors"
            >
              <span>Edit Profile</span>
              <svg className="w-4 h-4 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
            </button>
            <button 
              onClick={() => onNavigate('reports')}
              className="w-full text-left py-5 px-6 rounded-2xl bg-white/[0.03] text-white/90 font-medium flex items-center justify-between active:bg-white/[0.06] transition-colors"
            >
              <span>Reports</span>
              <svg className="w-4 h-4 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
            </button>
            <div className="pt-4">
              <button 
                onClick={handleSignOut}
                className="w-full py-5 px-6 rounded-2xl bg-red-500/10 text-red-400 font-bold active:bg-red-500/20 transition-colors"
              >
                Sign Out
              </button>
            </div>
            <Dialog.Close asChild>
              <button className="w-full py-4 text-white/20 text-xs font-medium uppercase tracking-widest mt-2">Close</button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default ProfileMenu;
