import React, { useState, useEffect } from 'react';
import {
  Wallet,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  CreditCard,
  Building2,
  ArrowDownLeft,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { WithdrawRequest, User, SystemSettings } from '../types';
import { ApiService } from '../services/api';

interface WalletViewProps {
  currentUser: User | null;
  settings: SystemSettings | null;
  onRefreshUser: () => void;
  onOpenAuth: () => void;
}

export const WalletView: React.FC<WalletViewProps> = ({
  currentUser,
  settings,
  onRefreshUser,
  onOpenAuth,
}) => {
  const [withdraws, setWithdraws] = useState<WithdrawRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'withdraw' | 'history'>('withdraw');

  // Withdraw Form State
  const [amount, setAmount] = useState<string>('50000');
  const [paymentMethod, setPaymentMethod] = useState<'DANA' | 'GOPAY' | 'OVO' | 'SHOPEEPAY' | 'BCA' | 'MANDIRI' | 'BRI' | 'BNI'>('DANA');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState(currentUser?.name || '');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchWithdraws = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const data = await ApiService.getMyWithdraws(currentUser.id);
      setWithdraws(data);
    } catch (e) {
      console.error('Error loading withdraws:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchWithdraws();
      if (!accountHolder) {
        setAccountHolder(currentUser.name || '');
      }
    }
  }, [currentUser]);

  const minWithdraw = settings?.minWithdraw || 20000;
  const maxWithdraw = settings?.maxWithdraw || 5000000;
  const userBalance = currentUser?.balance || 0;

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < minWithdraw) {
      setErrorMessage(`Minimal penarikan adalah Rp ${minWithdraw.toLocaleString('id-ID')}`);
      return;
    }

    if (numAmount > maxWithdraw) {
      setErrorMessage(`Maksimal penarikan per transaksi adalah Rp ${maxWithdraw.toLocaleString('id-ID')}`);
      return;
    }

    if (numAmount > userBalance) {
      setErrorMessage(`Saldo Anda saat ini (Rp ${userBalance.toLocaleString('id-ID')}) tidak mencukupi.`);
      return;
    }

    if (!accountNumber.trim() || !accountHolder.trim()) {
      setErrorMessage('Nomor rekening / e-wallet dan nama pemilik rekening wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await ApiService.requestWithdraw({
        userId: currentUser.id,
        amount: numAmount,
        bankName: paymentMethod,
        accountNumber: accountNumber.trim(),
        accountHolder: accountHolder.trim(),
      });

      setSuccessMessage(res.message || 'Permintaan penarikan berhasil dikirim!');
      setAccountNumber('');
      onRefreshUser();
      await fetchWithdraws();
      setActiveSubTab('history');
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengirim permintaan penarikan.');
    } finally {
      setSubmitting(false);
    }
  };

  const setPresetAmount = (val: number) => {
    setAmount(String(val));
  };

  const totalWithdrawnSuccess = withdraws
    .filter((w) => w.status === 'SUCCESS')
    .reduce((sum, w) => sum + w.amount, 0);

  const pendingWithdrawsCount = withdraws.filter((w) => w.status === 'PENDING').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Wallet Balance Summary Card */}
      <div className="bg-linear-to-br from-emerald-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 text-emerald-300 text-xs font-extrabold uppercase tracking-wider">
              <Wallet className="w-4 h-4" />
              <span>Dompet Saldo NamsBlast</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight mt-2">
              Rp {userBalance.toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Pendapatan dari pengiriman pesan WhatsApp otomatis dan komisi referral.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 shrink-0">
            <div className="p-3.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
              <div className="text-[10px] uppercase font-bold text-emerald-200">Total Berhasil Ditarik</div>
              <div className="text-base sm:text-lg font-black font-mono mt-0.5">
                Rp {totalWithdrawnSuccess.toLocaleString('id-ID')}
              </div>
            </div>
            <div className="p-3.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
              <div className="text-[10px] uppercase font-bold text-emerald-200">Sedang Diproses</div>
              <div className="text-base sm:text-lg font-black font-mono mt-0.5">
                {pendingWithdrawsCount} Transaksi
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub Tabs: Tarik Saldo vs Riwayat Penarikan */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          id="tab-sub-withdraw-form"
          onClick={() => setActiveSubTab('withdraw')}
          className={`pb-3 text-sm font-bold transition flex items-center space-x-2 border-b-2 ${
            activeSubTab === 'withdraw'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ArrowUpRight className="w-4 h-4 text-emerald-600" />
          <span>Tarik Saldo</span>
        </button>

        <button
          id="tab-sub-withdraw-history"
          onClick={() => setActiveSubTab('history')}
          className={`pb-3 text-sm font-bold transition flex items-center space-x-2 border-b-2 ${
            activeSubTab === 'history'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4 text-emerald-600" />
          <span>Riwayat Penarikan ({withdraws.length})</span>
        </button>
      </div>

      {/* TAB 1: FORM TARIK SALDO */}
      {activeSubTab === 'withdraw' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-2xl">
          <div className="mb-6">
            <h3 className="text-base font-extrabold text-slate-900">Formulir Penarikan Saldo</h3>
            <p className="text-xs text-slate-500">
              Tarik saldo pendapatan Anda langsung ke rekening Bank atau E-Wallet pilihan.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleWithdrawSubmit} className="space-y-5">
            {/* Amount Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nominal Penarikan (Rp) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs font-extrabold text-slate-400">Rp</span>
                <input
                  id="input-withdraw-amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="50000"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Preset Buttons */}
              <div className="flex flex-wrap gap-2 mt-2">
                {[20000, 50000, 100000, 250000, 500000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setPresetAmount(val)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg border transition ${
                      Number(amount) === val
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Rp {val.toLocaleString('id-ID')}
                  </button>
                ))}
                {userBalance >= minWithdraw && (
                  <button
                    type="button"
                    onClick={() => setPresetAmount(userBalance)}
                    className="px-3 py-1 text-xs font-extrabold rounded-lg bg-slate-100 text-slate-800 border border-slate-300 hover:bg-slate-200"
                  >
                    Semua Saldo
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Minimal penarikan: Rp {minWithdraw.toLocaleString('id-ID')}
              </p>
            </div>

            {/* Payment Method / Bank */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Tujuan Penarikan (E-Wallet / Bank) <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['DANA', 'GOPAY', 'OVO', 'SHOPEEPAY', 'BCA', 'MANDIRI', 'BRI', 'BNI'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition ${
                      paymentMethod === method
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Account Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nomor Rekening / Nomor E-Wallet ({paymentMethod}) <span className="text-red-500">*</span>
              </label>
              <input
                id="input-withdraw-account-number"
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Contoh: 08123456789 atau 8870123456"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            {/* Account Holder Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nama Pemilik Rekening / Akun E-Wallet <span className="text-red-500">*</span>
              </label>
              <input
                id="input-withdraw-account-holder"
                type="text"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                placeholder="Nama sesuai akun bank/e-wallet"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            {/* Info notice */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                Penarikan diproses setiap hari dalam 1-15 menit setelah permintaan diverifikasi oleh admin.
              </span>
            </div>

            {/* Submit Button */}
            <button
              id="btn-submit-withdraw"
              type="submit"
              disabled={submitting || userBalance < minWithdraw}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center space-x-2 shadow-md shadow-emerald-700/20"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Memproses Permintaan...</span>
                </>
              ) : (
                <>
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Kirim Permintaan Penarikan</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: RIWAYAT PENARIKAN */}
      {activeSubTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Riwayat Penarikan Saldo</h3>
              <p className="text-xs text-slate-500">Daftar transaksi penarikan dana ke rekening Anda</p>
            </div>
            <button
              onClick={fetchWithdraws}
              className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-slate-200/60 rounded-xl transition"
              title="Refresh Riwayat"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="overflow-x-auto">
            {withdraws.length === 0 ? (
              <div className="text-center py-12 px-4 space-y-2 text-slate-400">
                <Wallet className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-xs font-bold text-slate-600">Belum ada riwayat penarikan</p>
                <p className="text-[11px] text-slate-400">
                  Lakukan penarikan saat saldo Anda telah mencapai minimal Rp {minWithdraw.toLocaleString('id-ID')}.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Tanggal &amp; Waktu</th>
                    <th className="px-4 py-3">Tujuan Penarikan</th>
                    <th className="px-4 py-3">Nominal (Rp)</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Catatan Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {withdraws.map((w) => {
                    const isSuccess = w.status === 'SUCCESS';
                    const isPending = w.status === 'PENDING';
                    const isRejected = w.status === 'REJECTED';

                    return (
                      <tr key={w.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                          {new Date(w.requestedAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}{' '}
                          <span className="text-[10px] text-slate-400">
                            {new Date(w.requestedAt).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-900">{w.bankName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {w.accountNumber} ({w.accountHolder})
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-bold font-mono text-slate-900 text-sm">
                          Rp {w.amount.toLocaleString('id-ID')}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {isSuccess && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-[10px]">
                              <CheckCircle2 className="w-3 h-3" /> Berhasil
                            </span>
                          )}
                          {isPending && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-bold text-[10px]">
                              <Clock className="w-3 h-3" /> Diproses
                            </span>
                          )}
                          {isRejected && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full font-bold text-[10px]">
                              <XCircle className="w-3 h-3" /> Ditolak
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 text-[11px]">
                          {w.adminNote || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
