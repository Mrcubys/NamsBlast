import React, { useState, useEffect } from 'react';
import {
  Wallet,
  CheckCircle2,
  XCircle,
  Clock,
  CreditCard,
  User,
  AlertCircle,
  Check,
  X,
} from 'lucide-react';
import { ApiService } from '../../services/api';
import { WithdrawRequest } from '../../types';

interface AdminWithdrawalsProps {
  onUpdated: () => void;
}

export const AdminWithdrawals: React.FC<AdminWithdrawalsProps> = ({ onUpdated }) => {
  const [requests, setRequests] = useState<WithdrawRequest[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedReq, setSelectedReq] = useState<WithdrawRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [adminNote, setAdminNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const all = await ApiService.getAllWithdrawsAdmin();
      setRequests(all);
    } catch (e) {
      console.error(e);
    }
  };

  const openActionModal = (req: WithdrawRequest, type: 'approve' | 'reject') => {
    setSelectedReq(req);
    setActionType(type);
    setAdminNote(type === 'approve' ? 'Dana telah berhasil ditransfer ke rekening tujuan.' : 'Data rekening tidak sesuai.');
  };

  const handleProcessAction = async () => {
    if (!selectedReq) return;
    setLoading(true);
    setFeedback(null);

    try {
      if (actionType === 'approve') {
        await ApiService.approveWithdrawAdmin(selectedReq.id, adminNote);
        setFeedback(`Withdraw ${selectedReq.userName} (Rp ${selectedReq.amount.toLocaleString('id-ID')}) berhasil DISETUJUI & dana dicairkan.`);
      } else {
        await ApiService.rejectWithdrawAdmin(selectedReq.id, adminNote);
        setFeedback(`Withdraw ${selectedReq.userName} berhasil DITOLAK.`);
      }
      setSelectedReq(null);
      loadRequests();
      onUpdated();
    } catch (err: any) {
      setFeedback(err.message || 'Gagal memproses tindakan');
    } finally {
      setLoading(false);
    }
  };

  const filtered = requests.filter((r) => {
    if (filterStatus === 'ALL') return true;
    return r.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      {/* Feedback Alert */}
      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-xs font-bold opacity-70">
            Tutup
          </button>
        </div>
      )}

      {/* Main Table Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Wallet className="w-5 h-5 text-emerald-600" />
              <span>Persetujuan Withdraw ({requests.length})</span>
            </h3>
            <p className="text-xs text-slate-500">
              Proses pencairan dana manual member maksimal dalam 24 jam.
            </p>
          </div>

          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            {['ALL', 'PENDING', 'PAID', 'REJECTED'].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  filterStatus === s
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Withdrawals Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[10px] border-y border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Member Pengaju</th>
                <th className="py-2.5 px-3">Tujuan Transfer</th>
                <th className="py-2.5 px-3">Nominal</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3">Waktu</th>
                <th className="py-2.5 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900">{req.userName}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{req.userEmail}</div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-800 flex items-center space-x-1">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                      <span>{req.bankName}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {req.accountNumber} a.n {req.accountHolder}
                    </div>
                  </td>
                  <td className="py-3 px-3 font-black text-slate-900 font-mono text-sm">
                    Rp {req.amount.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {req.status === 'PAID' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Sukses Cair
                      </span>
                    ) : req.status === 'REJECTED' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <XCircle className="w-3 h-3 mr-1" /> Ditolak
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3 h-3 mr-1 animate-spin" /> Pending
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-500 text-[11px]">
                    {new Date(req.createdAt).toLocaleString('id-ID', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </td>
                  <td className="py-3 px-3 text-right">
                    {req.status === 'PENDING' ? (
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => openActionModal(req, 'approve')}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-xs transition"
                        >
                          Setujui
                        </button>
                        <button
                          onClick={() => openActionModal(req, 'reject')}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold text-xs transition"
                        >
                          Tolak
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">
                        {req.adminNotes || 'Selesai'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Tidak ada data permintaan withdraw.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Approval / Rejection Modal */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-base">
                {actionType === 'approve' ? 'Konfirmasi Persetujuan Withdraw' : 'Konfirmasi Penolakan Withdraw'}
              </h4>
              <button
                onClick={() => setSelectedReq(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Member:</span>
                <strong className="text-slate-800">{selectedReq.userName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nominal:</span>
                <strong className="text-emerald-700 font-mono text-sm">
                  Rp {selectedReq.amount.toLocaleString('id-ID')}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tujuan Transfer:</span>
                <span className="font-mono text-slate-800">
                  {selectedReq.bankName} - {selectedReq.accountNumber} ({selectedReq.accountHolder})
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Catatan / Bukti Referensi untuk Pengguna:
              </label>
              <textarea
                rows={2}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setSelectedReq(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                onClick={handleProcessAction}
                disabled={loading}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition shadow-xs ${
                  actionType === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {loading ? 'Memproses...' : actionType === 'approve' ? 'Setujui & Tandai Lunas' : 'Tolak Permintaan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
