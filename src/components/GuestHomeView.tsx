import React from 'react';
import {
  Smartphone,
  Coins,
  Zap,
  ArrowRight,
  UserPlus,
  LogIn,
  CheckCircle2,
  Sparkles,
  Users,
} from 'lucide-react';
import { DashboardStats, SystemSettings } from '../types';

interface GuestHomeViewProps {
  stats: DashboardStats | null;
  settings: SystemSettings | null;
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const GuestHomeView: React.FC<GuestHomeViewProps> = ({
  stats,
  settings,
  onOpenAuth,
}) => {
  const ratePerMessage = settings?.ratePerMessage || stats?.ratePerMessage || 50;
  const minWithdraw = settings?.minWithdraw || 20000;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Hero Landing Banner */}
      <div className="relative rounded-3xl bg-linear-to-br from-emerald-900 via-emerald-800 to-slate-900 text-white p-6 sm:p-10 shadow-xl overflow-hidden">
        {/* Background glow accents */}
        <div className="absolute -right-12 -top-12 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -bottom-16 w-64 h-64 bg-teal-400/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>Platform WhatsApp Blasting &amp; Penghasil Saldo Otomatis</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            Hubungkan WhatsApp Anda, <br />
            <span className="text-emerald-300 underline decoration-emerald-400/40 decoration-wavy">
              Hasilkan Pendapatan Pasif
            </span>{' '}
            Tiap Detik!
          </h1>

          <p className="text-slate-200 text-xs sm:text-base leading-relaxed max-w-2xl font-normal">
            NamsBlast menghubungkan nomor WhatsApp Anda ke antrian pesan resmi kami. Anda mendapatkan{' '}
            <strong className="text-white font-bold">Rp {ratePerMessage} per pesan terkirim</strong> secara otomatis
            langsung ke saldo Anda, siap ditarik ke Rekening Bank atau E-Wallet (DANA, OVO, GoPay, ShopeePay).
          </p>

          {/* Call To Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              id="btn-guest-register-hero"
              onClick={() => onOpenAuth('register')}
              className="flex items-center justify-center space-x-2 px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm transition shadow-lg shadow-emerald-500/30 active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>Daftar Akun Baru (Gratis)</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <button
              id="btn-guest-login-hero"
              onClick={() => onOpenAuth('login')}
              className="flex items-center justify-center space-x-2 px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition border border-white/20 backdrop-blur-xs active:scale-95"
            >
              <LogIn className="w-4 h-4" />
              <span>Sudah Punya Akun? Masuk</span>
            </button>
          </div>

          {/* Quick Perks */}
          <div className="pt-4 flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-emerald-100 font-medium">
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Pendaftaran Gratis &amp; Instan</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Min Penarikan Rp {minWithdraw.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Enkripsi Aman &amp; Anti-Ban Dispatched</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Platform Live Metrics Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>Antrian Kontak Live</span>
            <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-2 font-mono">
            {(stats?.globalContactsAvailable || 0).toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-400 mt-1">Siap dikirim sekarang</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>Komisi Per Pesan</span>
            <Coins className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-2 font-mono">
            Rp {ratePerMessage} <span className="text-xs font-normal text-slate-400 dark:text-slate-400 font-sans">/sms</span>
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-400 mt-1">Otomatis masuk dompet</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>Bot WA Terhubung</span>
            <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-2 font-mono">
            {stats?.globalOnlineBots || 0}{' '}
            <span className="text-xs font-normal text-slate-400 dark:text-slate-400 font-sans">
              / {stats?.globalTotalBots || 0} bot
            </span>
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-400 mt-1">Multi-session aktif</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>Total Terkirim</span>
            <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-2 font-mono">
            {(stats?.globalContactsSent || 0).toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-400 mt-1">Pesan berhasil diblast</div>
        </div>
      </div>

      {/* 3. Cara Kerja (3 Langkah Cepat) */}
      <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="text-center max-w-xl mx-auto">
          <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Sangat Mudah
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-2">
            Cara Kerja NamsBlast dalam 3 Langkah
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Tidak butuh keahlian teknis khusus, cukup ikuti langkah mudah berikut ini:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-3 relative">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-black text-base flex items-center justify-center shadow-md shadow-emerald-600/20">
              1
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Daftar Akun Pengguna</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Buat akun NamsBlast gratis hanya dalam hitungan detik. Cukup isi nama, email, dan password Anda.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-3 relative">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-black text-base flex items-center justify-center shadow-md shadow-emerald-600/20">
              2
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Hubungkan WhatsApp</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Pindai QR Code atau gunakan Kode Pairing 8-digit dari WhatsApp di smartphone Anda ke sistem kami yang aman.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-3 relative">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-black text-base flex items-center justify-center shadow-md shadow-emerald-600/20">
              3
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Mulai &amp; Tarik Saldo</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Pilih kecepatan pengiriman lalu klik tombol Mulai. Saldo Anda akan bertambah secara otomatis setiap detik pesan sukses terkirim.
            </p>
          </div>
        </div>

        {/* Action Bar inside How It Works */}
        <div className="pt-2 text-center">
          <button
            onClick={() => onOpenAuth('register')}
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-sm shadow-emerald-600/20"
          >
            <UserPlus className="w-4 h-4" />
            <span>Mulai Sekarang &mdash; Daftar Gratis</span>
          </button>
        </div>
      </div>
    </div>
  );
};
