import React, { useState, useEffect } from 'react';
import { Users, Smartphone, Coins, Gift, ShieldCheck, UserCheck, Search } from 'lucide-react';
import { ApiService } from '../../services/api';
import { User } from '../../types';

interface UserWithBotCount extends User {
  botsCount?: number;
  onlineBotsCount?: number;
}

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<UserWithBotCount[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const list = (await ApiService.getAdminUsers()) as UserWithBotCount[];
      setUsers(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.referralCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <span>Daftar Pengguna ({users.length})</span>
            </h3>
            <p className="text-xs text-slate-500">
              Pantau seluruh akun terdaftar, saldo aktif, bot online, dan total earning.
            </p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari user / email / ref..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 w-full sm:w-60"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[10px] border-y border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Nama User / Email</th>
                <th className="py-2.5 px-3">Role &amp; Ref Code</th>
                <th className="py-2.5 px-3 text-center">Bot Online / Total</th>
                <th className="py-2.5 px-3 text-center">Total Pesan Blast</th>
                <th className="py-2.5 px-3 text-right">Saldo Saat Ini</th>
                <th className="py-2.5 px-3 text-right">Total Earning All Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900 text-sm">{u.name}</div>
                    <div className="text-[10px] text-slate-500">{u.email}</div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center space-x-2">
                      {u.role === 'ADMIN' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center">
                          <ShieldCheck className="w-3 h-3 mr-1" /> Admin
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center">
                          <UserCheck className="w-3 h-3 mr-1" /> User
                        </span>
                      )}
                      <span className="font-mono text-[10px] text-slate-600 font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {u.referralCode}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="font-mono font-bold text-emerald-700">
                      {u.onlineBotsCount || 0}
                    </span>
                    <span className="text-slate-400"> / {u.botsCount || 0} bot</span>
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">
                    {(u.totalMessagesSent || 0).toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-black text-emerald-700 text-sm">
                    Rp {(u.balance || 0).toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-600">
                    Rp {(u.totalEarned || 0).toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Tidak ada pengguna ditemukan.
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
