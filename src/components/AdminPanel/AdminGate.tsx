import React, { useState } from 'react';
import { Shield, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import { ApiService } from '../../services/api';

interface AdminGateProps {
  onUnlock: () => void;
  onBackToUser: () => void;
}

export const AdminGate: React.FC<AdminGateProps> = ({ onUnlock, onBackToUser }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await ApiService.verifyAdminGate(password);
      sessionStorage.setItem('namsblast_admin_session_auth', 'unlocked_2026');
      onUnlock();
    } catch (err: any) {
      setError(err.message || 'Password Master Admin salah. Akses otorisasi ditolak.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-xl p-6 sm:p-8 relative overflow-hidden">
        {/* Top green accent strip */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600" />

        {/* Security Badge Icon */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm mb-4">
            <Shield className="w-8 h-8" />
          </div>

          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-extrabold uppercase tracking-wider mb-2">
            <Lock className="w-3 h-3" />
            <span>Restricted Admin Portal</span>
          </div>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            NamsBlast Master Admin
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
            Halaman ini khusus untuk administrator sistem. Masukkan kunci otorisasi master untuk melanjutkan.
          </p>
        </div>

        {error && (
          <div className="flex items-center space-x-2.5 p-3.5 mb-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Password Master Admin
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoFocus
                placeholder="Masukkan password admin..."
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                className="w-full pl-4 pr-11 py-3 rounded-xl bg-slate-50 border border-slate-300 focus:border-emerald-500 focus:bg-white focus:outline-none text-slate-900 text-sm placeholder:text-slate-400 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition"
                title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Akses panel admin dienkripsi dan diproteksi ketat.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition shadow-md shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <span>Memverifikasi Otorisasi...</span>
            ) : (
              <>
                <span>Buka Panel Admin</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center">
          <button
            onClick={onBackToUser}
            className="flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Beranda Pengguna</span>
          </button>
        </div>
      </div>
    </div>
  );
};
