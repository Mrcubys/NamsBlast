import React, { useState, useEffect } from 'react';
import {
  Gift,
  Copy,
  Check,
  Share2,
  Users,
  Coins,
  MessageCircle,
} from 'lucide-react';
import { ApiService } from '../services/api';
import { User } from '../types';

interface ReferralCardProps {
  currentUser: User;
}

export const ReferralCard: React.FC<ReferralCardProps> = ({ currentUser }) => {
  const [data, setData] = useState<{
    referralCode: string;
    totalReferralEarned: number;
    rateReferralPerMessage: number;
    totalDownlines: number;
    downlines: Array<{
      id: string;
      name: string;
      email: string;
      totalMessagesSent: number;
      joinedAt: string;
    }>;
  } | null>(null);

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    loadReferralData();
  }, [currentUser.id]);

  const loadReferralData = async () => {
    try {
      const res = await ApiService.getMyReferrals(currentUser.id);
      setData(res);
    } catch (e) {
      console.error(e);
    }
  };

  const referralCode = currentUser.referralCode;
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://namsblast.com';
  const referralLink = `${baseUrl}/?ref=${referralCode}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `🚀 Dapatkan penghasilan pasif dari nomor WhatsApp kamu di NamsBlast! Cukup hubungkan WhatsApp dan dapatkan saldo setiap pesan blast berhasil dikirim.\n\nDaftar sekarang lewat link saya:\n${referralLink}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 text-emerald-800 text-xs font-extrabold uppercase tracking-wider mb-2">
              <Gift className="w-4 h-4 text-emerald-600" />
              <span>Program Kemitraan &amp; Referral</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Ajak Teman, Dapatkan Komisi Pasif
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-xl leading-relaxed">
              Setiap 1 pesan yang berhasil dikirim oleh bot milik teman yang mendaftar menggunakan kode Anda, Anda akan mendapatkan komisi flat{' '}
              <strong className="text-emerald-700">
                Rp {data?.rateReferralPerMessage || 10}/pesan
              </strong>{' '}
              secara otomatis ke saldo Anda!
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="p-4 rounded-xl bg-white border border-emerald-200 text-center shadow-xs">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Total Member Reff</div>
              <div className="text-xl font-black text-slate-900 mt-1">
                {data?.totalDownlines || 0} orang
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-emerald-200 text-center shadow-xs">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Total Komisi</div>
              <div className="text-xl font-black text-emerald-700 font-mono mt-1">
                Rp {(data?.totalReferralEarned || 0).toLocaleString('id-ID')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Referral Link & Code Share Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Referral Code Box */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="text-xs font-bold text-slate-700">Kode Referral Anda:</div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="font-mono text-lg font-black text-emerald-700 tracking-widest">
              {referralCode}
            </span>
            <button
              onClick={handleCopyCode}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Disalin' : 'Salin'}</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            Bagikan kode ini kepada calon pengguna saat mereka melakukan pendaftaran akun.
          </p>
        </div>

        {/* Share WhatsApp & Direct Link */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="text-xs font-bold text-slate-700">Tautan Undangan Langsung:</div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="font-mono text-xs font-semibold text-slate-700 truncate pr-2">
              {referralLink}
            </span>
            <button
              onClick={handleCopyLink}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition shrink-0"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Disalin' : 'Salin'}</span>
            </button>
          </div>
          <button
            onClick={handleShareWhatsApp}
            className="w-full py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs transition flex items-center justify-center space-x-2 shadow-xs"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>Bagikan ke WhatsApp Sekarang</span>
          </button>
        </div>
      </div>

      {/* Downlines Table */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-emerald-600" />
            <h4 className="text-sm font-bold text-slate-900">Daftar Member Referral Anda</h4>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Total {data?.downlines?.length || 0} Pengguna Terdaftar
          </span>
        </div>

        {data?.downlines && data.downlines.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Nama Pengguna</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Total Pesan Bot Terkirim</th>
                  <th className="py-2.5 px-3">Komisi Anda</th>
                  <th className="py-2.5 px-3">Tanggal Bergabung</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.downlines.map((dl) => {
                  const earn = (dl.totalMessagesSent || 0) * (data?.rateReferralPerMessage || 10);
                  return (
                    <tr key={dl.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{dl.name}</td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono">{dl.email}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800">
                        {dl.totalMessagesSent.toLocaleString('id-ID')} pesan
                      </td>
                      <td className="py-2.5 px-3 font-bold text-emerald-700 font-mono">
                        Rp {earn.toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {new Date(dl.joinedAt).toLocaleDateString('id-ID')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <div className="text-xs font-bold text-slate-700">Belum Ada Member Referral</div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Bagikan link referral Anda untuk mulai membangun passive income dari blast teman Anda!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
