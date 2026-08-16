import React, { useState, useEffect } from 'react';
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  RotateCcw,
  Check,
  AlertCircle,
  FileCode,
  Table,
  Search,
  Users,
  Smartphone,
  FileSpreadsheet,
  MessageSquare,
  Wallet,
  Megaphone,
  Sliders,
  CheckCircle2,
  HardDrive,
  Clock,
  Eye,
  Copy,
} from 'lucide-react';
import { ApiService } from '../../services/api';

interface AdminDatabaseProps {
  onRefreshStats?: () => void;
}

type TableKey =
  | 'users'
  | 'bots'
  | 'contacts'
  | 'templates'
  | 'sentLogs'
  | 'withdrawRequests'
  | 'announcements'
  | 'settings'
  | 'chatMessages';

export const AdminDatabase: React.FC<AdminDatabaseProps> = ({ onRefreshStats }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any | null>(null);
  const [summary, setSummary] = useState<any | null>(null);
  const [activeTable, setActiveTable] = useState<TableKey>('users');
  const [viewMode, setViewMode] = useState<'table' | 'raw'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [rawJsonText, setRawJsonText] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadDatabase();
  }, []);

  const loadDatabase = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await ApiService.getRawDatabase();
      setData(res.database);
      setSummary(res.summary);
      setRawJsonText(JSON.stringify(res.database, null, 2));
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Gagal memuat database dari server.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadBackup = () => {
    if (!data) return;
    try {
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
      a.href = url;
      a.download = `namsblast-db-backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: 'File backup JSON berhasil diunduh!' });
    } catch (e: any) {
      setMessage({ type: 'error', text: 'Gagal mengunduh file backup: ' + e.message });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        setActionLoading(true);
        const res = await ApiService.importRawDatabase(parsed);
        setData(res.database);
        setRawJsonText(JSON.stringify(res.database, null, 2));
        setMessage({ type: 'success', text: 'Database berhasil dipulihkan dari file backup!' });
        if (onRefreshStats) onRefreshStats();
      } catch (err: any) {
        setMessage({ type: 'error', text: 'Format file JSON tidak valid: ' + err.message });
      } finally {
        setActionLoading(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleSaveRawJson = async () => {
    try {
      const parsed = JSON.parse(rawJsonText);
      setActionLoading(true);
      const res = await ApiService.importRawDatabase(parsed);
      setData(res.database);
      setMessage({ type: 'success', text: 'Perubahan raw JSON berhasil disimpan ke server!' });
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Sintaks JSON tidak valid: ' + err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleClearTable = async (tableName: TableKey) => {
    if (!window.confirm(`PERINGATAN: Apakah Anda yakin ingin menghapus semua data pada tabel "${tableName}"?`)) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await ApiService.clearDatabaseTable(tableName);
      setData(res.database);
      setRawJsonText(JSON.stringify(res.database, null, 2));
      setMessage({ type: 'success', text: `Tabel "${tableName}" berhasil dikosongkan!` });
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Gagal membersihkan tabel.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetDatabase = async () => {
    if (
      !window.confirm(
        'PERINGATAN KRITIS: Apakah Anda yakin ingin mereset seluruh database ke kondisi awal (Seed Default)? Data kontak dan bot yang ada saat ini akan dikembalikan ke default.'
      )
    ) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await ApiService.resetDatabase();
      setData(res.database);
      setRawJsonText(JSON.stringify(res.database, null, 2));
      setMessage({ type: 'success', text: 'Database berhasil di-reset ke kondisi awal!' });
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Gagal mereset database.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopyRawJson = () => {
    navigator.clipboard.writeText(rawJsonText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const tables: Array<{ id: TableKey; label: string; icon: any; count: number }> = [
    { id: 'users', label: 'Users', icon: Users, count: data?.users?.length || 0 },
    { id: 'bots', label: 'WhatsApp Bots', icon: Smartphone, count: data?.bots?.length || 0 },
    { id: 'contacts', label: 'Contacts Queue', icon: FileSpreadsheet, count: data?.contacts?.length || 0 },
    { id: 'templates', label: 'Message Templates', icon: MessageSquare, count: data?.templates?.length || 0 },
    { id: 'sentLogs', label: 'Sent Logs', icon: Database, count: data?.sentLogs?.length || 0 },
    { id: 'withdrawRequests', label: 'Withdraw Requests', icon: Wallet, count: data?.withdrawRequests?.length || 0 },
    { id: 'announcements', label: 'Announcements', icon: Megaphone, count: data?.announcements?.length || 0 },
    { id: 'chatMessages', label: 'Live Chat', icon: MessageSquare, count: data?.chatMessages?.length || 0 },
    { id: 'settings', label: 'System Settings', icon: Sliders, count: 1 },
  ];

  // Filtering for table view
  const currentTableData: any[] = Array.isArray(data?.[activeTable])
    ? data[activeTable]
    : data?.[activeTable]
    ? [data[activeTable]]
    : [];

  const filteredRows = currentTableData.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return JSON.stringify(item).toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Top Banner: Database Info & Action Center */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start space-x-4">
            <div className="p-3.5 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20 shrink-0">
              <HardDrive className="w-7 h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wide bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Direct Database Manager (Active)</span>
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  data/database.json • {formatBytes(summary?.sizeBytes || 0)}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
                Database Explorer &amp; Raw Control
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Akses langsung ke seluruh tabel data NamsBlast. Kelola record pengguna, bot, antrian pesan, dan konfigurasi sistem tanpa repot.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={loadDatabase}
              disabled={loading || actionLoading}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition border border-slate-200"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleDownloadBackup}
              disabled={!data || loading}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition shadow-2xs"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Export JSON</span>
            </button>

            <label className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition cursor-pointer shadow-xs">
              <Upload className="w-4 h-4" />
              <span>Import JSON</span>
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>

            <button
              onClick={handleResetDatabase}
              disabled={actionLoading}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Default</span>
            </button>
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <div
            className={`mt-4 p-3.5 rounded-2xl flex items-center space-x-2.5 text-xs font-semibold ${
              message.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span>{message.text}</span>
          </div>
        )}
      </div>

      {/* View Switcher & Table Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        {/* Table Selector Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 scrollbar-none">
          {tables.map((t) => {
            const Icon = t.icon;
            const isSelected = activeTable === t.id && viewMode === 'table';
            return (
              <button
                key={t.id}
                onClick={() => {
                  setActiveTable(t.id);
                  setViewMode('table');
                }}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
                <span
                  className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isSelected ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* View Mode Toggle: Table View vs Raw JSON Editor */}
        <div className="flex items-center space-x-1 p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0">
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              viewMode === 'table' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Table View</span>
          </button>
          <button
            onClick={() => setViewMode('raw')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              viewMode === 'raw' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Raw JSON</span>
          </button>
        </div>
      </div>

      {/* Main Table View */}
      {viewMode === 'table' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
          {/* Table Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-black text-slate-900 capitalize">
                Tabel: {activeTable}
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 font-mono">
                {filteredRows.length} baris
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {/* Search in table */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari dalam tabel..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white w-48 sm:w-64"
                />
              </div>

              {/* Clear table action button */}
              {activeTable !== 'users' && activeTable !== 'settings' && activeTable !== 'templates' && (
                <button
                  onClick={() => handleClearTable(activeTable)}
                  disabled={actionLoading || currentTableData.length === 0}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition disabled:opacity-40"
                  title="Kosongkan tabel ini"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Kosongkan</span>
                </button>
              )}
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 max-h-[520px] scrollbar-thin">
            {filteredRows.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold">Tabel {activeTable} kosong atau tidak ada data yang cocok.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-100 text-slate-700 font-bold border-b border-slate-200 z-10">
                  <tr>
                    <th className="p-3 w-12 text-center">#</th>
                    {Object.keys(filteredRows[0] || {}).map((key) => (
                      <th key={key} className="p-3 font-mono tracking-wider">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {filteredRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="p-3 text-center text-slate-400 font-sans">{idx + 1}</td>
                      {Object.entries(row).map(([key, val], cellIdx) => {
                        let displayVal = '';
                        if (typeof val === 'object' && val !== null) {
                          displayVal = JSON.stringify(val);
                        } else {
                          displayVal = String(val ?? '');
                        }

                        // Specific styles for flags or status
                        const isStatus = key === 'status' || key === 'role';
                        return (
                          <td key={cellIdx} className="p-3 text-slate-700 max-w-xs truncate" title={displayVal}>
                            {isStatus ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                {displayVal}
                              </span>
                            ) : (
                              displayVal
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Raw JSON Live Editor View */}
      {viewMode === 'raw' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileCode className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-black text-slate-900">
                Live Raw Database JSON Editor
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopyRawJson}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition border border-slate-200"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tersalin!' : 'Copy JSON'}</span>
              </button>
              <button
                onClick={handleSaveRawJson}
                disabled={actionLoading}
                className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Simpan Perubahan ke Server</span>
              </button>
            </div>
          </div>

          <textarea
            value={rawJsonText}
            onChange={(e) => setRawJsonText(e.target.value)}
            rows={22}
            className="w-full p-4 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 scrollbar-thin selection:bg-emerald-800"
            spellCheck={false}
          />
        </div>
      )}
    </div>
  );
};
