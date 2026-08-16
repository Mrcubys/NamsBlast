import React, { useState } from 'react';
import {
  Smartphone,
  Gauge,
  Trash2,
  Play,
  Pause,
  RefreshCw,
  Zap,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { Bot, BotSpeed } from '../types';

interface BotCardProps {
  bot: Bot;
  onSpeedChange: (botId: string, speed: BotSpeed) => void;
  onStart: (botId: string, speed: BotSpeed) => void;
  onStop: (botId: string) => void;
  onReconnect: (botId: string) => void;
  onDelete: (botId: string) => void;
  ratePerMessage?: number;
}

export const BotCard: React.FC<BotCardProps> = ({
  bot,
  onSpeedChange,
  onStart,
  onStop,
  onReconnect,
  onDelete,
  ratePerMessage = 50,
}) => {
  const [selectedSpeed, setSelectedSpeed] = useState<BotSpeed>(bot.speed || 'FAST');
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isOnline = bot.status === 'ONLINE';
  const isRunning = isOnline && Boolean(bot.isRunning);

  const formatPhone = (phone: string) => {
    if (!phone) return '-';
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('62')) {
      return `+62 ${clean.slice(2, 5)}-${clean.slice(5, 9)}-${clean.slice(9)}`;
    }
    return phone;
  };

  const handleSpeedSelect = (speed: BotSpeed) => {
    setSelectedSpeed(speed);
    onSpeedChange(bot.id, speed);
  };

  const handleToggleStartStop = async () => {
    setIsActionLoading(true);
    try {
      if (isRunning) {
        await onStop(bot.id);
      } else {
        await onStart(bot.id, selectedSpeed);
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReconnectClick = async () => {
    setIsActionLoading(true);
    try {
      await onReconnect(bot.id);
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div
      id={`bot-card-${bot.id}`}
      className={`relative rounded-2xl p-5 border transition-all duration-200 bg-white dark:bg-slate-800/90 flex flex-col justify-between ${
        isRunning
          ? 'border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
          : isOnline
          ? 'border-emerald-200 dark:border-emerald-800 shadow-xs hover:shadow-md'
          : 'border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-850 shadow-xs'
      }`}
    >
      <div>
        {/* Top row: WA Icon, Name, Phone & Status Badge */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center space-x-3 min-w-0">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 ${
                isRunning
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : isOnline
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.53 1.771.815 2.791.815 3.18 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.767-5.768-5.768zm3.374 8.163c-.144.405-.837.774-1.17.824-.312.045-.718.067-2.33-.598-1.933-.799-3.167-2.778-3.262-2.905-.096-.128-.778-1.034-.778-1.972 0-.938.492-1.398.667-1.589.175-.19.382-.239.509-.239.127 0 .254.001.365.006.118.005.276-.045.431.328.159.381.54 1.317.587 1.413.048.095.079.206.016.333-.064.127-.095.206-.191.317-.095.111-.2.248-.286.333-.095.096-.195.2-.084.39.111.19.493.813 1.058 1.316.726.647 1.339.847 1.53.942.19.095.302.079.413-.048.111-.127.476-.556.603-.746.127-.19.254-.159.429-.095.175.064 1.111.524 1.302.619.19.095.317.143.365.222.048.079.048.46-.096.865z" />
                <path d="M12 2C6.477 2 2 6.477 2 12c0 1.891.526 3.66 1.438 5.176L2 22l4.981-1.398A9.957 9.957 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.2a8.17 8.17 0 0 1-4.322-1.228l-.31-.184-2.96.83.845-2.887-.202-.321A8.175 8.175 0 0 1 3.8 12c0-4.522 3.678-8.2 8.2-8.2 4.521 0 8.2 3.678 8.2 8.2 0 4.522-3.679 8.2-8.2 8.2z" />
              </svg>
            </div>

            <div className="min-w-0">
              <h4 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base tracking-tight truncate">
                {bot.name}
              </h4>
              <div className="text-xs text-slate-600 dark:text-slate-400 font-mono font-medium truncate">
                {formatPhone(bot.phone)}
              </div>
            </div>
          </div>

          {/* Clean Status Pill */}
          <div className="shrink-0">
            {isRunning ? (
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-600 text-white shadow-xs">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span>AKTIF BERJALAN</span>
              </div>
            ) : isOnline ? (
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>ONLINE (SIAP)</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span>TERPUTUS</span>
              </div>
            )}
          </div>
        </div>

        {/* Middle Stats Grid */}
        <div className="grid grid-cols-2 gap-2 mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80">
          <div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              Pesan Terkirim
            </div>
            <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white mt-0.5">
              {(bot.totalSent || 0).toLocaleString('id-ID')}
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold ml-1">
                (+Rp {((bot.totalSent || 0) * ratePerMessage).toLocaleString('id-ID')})
              </span>
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              Gagal / Timeout
            </div>
            <div className="text-sm sm:text-base font-black text-slate-600 dark:text-slate-400 mt-0.5">
              {bot.totalFailed || 0}
            </div>
          </div>
        </div>

        {/* Speed Selector */}
        <div className="mt-3.5 flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-1.5 text-xs text-slate-700 dark:text-slate-300 font-bold">
            <Gauge className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Kecepatan:</span>
          </div>
          <select
            value={selectedSpeed}
            onChange={(e) => handleSpeedSelect(e.target.value as BotSpeed)}
            className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden"
          >
            <option value="SUPER_FAST">Super Fast (3 detik)</option>
            <option value="FAST">Fast (7 detik - Disarankan)</option>
            <option value="SLOW">Slow (15 detik)</option>
            <option value="SUPER_SLOW">Super Slow (30 detik)</option>
          </select>
        </div>
      </div>

      {/* Bottom Action Controls */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between gap-2">
        {/* Main Action Button */}
        {isOnline ? (
          isRunning ? (
            <button
              id={`btn-stop-bot-${bot.id}`}
              onClick={handleToggleStartStop}
              disabled={isActionLoading}
              className="flex-1 py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center space-x-1.5 shadow-xs"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Jeda Pengiriman</span>
            </button>
          ) : (
            <button
              id={`btn-start-bot-${bot.id}`}
              onClick={handleToggleStartStop}
              disabled={isActionLoading}
              className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-700/20"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Mulai Kirim</span>
            </button>
          )
        ) : (
          <button
            id={`btn-reconnect-bot-${bot.id}`}
            onClick={handleReconnectClick}
            disabled={isActionLoading}
            className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center space-x-1.5 shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sambungkan Ulang</span>
          </button>
        )}

        {/* Delete Bot Button */}
        <button
          id={`btn-delete-bot-${bot.id}`}
          onClick={() => setShowDeleteConfirm(true)}
          className="p-2.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl transition border border-transparent hover:border-red-200 dark:hover:border-red-800"
          title="Putuskan &amp; Hapus WhatsApp"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl p-5 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center">
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Putuskan &amp; Hapus Akun?</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Koneksi sesi WhatsApp <span className="font-semibold text-slate-800 dark:text-slate-200">{bot.name}</span> akan otomatis diputus dan dihapus dari sistem.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="button"
                id={`btn-confirm-delete-${bot.id}`}
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onDelete(bot.id);
                }}
                className="py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition shadow-xs"
              >
                Hapus Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
