import React, { useState } from 'react';
import {
  Activity,
  FileSpreadsheet,
  MessageSquare,
  Wallet,
  Sliders,
  Megaphone,
  Users,
  Database,
  ShieldCheck,
  LogOut,
  Headphones,
  HardDrive,
} from 'lucide-react';
import { DashboardStats, SystemSettings, Bot } from '../../types';
import { AdminOverview } from './AdminOverview';
import { AdminDatabase } from './AdminDatabase';
import { AdminContacts } from './AdminContacts';
import { AdminTemplates } from './AdminTemplates';
import { AdminWithdrawals } from './AdminWithdrawals';
import { AdminSettings } from './AdminSettings';
import { AdminAnnouncements } from './AdminAnnouncements';
import { AdminUsers } from './AdminUsers';
import { AdminLogs } from './AdminLogs';
import { AdminChatPanel } from './AdminChatPanel';

interface AdminDashboardPageProps {
  stats: DashboardStats | null;
  settings: SystemSettings | null;
  bots: Bot[];
  onRefresh: () => void;
  onToggleAutoBlast: (enabled: boolean) => void;
  onUpdateSettings: (newSettings: SystemSettings) => void;
  onExitAdmin: () => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  stats,
  settings,
  bots,
  onRefresh,
  onToggleAutoBlast,
  onUpdateSettings,
  onExitAdmin,
}) => {
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'database'
    | 'contacts'
    | 'templates'
    | 'withdrawals'
    | 'settings'
    | 'announcements'
    | 'users'
    | 'logs'
    | 'chat'
  >('overview');

  const navItems = [
    { id: 'overview', label: 'Command Center', icon: Activity },
    { id: 'database', label: 'Database Manager', icon: HardDrive },
    { id: 'chat', label: 'Live Chat User', icon: Headphones },
    { id: 'contacts', label: 'Antrian Kontak (Excel)', icon: FileSpreadsheet },
    { id: 'templates', label: 'Template Pesan', icon: MessageSquare },
    { id: 'withdrawals', label: 'Persetujuan WD', icon: Wallet },
    { id: 'settings', label: 'Delay & Tarif Rate', icon: Sliders },
    { id: 'announcements', label: 'Pengumuman', icon: Megaphone },
    { id: 'users', label: 'Daftar Member & Fleet', icon: Users },
    { id: 'logs', label: 'Log Transaksi', icon: Database },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-xs">
              NB
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-slate-900 tracking-tight text-base sm:text-lg">
                  NamsBlast
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>MASTER ADMIN</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Secure Route: /2026/namsblast/panel/only/admin
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onExitAdmin}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition border border-slate-200"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar Admin</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Components */}
        {activeTab === 'overview' && (
          <AdminOverview
            stats={stats}
            settings={settings}
            bots={bots}
            onRefresh={onRefresh}
            onToggleAutoBlast={onToggleAutoBlast}
            onNavigateTab={(tab) => setActiveTab(tab as any)}
          />
        )}

        {activeTab === 'database' && <AdminDatabase onRefreshStats={onRefresh} />}

        {activeTab === 'chat' && <AdminChatPanel onRefreshStats={onRefresh} />}

        {activeTab === 'contacts' && <AdminContacts onRefreshStats={onRefresh} />}

        {activeTab === 'templates' && <AdminTemplates onRefreshStats={onRefresh} />}

        {activeTab === 'withdrawals' && <AdminWithdrawals onRefreshStats={onRefresh} />}

        {activeTab === 'settings' && (
          <AdminSettings settings={settings} onUpdateSettings={onUpdateSettings} />
        )}

        {activeTab === 'announcements' && <AdminAnnouncements onRefreshStats={onRefresh} />}

        {activeTab === 'users' && <AdminUsers onRefreshStats={onRefresh} />}

        {activeTab === 'logs' && <AdminLogs />}
      </div>
    </div>
  );
};
