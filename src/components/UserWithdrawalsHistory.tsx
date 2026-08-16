import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  RefreshCw,
  AlertCircle,
  CreditCard,
} from 'lucide-react';
import { ApiService } from '../services/api';
import { WithdrawRequest } from '../types';

interface UserWithdrawalsHistoryProps {
  userId: string;
  onRequestWithdraw: () => void;
}

export const UserWithdrawalsHistory: React.FC<UserWithdrawalsHistoryProps> = ({
  userId,
  onRequestWithdraw,
}) => {
  const [withdrawals, setWithdrawals] = useState<WithdrawRequest[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadWithdrawals();
  }, [userId]);

  const loadWithdrawals = async () => {
    setLoading(true);
    try {
      const res = await ApiService.getUserWithdraws(userId);
      setWithdrawals(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Berhasil Cair</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>Ditolak</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600 animate-spin" />
            <span>Menunggu Proses (Maks 24 Jam)</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <Wallet className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Riwayat Penarikan Saldo (Withdrawal)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Semua permintaan withdraw diproses manual oleh Admin maksimal dalam waktu 24 jam.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadWithdrawals}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            id="btn-request-withdraw-page"
            onClick={onRequestWithdraw}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center space-x-1.5 shadow-sm shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Tarik Saldo Sekarang</span>
          </button>
        </div>
      </div>

      {/* Withdrawals List / Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        {withdrawals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Tanggal Permintaan</th>
                  <th className="py-3 px-4">Tujuan Transfer</th>
                  <th className="py-3 px-4">Nominal</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Catatan / Bukti</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {withdrawals.map((wd) => (
                  <tr key={wd.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(wd.createdAt).toLocaleString('id-ID', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800 flex items-center space-x-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                        <span>{wd.bankName}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {wd.accountNumber} a.n {wd.accountHolder}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-black text-slate-900 font-mono text-sm">
                      Rp {wd.amount.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(wd.status)}</td>
                    <td className="py-3 px-4 text-slate-500">
                      {wd.adminNotes || (wd.status === 'PENDING' ? 'Dalam antrian verifikasi admin' : '-')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center">
            <Wallet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700">Belum Ada Riwayat Penarikan</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Saat saldo Anda mencapai batas minimal penarikan, Anda dapat mengajukan withdraw ke rekening bank atau e-wallet Anda.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
