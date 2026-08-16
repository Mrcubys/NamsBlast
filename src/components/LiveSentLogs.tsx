import React from 'react';
import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Coins,
} from 'lucide-react';
import { SentLog } from '../types';

interface LiveSentLogsProps {
  logs: SentLog[];
  ratePerMessage: number;
}

export const LiveSentLogs: React.FC<LiveSentLogsProps> = ({ logs, ratePerMessage }) => {
  const maskPhone = (phone: string) => {
    if (!phone) return '-';
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.length > 7) {
      return `${clean.slice(0, 4)}****${clean.slice(-3)}`;
    }
    return phone;
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Live Activity Feed Pengiriman
            </h4>
            <p className="text-xs text-slate-500">
              Log pengiriman pesan real-time dari bot WhatsApp yang aktif
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Live Real-Time</span>
        </div>
      </div>

      {logs.length > 0 ? (
        <div className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto pr-1">
          {logs.map((log) => {
            const isSuccess = log.status === 'SUCCESS';
            return (
              <div
                key={log.id}
                className="py-2.5 px-2 flex items-center justify-between gap-3 hover:bg-slate-50 transition rounded-xl"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                      isSuccess
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                        : 'bg-rose-50 text-rose-600 border-rose-200'
                    }`}
                  >
                    {isSuccess ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-slate-800">
                        {maskPhone(log.phone)}
                      </span>
                      <span className="text-xs text-slate-500 truncate hidden sm:inline">
                        ({log.contactName || 'Pelanggan'})
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5 flex items-center space-x-1.5">
                      <span>Via {log.botPhone ? `Bot ${maskPhone(log.botPhone)}` : 'WhatsApp Bot'}</span>
                      <span>•</span>
                      <span className="truncate max-w-[140px] sm:max-w-xs">{log.templateTitle || 'Template Pesan'}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {isSuccess ? (
                    <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                      <Coins className="w-3 h-3 text-emerald-600" />
                      <span>+Rp {log.earningAdded || ratePerMessage}</span>
                    </div>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200">
                      Gagal
                    </span>
                  )}
                  <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-end space-x-1">
                    <Clock className="w-2.5 h-2.5" />
                    <span>
                      {new Date(log.timestamp).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <Activity className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <div className="text-xs font-bold text-slate-700">Belum Ada Aktivitas Blast</div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Log pengiriman akan muncul secara otomatis saat bot Anda mulai mengirim pesan.
          </p>
        </div>
      )}
    </div>
  );
};
