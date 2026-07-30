import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Truck, LogOut, User, ShieldCheck } from 'lucide-react';

export default function DashboardPage({ onShowToast }) {
  const { dbUser, currentUser, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      onShowToast('info', 'Signed Out', 'You have been logged out.');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      {/* Header Bar */}
      <header className="max-w-6xl mx-auto flex items-center justify-between py-4 px-6 glass-card rounded-2xl mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center shadow-md">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100">Fleet<span className="text-brand-500">Guard</span></h1>
            <p className="text-xs text-slate-400">Fleet Management System</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors"
        >
          <LogOut className="w-4 h-4 text-slate-400" />
          <span>Sign Out</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto space-y-6">
        <div className="glass-card rounded-3xl p-8 animate-page-enter">
          <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-semibold mb-3">
                <ShieldCheck className="w-3.5 h-3.5" />
                Authenticated Session
              </div>
              <h2 className="text-2xl font-bold text-slate-100">
                Welcome, {dbUser?.full_name || currentUser?.displayName || 'User'}!
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Your account is connected to Supabase PostgreSQL and Firebase Authentication.
              </p>
            </div>

            <div className="px-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-400 font-mono">
              Role: <span className="text-brand-400 font-semibold">{dbUser?.role || 'Driver'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-800/80">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs text-slate-500 font-medium">Email</span>
              <p className="text-sm font-semibold text-slate-200 mt-1 truncate">{currentUser?.email || dbUser?.email || 'N/A'}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs text-slate-500 font-medium">Firebase UID</span>
              <p className="text-xs font-mono font-semibold text-slate-300 mt-1 truncate">{currentUser?.uid || 'N/A'}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs text-slate-500 font-medium">Supabase User ID</span>
              <p className="text-xs font-mono font-semibold text-brand-400 mt-1 truncate">{dbUser?.id || 'Synced'}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
