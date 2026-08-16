import React from 'react';
import { Lock, UserPlus, LogIn, Sparkles } from 'lucide-react';

interface AuthRequiredCardProps {
  title: string;
  description: string;
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const AuthRequiredCard: React.FC<AuthRequiredCardProps> = ({
  title,
  description,
  onOpenAuth,
}) => {
  return (
    <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto shadow-xs space-y-5 animate-in fade-in duration-300 transition-colors">
      <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
        <Lock className="w-8 h-8" />
      </div>

      <div>
        <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 inline-flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          <span>Akses Memerlukan Akun</span>
        </span>
        <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-2">{title}</h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed max-w-md mx-auto">
          {description}
        </p>
      </div>

      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={() => onOpenAuth('register')}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-sm shadow-emerald-600/20"
        >
          <UserPlus className="w-4 h-4" />
          <span>Daftar Akun Baru</span>
        </button>

        <button
          onClick={() => onOpenAuth('login')}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-slate-100 dark:bg-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition border border-slate-200 dark:border-slate-600"
        >
          <LogIn className="w-4 h-4" />
          <span>Masuk ke Akun</span>
        </button>
      </div>
    </div>
  );
};
