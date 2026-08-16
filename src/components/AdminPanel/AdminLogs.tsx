import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle2, XCircle, Search, Download, RefreshCw } from 'lucide-react';
import { ApiService } from '../../services/api';
import { SentLog } from '../../types';

export const AdminLogs: React.FC = () => {
  const [logs, setLogs] = useState<SentLog[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await ApiService.getLiveLogs(150);
      setLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = logs.filter((log) => {
    if (filter !== 'ALL' && log.status !== filter) return false;
    if (search) {
      const query = search.toLowerCase();
      return (
        log.phone.toLowerCase().includes(query) ||
        (log.contactName && log.contactName.toLowerCase().includes(query)) ||
        (log.botPhone && log.botPhone.toLowerCase().includes(query))
      );
    }
    return true;
  });

  const handleExportCSV = () => {
    let csv = 'ID,Phone,Name,Status,BotPhone,Template,EarningAdded,Timestamp\n';
    filtered.forEach((l) => {
      csv += `"${l.id}","${l.phone}","${l.contactName || ''}","${l.status}","${l.botPhone || ''}","${l.templateTitle || ''}","${l.earningAdded || 0}","${l.timestamp}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `namsblast_logs_${Date.now()}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Activity className="w-5 h-5 text-emerald-600" />
              <span>Log Transaksi Blast Global ({logs.length})</span>
            </h3>
            <p className="text-xs text-slate-500">
              Riwayat pengiriman real-time seluruh bot WhatsApp di platform NamsBlast.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={loadLogs}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition flex items-center space-x-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            {['ALL', 'SUCCESS', 'FAILED'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  filter === f
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nomor kontak / bot..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 w-full sm:w-60"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[10px] border-y border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Tujuan (Kontak)</th>
                <th className="py-2.5 px-3">Bot Pengirim</th>
                <th className="py-2.5 px-3">Template Pesan</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Earning User</th>
                <th className="py-2.5 px-3 text-right">Waktu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-2.5 px-3">
                    <div className="font-mono font-bold text-slate-900">{log.phone}</div>
                    {log.contactName && (
                      <div className="text-[10px] text-slate-500">{log.contactName}</div>
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-600 text-[11px]">
                    {log.botPhone || '-'}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 truncate max-w-xs">
                    {log.templateTitle || '-'}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {log.status === 'SUCCESS' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Terkirim
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <XCircle className="w-3 h-3 mr-1" /> Gagal
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                    +Rp {(log.earningAdded || 0).toLocaleString('id-ID')}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-500 text-[11px]">
                    {new Date(log.timestamp).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Belum ada log pengiriman yang tercatat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
