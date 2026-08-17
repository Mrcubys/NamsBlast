import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import {
  UploadCloud,
  FileSpreadsheet,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Download,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { ApiService } from '../../services/api';
import { Contact } from '../../types';

interface AdminContactsProps {
  onContactsUpdated: () => void;
}

export const AdminContacts: React.FC<AdminContactsProps> = ({ onContactsUpdated }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [counts, setCounts] = useState({ all: 0, pending: 0, sent: 0, failed: 0 });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [manualPhone, setManualPhone] = useState('');
  const [manualName, setManualName] = useState('');
  const [showManualForm, setShowManualForm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadContacts();
  }, [page, statusFilter]);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const res = await ApiService.getContacts({
        page,
        limit: 25,
        status: statusFilter,
        search,
      });
      setContacts(res.contacts);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      setCounts(res.counts);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadContacts();
  };

  const handleFileUpload = (file: File) => {
    setUploading(true);
    setFeedback(null);

    const fileName = file.name.toLowerCase();
    if (fileName.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          await processParsedData(results.data);
        },
        error: (err) => {
          setFeedback({ type: 'error', message: `Gagal membaca CSV: ${err.message}` });
          setUploading(false);
        },
      });
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);
          await processParsedData(jsonData);
        } catch (err: any) {
          setFeedback({ type: 'error', message: `Gagal membaca file Excel: ${err.message}` });
          setUploading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      setFeedback({ type: 'error', message: 'Format file tidak didukung. Harap upload .csv, .xlsx, atau .xls.' });
      setUploading(false);
    }
  };

  const processParsedData = async (rawRows: any[]) => {
    try {
      const extracted: Array<{ phone: string; name?: string }> = [];

      for (const row of rawRows) {
        const phoneKey = Object.keys(row).find((k) =>
          ['phone', 'nomor', 'no_hp', 'no_wa', 'telepon', 'phone_number', 'mobile', 'whatsapp'].includes(
            k.toLowerCase().trim()
          )
        ) || Object.keys(row)[0];

        const nameKey = Object.keys(row).find((k) =>
          ['name', 'nama', 'full_name', 'nama_lengkap', 'contact_name'].includes(k.toLowerCase().trim())
        );

        if (phoneKey && row[phoneKey]) {
          extracted.push({
            phone: String(row[phoneKey]),
            name: nameKey && row[nameKey] ? String(row[nameKey]) : undefined,
          });
        }
      }

      if (extracted.length === 0) {
        setFeedback({
          type: 'error',
          message: 'Kolom nomor tidak ditemukan. Pastikan ada kolom bernama "nomor" atau "phone".',
        });
        setUploading(false);
        return;
      }

      const res = await ApiService.uploadContacts(extracted);
      setFeedback({ type: 'success', message: res.message });
      onContactsUpdated();
      loadContacts();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Gagal menyimpan kontak' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualPhone) return;
    try {
      await ApiService.addSingleContact({ phone: manualPhone, name: manualName });
      setFeedback({ type: 'success', message: 'Kontak berhasil ditambahkan ke antrian!' });
      setManualPhone('');
      setManualName('');
      setShowManualForm(false);
      onContactsUpdated();
      loadContacts();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleDownloadSampleCsv = () => {
    const csvContent = 'nomor,nama\n081234567890,Budi Santoso\n085712345678,Siti Aminah\n087898765432,Hendra Kusuma\n089611223344,Maya Indah\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample_kontak_namsblast.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClearAll = async () => {
    if (confirm('Apakah Anda yakin ingin menghapus SEMUA kontak dari database?')) {
      await ApiService.clearAllContacts();
      setFeedback({ type: 'success', message: 'Semua kontak berhasil dibersihkan.' });
      onContactsUpdated();
      loadContacts();
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback Notice */}
      {feedback && (
        <div
          className={`flex items-center justify-between p-4 rounded-2xl border text-sm font-semibold ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-bold opacity-70 hover:opacity-100"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Top Upload Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Upload Card */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <span>Upload File Kontak (Excel / CSV)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Nomor yang di-upload otomatis berstatus <strong>Pending</strong> dan siap diproses bot.
              </p>
            </div>
            <button
              onClick={handleDownloadSampleCsv}
              className="flex items-center space-x-1.5 text-xs text-slate-600 hover:text-emerald-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 transition shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Contoh Format CSV</span>
            </button>
          </div>

          {/* Drag & Drop Area */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileUpload(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 sm:p-8 text-center bg-slate-50 hover:bg-emerald-50/40 transition cursor-pointer group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv, .xlsx, .xls"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2.5 group-hover:scale-105 transition shadow-xs">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div className="text-xs sm:text-sm font-bold text-slate-800">
              {uploading ? 'Sedang Memproses & Menyimpan File...' : 'Klik atau Tarik File Excel / CSV ke sini'}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Mendukung file .xlsx, .xls, .csv. Format kolom: <code>nomor</code> (wajib), <code>nama</code> (opsional).
            </p>
          </div>
        </div>

        {/* Manual Actions */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 flex flex-col justify-between shadow-xs">
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 mb-1.5 flex items-center space-x-1.5">
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>Input Kontak</span>
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tambahkan nomor baru ke antrian secara manual.
            </p>

            <div className="mt-3.5 space-y-2">
              <button
                onClick={() => setShowManualForm(!showManualForm)}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold transition flex items-center justify-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>{showManualForm ? 'Tutup Input Manual' : 'Input Manual 1 Nomor'}</span>
              </button>
            </div>

            {showManualForm && (
              <form onSubmit={handleManualAdd} className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <input
                  type="text"
                  placeholder="Nomor (contoh: 08123456789)"
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-none"
                  required
                />
                <input
                  type="text"
                  placeholder="Nama (opsional)"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-none"
                />
                <button
                  type="submit"
                  className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                >
                  Simpan ke Pending
                </button>
              </form>
            )}
          </div>

          <div className="pt-3.5 border-t border-slate-100 mt-3.5">
            <button
              onClick={handleClearAll}
              className="w-full py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition flex items-center justify-center space-x-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Bersihkan Seluruh Database Kontak</span>
            </button>
          </div>
        </div>
      </div>

      {/* Contacts Table with Search & Status Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          {/* Status Tabs */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto text-xs font-semibold">
            <button
              onClick={() => {
                setStatusFilter('all');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({counts.all})
            </button>
            <button
              onClick={() => {
                setStatusFilter('pending');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'pending'
                  ? 'bg-amber-100 text-amber-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending ({counts.pending})
            </button>
            <button
              onClick={() => {
                setStatusFilter('sent');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'sent'
                  ? 'bg-emerald-100 text-emerald-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Terkirim ({counts.sent})
            </button>
            <button
              onClick={() => {
                setStatusFilter('failed');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'failed'
                  ? 'bg-rose-100 text-rose-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Gagal ({counts.failed})
            </button>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nomor / nama..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 w-full sm:w-60"
            />
          </form>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[10px] border-y border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Nomor WhatsApp</th>
                <th className="py-2.5 px-3">Nama Kontak</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3">Bot Pengirim</th>
                <th className="py-2.5 px-3 text-right">Waktu Kirim / Batch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contacts.map((c) => {
                let badge = (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    <Clock className="w-3 h-3 mr-1" /> Pending
                  </span>
                );
                if (c.status === 'sent') {
                  badge = (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Terkirim
                    </span>
                  );
                } else if (c.status === 'failed') {
                  badge = (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      <XCircle className="w-3 h-3 mr-1" /> Gagal
                    </span>
                  );
                } else if (c.status === 'processing') {
                  badge = (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 animate-pulse">
                      <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Proses
                    </span>
                  );
                }

                return (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{c.phone}</td>
                    <td className="py-2.5 px-3 text-slate-700">{c.name || '-'}</td>
                    <td className="py-2.5 px-3 text-center">{badge}</td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                      {c.assignedBotId || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-500">
                      {c.sentAt
                        ? new Date(c.sentAt).toLocaleString('id-ID', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })
                        : c.batchId}
                    </td>
                  </tr>
                );
              })}
              {contacts.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    Tidak ada kontak yang sesuai filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-xs">
            <span className="text-slate-500">
              Menampilkan halaman <strong>{page}</strong> dari <strong>{totalPages}</strong> ({total} data)
            </span>
            <div className="flex items-center space-x-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 disabled:opacity-40"
              >
                Sebelumnya
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 disabled:opacity-40"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
