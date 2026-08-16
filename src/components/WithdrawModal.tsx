import React, { useState } from 'react';
import {
  X,
  Wallet,
  Building2,
  CreditCard,
  User,
  ArrowRight,
  AlertCircle,
  Clock,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { ApiService } from '../services/api';
import { SystemSettings, WithdrawRequest } from '../types';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userBalance: number;
  settings: SystemSettings | null;
  onWithdrawSuccess: (req: WithdrawRequest) => void;
}

const POPULAR_PAYMENT_METHODS = [
  { id: 'BCA', name: 'Bank BCA', type: 'bank' },
  { id: 'Mandiri', name: 'Bank Mandiri', type: 'bank' },
  { id: 'BRI', name: 'Bank BRI', type: 'bank' },
  { id: 'BNI', name: 'Bank BNI', type: 'bank' },
  { id: 'BSI', name: 'Bank Syariah Indonesia (BSI)', type: 'bank' },
  { id: 'DANA', name: 'DANA E-Wallet', type: 'ewallet' },
  { id: 'GoPay', name: 'GoPay', type: 'ewallet' },
  { id: 'OVO', name: 'OVO', type: 'ewallet' },
  { id: 'ShopeePay', name: 'ShopeePay', type: 'ewallet' },
];

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  isOpen,
  onClose,
  userId,
  userBalance,
  settings,
  onWithdrawSuccess,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [bankName, setBankName] = useState('BCA');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const minWd = settings?.minWithdraw || 20000;
  const maxWd = settings?.maxWithdraw || 2000000;

  const handleQuickAmount = (val: number) => {
    setAmount(String(Math.min(val, userBalance)));
  };

  const handleWithdrawAll = () => {
    setAmount(String(userBalance));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const numAmount = Number(amount);

    if (!numAmount || numAmount <= 0) {
      setError('Masukkan nominal penarikan yang valid.');
      return;
    }

    if (numAmount < minWd) {
      setError(`Nominal penarikan minimal adalah Rp ${minWd.toLocaleString('id-ID')}.`);
      return;
    }

    if (numAmount > maxWd) {
      setError(`Nominal penarikan maksimal adalah Rp ${maxWd.toLocaleString('id-ID')}.`);
      return;
    }

    if (numAmount > userBalance) {
      setError(`Saldo Anda tidak mencukupi (Tersedia: Rp ${userBalance.toLocaleString('id-ID')}).`);
      return;
    }

    if (!accountNumber.trim() || !accountHolder.trim()) {
      setError('Nomor rekening/e-wallet dan nama pemilik wajib diisi.');
      return;
    }

    setLoading(true);

    try {
      const res = await ApiService.requestWithdraw({
        userId,
        amount: numAmount,
        bankName,
        accountNumber: accountNumber.trim(),
        accountHolder: accountHolder.trim(),
      });

      onWithdrawSuccess(res.withdraw);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal mengajukan penarikan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 sm:p-8 my-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center space-x-2 text-emerald-800 text-xs font-extrabold uppercase tracking-wider mb-1">
            <Wallet className="w-4 h-4 text-emerald-600" />
            <span>Pencairan Dana Pendapatan</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Tarik Saldo Earning
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Ajukan withdraw langsung ke Rekening Bank atau E-Wallet pilihan Anda.
          </p>
        </div>

        {/* Available Balance Box */}
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 mb-5 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-emerald-800 font-bold uppercase">
              Saldo Siap Ditarik
            </div>
            <div className="text-2xl font-black text-emerald-950 font-mono mt-0.5">
              Rp {userBalance.toLocaleString('id-ID')}
            </div>
          </div>
          <button
            type="button"
            onClick={handleWithdrawAll}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
          >
            Tarik Semua
          </button>
        </div>

        {error && (
          <div className="flex items-center space-x-2 p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nominal Penarikan (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-black text-slate-500">
                Rp
              </span>
              <input
                type="number"
                required
                min={minWd}
                max={Math.min(maxWd, userBalance)}
                placeholder="Contoh: 50000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 focus:border-emerald-500 focus:bg-white focus:outline-none text-slate-900 font-mono font-bold text-base placeholder:text-slate-400"
              />
            </div>

            {/* Quick amount chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[25000, 50000, 100000, 250000, 500000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAmount(val)}
                  disabled={val > userBalance}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40 disabled:hover:bg-slate-100 transition"
                >
                  Rp {(val / 1000).toFixed(0)}k
                </button>
              ))}
            </div>
            <div className="text-[11px] text-slate-400 mt-1.5 flex justify-between">
              <span>Min: Rp {minWd.toLocaleString('id-ID')}</span>
              <span>Maks: Rp {maxWd.toLocaleString('id-ID')}</span>
            </div>
          </div>

          {/* Bank / E-wallet Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Pilih Bank / E-Wallet Tujuan
            </label>
            <select
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 focus:border-emerald-500 focus:bg-white focus:outline-none text-slate-900 text-xs sm:text-sm font-semibold"
            >
              {POPULAR_PAYMENT_METHODS.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.name} ({method.type === 'bank' ? 'Bank Transfer' : 'E-Wallet'})
                </option>
              ))}
            </select>
          </div>

          {/* Account Number */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nomor Rekening / Nomor E-Wallet
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                placeholder="Contoh: 1234567890 / 081234567890"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 focus:border-emerald-500 focus:bg-white focus:outline-none text-slate-900 font-mono text-xs sm:text-sm placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Account Holder Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Lengkap Pemilik Rekening / Akun E-Wallet
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                placeholder="Sesuai nama di buku tabungan / aplikasi e-wallet"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 focus:border-emerald-500 focus:bg-white focus:outline-none text-slate-900 text-xs sm:text-sm placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Notice */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center space-x-2">
            <Clock className="w-4 h-4 text-slate-500 shrink-0" />
            <span>Pencairan dana diproses manual oleh Admin maksimal 24 jam.</span>
          </div>

          <button
            type="submit"
            disabled={loading || userBalance < minWd}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition shadow-sm shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <span>Memproses Pengajuan...</span>
            ) : (
              <>
                <span>Kirim Permintaan Penarikan</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
