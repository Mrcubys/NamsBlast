import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Gauge,
  Coins,
  Wallet,
  AlertTriangle,
  Save,
  CheckCircle2,
  Lock,
  Key,
  Shield,
} from 'lucide-react';
import { ApiService } from '../../services/api';
import { SystemSettings } from '../../types';

interface AdminSettingsProps {
  settings: SystemSettings | null;
  onSettingsSaved: (updated: SystemSettings) => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({
  settings,
  onSettingsSaved,
}) => {
  const [formData, setFormData] = useState<SystemSettings>({
    ratePerMessage: 50,
    rateReferralPerMessage: 10,
    delaySuperFast: 3,
    delayFast: 7,
    delaySlow: 15,
    delaySuperSlow: 30,
    minWithdraw: 20000,
    maxWithdraw: 2000000,
    emptyContactMessage:
      'Kontak sedang habis saat ini. Mohon tunggu terlebih dahulu sampai admin melakukan pengisian ulang kontak. Terima kasih atas kesabaran Anda.',
    autoBlastEnabled: true,
  });

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Admin Password Change State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [passFeedback, setPassFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      const updated = await ApiService.updateSettingsAdmin(formData);
      setFeedback('Pengaturan sistem NamsBlast berhasil diperbarui & disimpan!');
      onSettingsSaved(updated);
    } catch (err: any) {
      setFeedback(err.message || 'Gagal menyimpan pengaturan');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassFeedback(null);

    if (newPassword !== confirmNewPassword) {
      setPassFeedback({ type: 'error', message: 'Konfirmasi password baru tidak cocok!' });
      return;
    }

    if (newPassword.length < 6) {
      setPassFeedback({ type: 'error', message: 'Password baru minimal 6 karakter!' });
      return;
    }

    setPassLoading(true);
    try {
      const res = await ApiService.changeAdminPassword(oldPassword, newPassword);
      setPassFeedback({ type: 'success', message: res.message || 'Password Master Admin berhasil diperbarui!' });
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      setPassFeedback({ type: 'error', message: err.message || 'Gagal memperbarui password admin.' });
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Feedback Alert */}
        {feedback && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>{feedback}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-xs font-bold opacity-70"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Grid: 2 Main Settings Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Section 1: Earning Rates & Withdraw Limits */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 text-emerald-700">
              <Coins className="w-5 h-5" />
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Pengaturan Tarif Saldo &amp; Komisi (IDR)
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Nilai bayaran flat per pesan berhasil untuk pemilik bot dan komisi referral upline.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Rate Bayaran Bot Owner (per pesan)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">Rp</span>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.ratePerMessage}
                    onChange={(e) => setFormData({ ...formData, ratePerMessage: Number(e.target.value) })}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono font-bold text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Komisi Referral Upline (per pesan)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">Rp</span>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.rateReferralPerMessage}
                    onChange={(e) => setFormData({ ...formData, rateReferralPerMessage: Number(e.target.value) })}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono font-bold text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 mb-2">Batas Minimum &amp; Maksimum Penarikan</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Minimal Penarikan (IDR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">Rp</span>
                    <input
                      type="number"
                      required
                      min={1000}
                      value={formData.minWithdraw}
                      onChange={(e) => setFormData({ ...formData, minWithdraw: Number(e.target.value) })}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono font-bold text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Maksimal Penarikan (IDR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">Rp</span>
                    <input
                      type="number"
                      required
                      min={10000}
                      value={formData.maxWithdraw}
                      onChange={(e) => setFormData({ ...formData, maxWithdraw: Number(e.target.value) })}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono font-bold text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Delay Deliberate Protection */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 text-emerald-700">
              <Gauge className="w-5 h-5" />
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Pengaturan Jeda Kecepatan Delay (Detik)
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Mengatur jeda waktu pengiriman per bot untuk melindungi nomor dari auto-ban WhatsApp.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Super Fast (detik)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={formData.delaySuperFast}
                  onChange={(e) => setFormData({ ...formData, delaySuperFast: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono font-bold text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Fast (detik)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={formData.delayFast}
                  onChange={(e) => setFormData({ ...formData, delayFast: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono font-bold text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Slow (detik)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={formData.delaySlow}
                  onChange={(e) => setFormData({ ...formData, delaySlow: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono font-bold text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Super Slow (detik)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={formData.delaySuperSlow}
                  onChange={(e) => setFormData({ ...formData, delaySuperSlow: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono font-bold text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Notification Message when contacts are empty */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 text-amber-600">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Teks Banner Ketersediaan Kontak Habis
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Pesan ini akan tampil di dashboard pengguna secara otomatis saat total sisa antrian kontak pending habis (0 nomor).
          </p>

          <textarea
            rows={3}
            required
            value={formData.emptyContactMessage}
            onChange={(e) => setFormData({ ...formData, emptyContactMessage: e.target.value })}
            className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-emerald-500 leading-relaxed font-sans"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition shadow-sm shadow-emerald-600/20 disabled:opacity-50 flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Menyimpan...' : 'Simpan Semua Pengaturan'}</span>
          </button>
        </div>
      </form>

      {/* Section 4: Master Admin Password Management */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 text-slate-900">
          <Shield className="w-5 h-5 text-emerald-600" />
          <h3 className="text-sm sm:text-base font-bold text-slate-900">
            Ganti Password Master Admin Panel
          </h3>
        </div>
        <p className="text-xs text-slate-500">
          Ubah password otorisasi yang digunakan untuk membuka halaman Master Admin NamsBlast.
        </p>

        {passFeedback && (
          <div
            className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
              passFeedback.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            <span>{passFeedback.message}</span>
            <button
              type="button"
              onClick={() => setPassFeedback(null)}
              className="text-[11px] font-bold opacity-75 ml-2"
            >
              Tutup
            </button>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Password Lama
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="Password saat ini"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-emerald-500 font-sans"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Password Baru
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="Minimal 6 karakter"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-emerald-500 font-sans"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Konfirmasi Password Baru
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="Ulangi password baru"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-emerald-500 font-sans"
              />
            </div>
          </div>

          <div className="sm:col-span-3 flex justify-end pt-2">
            <button
              type="submit"
              disabled={passLoading || !oldPassword || !newPassword}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow-sm disabled:opacity-50 flex items-center space-x-2"
            >
              <Key className="w-3.5 h-3.5" />
              <span>{passLoading ? 'Mengupdate Password...' : 'Perbarui Password Admin'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
