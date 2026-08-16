import React from 'react';
import {
  Zap,
  Users,
  Database,
  Radio,
  Clock,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  ArrowRight,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { DashboardStats, SystemSettings, Bot } from '../../types';

interface AdminOverviewProps {
  stats: DashboardStats | null;
  settings: SystemSettings | null;
  bots: Bot[];
  onToggleAutoBlast: (enabled: boolean) => void;
  onNavigateTab?: (tab: string) => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({
  stats,
  settings,
  bots = [],
  onToggleAutoBlast,
  onNavigateTab,
}) => {
  const isAutoBlastOn = settings?.autoBlastEnabled ?? true;

  return (
    <div className="space-y-6">
      {/* Master Queue Control Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-emerald-50/80 p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start space-x-4">
            <div
              className={`p-3.5 rounded-2xl border shrink-0 ${
                isAutoBlastOn
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm shadow-emerald-600/20'
                  : 'bg-amber-100 text-amber-800 border-amber-300'
              }`}
            >
              <Zap className="w-7 h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold tracking-wide uppercase border ${
                    isAutoBlastOn
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}
                >
                  {isAutoBlastOn ? 'Queue Engine: RUNNING' : 'Queue Engine: PAUSED'}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  Multi-Bot Baileys Dispatcher
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
                NamsBlast Master Command Center
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Sistem otomatis membagi antrian kontak pending ke seluruh bot pengguna yang online dengan jeda delay sesuai pilihan masing-masing bot.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0 self-start md:self-center">
            <button
              id="btn-toggle-auto-blast"
              onClick={() => onToggleAutoBlast(!isAutoBlastOn)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition shadow-xs ${
                isAutoBlastOn
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
              }`}
            >
              {isAutoBlastOn ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Jeda Mesin Blast</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Aktifkan Mesin Blast</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 4 Core Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Contacts in queue */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Sisa Kontak Antrian
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-mono">
            {(stats?.globalContactsAvailable ?? 0).toLocaleString('id-ID')}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500">Total Database:</span>
            <span className="font-bold text-slate-800">{(stats?.contactsTotal ?? 0).toLocaleString('id-ID')} nomor</span>
          </div>
        </div>

        {/* Metric 2: Online Bots */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Armada Bot Online
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700 mt-2 font-mono">
            {stats?.globalOnlineBots ?? 0} <span className="text-sm font-normal text-slate-500">/ {stats?.globalTotalBots ?? 0} bot</span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500">Total Pengguna:</span>
            <span className="font-bold text-slate-800">{stats?.totalUsersCount ?? 0} member</span>
          </div>
        </div>

        {/* Metric 3: Total Sent Messages */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pesan Berhasil Terkirim
            </span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600 border border-teal-200">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-mono">
            {(stats?.contactsSent ?? 0).toLocaleString('id-ID')}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500">Rate User:</span>
            <span className="font-bold text-emerald-700 font-mono">Rp {stats?.ratePerMessage ?? 50}/pesan</span>
          </div>
        </div>

        {/* Metric 4: Pending Withdrawals */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pending Withdraw
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-700 mt-2 font-mono">
            {stats?.pendingWithdrawCount ?? 0} <span className="text-sm font-normal text-slate-500">permintaan</span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
            {onNavigateTab ? (
              <button
                onClick={() => onNavigateTab('withdrawals')}
                className="text-emerald-700 font-bold hover:underline flex items-center space-x-1"
              >
                <span>Proses Sekarang</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            ) : (
              <span className="text-slate-400">Persetujuan WD</span>
            )}
          </div>
        </div>
      </div>

      {/* Online Bots Fleet Quick Table */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Status Armada Bot Pengguna Terhubung
            </h3>
            <p className="text-xs text-slate-500">
              Daftar sesi bot yang siap / sedang mengeksekusi blast kontak
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            {bots.filter((b) => b.status === 'ONLINE').length} Aktif
          </span>
        </div>

        {bots.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Nama Bot</th>
                  <th className="py-2.5 px-3">Nomor WhatsApp</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Kecepatan</th>
                  <th className="py-2.5 px-3">Terkirim</th>
                  <th className="py-2.5 px-3">Tugas Saat Ini</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bots.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 font-bold text-slate-800">{b.name}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{b.phone}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          b.status === 'ONLINE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            b.status === 'ONLINE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                          }`}
                        />
                        <span>{b.status}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-700">{b.speed}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 font-mono">
                      {(b.totalSent || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 truncate max-w-xs">
                      {b.currentTask || 'Idle (Menunggu antrian)'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-slate-500 text-xs">
            Belum ada nomor WhatsApp bot yang terhubung ke sistem.
          </div>
        )}
      </div>
    </div>
  );
};
