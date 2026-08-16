import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Smartphone,
  Coins,
  Send,
  Gift,
  Plus,
  ArrowUpRight,
  Radio,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { ApiService } from './services/api';
import {
  User,
  Bot,
  DashboardStats,
  SystemSettings,
  Announcement,
  SentLog,
  BotSpeed,
} from './types';
import { Navbar } from './components/Navbar';
import { ContactAvailabilityBanner } from './components/ContactAvailabilityBanner';
import { NotificationsModal } from './components/NotificationsModal';
import { AuthModal } from './components/AuthModal';
import { ConnectBotModal } from './components/ConnectBotModal';
import { BotCard } from './components/BotCard';
import { ReferralCard } from './components/ReferralCard';
import { WalletView } from './components/WalletView';
import { LiveChatWidget } from './components/LiveChatWidget';
import { GuestHomeView } from './components/GuestHomeView';
import { AuthRequiredCard } from './components/AuthRequiredCard';
import { AdminGate } from './components/AdminPanel/AdminGate';
import { AdminDashboardPage } from './components/AdminPanel/AdminDashboardPage';

const ADMIN_PATH = '/2026/namsblast/panel/only/admin';

export default function App() {
  // Routing Detection for Secret Admin Domain Path ONLY
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(() => {
    return (
      window.location.pathname === ADMIN_PATH ||
      window.location.pathname.startsWith('/2026/namsblast/panel/only/admin') ||
      window.location.hash === '#/2026/namsblast/panel/only/admin'
    );
  });

  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem('namsblast_admin_session_auth') === 'unlocked_2026';
  });

  // Dark Mode State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('namsblast_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Apply dark mode class to <html>
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('namsblast_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('namsblast_theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  // App Global State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeUserTab, setActiveUserTab] = useState<
    'dashboard' | 'bots' | 'referrals' | 'withdrawals'
  >('dashboard');

  // Real-time Data State
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [userBots, setUserBots] = useState<Bot[]>([]);
  const [liveLogs, setLiveLogs] = useState<SentLog[]>([]);

  // Modals State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [referralQuery, setReferralQuery] = useState('');
  const [showConnectBotModal, setShowConnectBotModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  // Path change listener for direct URL / navigation
  useEffect(() => {
    const handleLocationCheck = () => {
      const isMatch =
        window.location.pathname === ADMIN_PATH ||
        window.location.pathname.startsWith('/2026/namsblast/panel/only/admin') ||
        window.location.hash === '#/2026/namsblast/panel/only/admin';
      setIsAdminRoute(isMatch);
    };

    window.addEventListener('popstate', handleLocationCheck);
    return () => window.removeEventListener('popstate', handleLocationCheck);
  }, []);

  // Auto detect referral query code in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    if (refCode) {
      setReferralQuery(refCode);
      if (!currentUser) {
        setAuthMode('register');
        setShowAuthModal(true);
      }
    }
  }, [currentUser]);

  // Initial Boot
  useEffect(() => {
    bootInitialData();
  }, []);

  const bootInitialData = async () => {
    try {
      const [initialStats, initialSettings, initialAnnouncements] = await Promise.all([
        ApiService.getDashboardStats().catch(() => null),
        ApiService.getSettings().catch(() => null),
        ApiService.getAnnouncements().catch(() => []),
      ]);
      if (initialStats) setStats(initialStats);
      if (initialSettings) setSettings(initialSettings);
      if (initialAnnouncements) setAnnouncements(initialAnnouncements);

      const stored = localStorage.getItem('namsblast_user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.id) {
            const fresh = await ApiService.getUser(parsed.id);
            // Verify localStorage was not cleared while fetching
            if (fresh && localStorage.getItem('namsblast_user')) {
              setCurrentUser(fresh);
            } else {
              localStorage.removeItem('namsblast_user');
              setCurrentUser(null);
            }
          }
        } catch {
          localStorage.removeItem('namsblast_user');
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
    } catch (e) {
      console.error('Error booting initial data:', e);
    }
  };

  // Polling loop for live metrics, contact queue, and earning updates
  const refreshLiveState = useCallback(async () => {
    try {
      // Check stored user token/data first; if user is logged out, do not fetch user data
      const stored = localStorage.getItem('namsblast_user');
      const userId = stored ? currentUser?.id : null;

      const [newStats, newSettings, newAnnouncements, newLogs] = await Promise.all([
        ApiService.getDashboardStats(userId || undefined).catch(() => null),
        ApiService.getSettings().catch(() => null),
        ApiService.getAnnouncements().catch(() => []),
        ApiService.getLiveLogs(20).catch(() => []),
      ]);
      if (newStats) setStats(newStats);
      if (newSettings) setSettings(newSettings);
      if (newAnnouncements) setAnnouncements(newAnnouncements);
      if (newLogs && newLogs.length > 0) setLiveLogs(newLogs);

      if (stored && currentUser) {
        const [freshUser, freshBots] = await Promise.all([
          ApiService.getUser(currentUser.id).catch(() => null),
          ApiService.getUserBots(currentUser.id).catch(() => null),
        ]);
        if (localStorage.getItem('namsblast_user')) {
          if (freshUser) setCurrentUser(freshUser);
          if (freshBots) setUserBots(freshBots);
        }
      } else if (!stored && currentUser) {
        // User logged out elsewhere
        setCurrentUser(null);
        setUserBots([]);
      }
    } catch {
      // Quietly ignore background network glitch
    }
  }, [currentUser]);

  useEffect(() => {
    refreshLiveState();
    const interval = setInterval(refreshLiveState, 3000);
    return () => clearInterval(interval);
  }, [refreshLiveState]);

  // Auth Handlers
  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('namsblast_user', JSON.stringify(user));
    if (user.role === 'ADMIN') {
      sessionStorage.setItem('namsblast_admin_session_auth', 'unlocked_2026');
      setIsAdminUnlocked(true);
    }
    refreshLiveState();
  };

  const handleLogout = () => {
    localStorage.removeItem('namsblast_user');
    sessionStorage.removeItem('namsblast_admin_session_auth');
    sessionStorage.clear();
    setCurrentUser(null);
    setUserBots([]);
    setIsAdminUnlocked(false);
  };

  // Bot Handlers
  const handleBotSpeedChange = async (botId: string, speed: BotSpeed) => {
    if (!currentUser) return;
    try {
      await ApiService.updateBotSpeed(currentUser.id, botId, speed);
      refreshLiveState();
    } catch (e) {
      console.error(e);
    }
  };

  const handleBotStart = async (botId: string, speed: BotSpeed) => {
    try {
      await ApiService.startBot(botId, speed);
      refreshLiveState();
    } catch (err: any) {
      alert(err.message || 'Gagal memulai pengiriman');
    }
  };

  const handleBotStop = async (botId: string) => {
    try {
      await ApiService.stopBot(botId);
      refreshLiveState();
    } catch (err: any) {
      alert(err.message || 'Gagal menjeda pengiriman');
    }
  };

  const handleBotReconnect = async (botId: string) => {
    try {
      await ApiService.reconnectBot(botId);
      refreshLiveState();
    } catch (err: any) {
      alert(err.message || 'Gagal menyambungkan ulang');
    }
  };

  const handleBotDelete = async (botId: string) => {
    if (!currentUser) return;
    try {
      await ApiService.deleteBot(currentUser.id, botId);
      refreshLiveState();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleAutoBlast = async (enabled: boolean) => {
    if (!settings) return;
    try {
      const updated = await ApiService.updateSettingsAdmin({
        ...settings,
        autoBlastEnabled: enabled,
      });
      setSettings(updated);
      refreshLiveState();
    } catch (e) {
      console.error(e);
    }
  };

  // -------------------------------------------------------------
  // ADMIN PANEL ROUTE: /2026/namsblast/panel/only/admin
  // Strictly isolated. Accessible only via direct URL.
  // -------------------------------------------------------------
  if (isAdminRoute) {
    if (!isAdminUnlocked) {
      return (
        <AdminGate
          onUnlock={() => setIsAdminUnlocked(true)}
          onBackToUser={() => {
            window.history.pushState({}, '', '/');
            setIsAdminRoute(false);
          }}
        />
      );
    }

    return (
      <AdminDashboardPage
        stats={stats}
        settings={settings}
        bots={userBots}
        onRefresh={refreshLiveState}
        onToggleAutoBlast={handleToggleAutoBlast}
        onUpdateSettings={(newSet) => setSettings(newSet)}
        onExitAdmin={() => {
          sessionStorage.removeItem('namsblast_admin_session_auth');
          setIsAdminUnlocked(false);
          window.history.pushState({}, '', '/');
          setIsAdminRoute(false);
        }}
      />
    );
  }

  // -------------------------------------------------------------
  // USER WEB INTERFACE (Responsive, Light & Dark Theme)
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      {/* 1. Global Centered Navigation Bar with Theme Switcher */}
      <Navbar
        currentUser={currentUser}
        activeUserTab={activeUserTab}
        setActiveUserTab={setActiveUserTab}
        onOpenAuth={(mode) => {
          setAuthMode(mode);
          setShowAuthModal(true);
        }}
        onLogout={handleLogout}
        onOpenNotifications={() => setShowNotificationsModal(true)}
        announcementsCount={announcements.length}
        stats={stats}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
        {/* Contact Availability Real-time Banner */}
        {stats && settings && (
          <ContactAvailabilityBanner
            contactsAvailable={stats.globalContactsAvailable}
            contactsTotal={stats.globalContactsTotal}
            contactsSent={stats.globalContactsSent}
            emptyContactMessage={settings.emptyContactMessage}
          />
        )}

        {/* User Navigation Tabs (Only visible when user is logged in) */}
        {currentUser && (
          <div className="flex items-center space-x-1.5 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto no-scrollbar">
            {[
              { id: 'dashboard', label: 'Ringkasan & Pendapatan', icon: Coins },
              {
                id: 'bots',
                label: `Koneksi WhatsApp (${userBots.length})`,
                icon: Smartphone,
              },
              { id: 'withdrawals', label: 'Wallet', icon: Coins },
              { id: 'referrals', label: 'Program Referral', icon: Gift },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeUserTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-btn-${tab.id}`}
                  onClick={() => setActiveUserTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl text-xs sm:text-xs font-bold whitespace-nowrap transition ${
                    isActive
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* TAB 1: User Main Dashboard (Ringkasan & Pendapatan) */}
        {activeUserTab === 'dashboard' &&
          (currentUser ? (
            <div className="space-y-6">
              {/* 4 Hero Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1: Current Balance + Withdraw Quick Action */}
                <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 relative overflow-hidden shadow-xs">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                    <span>Saldo Siap Tarik</span>
                    <Coins className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2 font-mono">
                    Rp {(currentUser?.balance || 0).toLocaleString('id-ID')}
                  </div>
                  <div className="mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      Min: Rp {(settings?.minWithdraw || 20000).toLocaleString('id-ID')}
                    </span>
                    <button
                      onClick={() => setActiveUserTab('withdrawals')}
                      className="flex items-center space-x-1 px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
                    >
                      <span>Buka Wallet</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Card 2: Total Messages Sent */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <span>Pesan Terkirim</span>
                    <Send className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2 font-mono">
                    {(currentUser?.totalMessagesSent || 0).toLocaleString('id-ID')}
                    <span className="text-xs text-slate-400 ml-1 font-sans">pesan</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 text-[11px] text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-between">
                    <span>Rate: Rp {settings?.ratePerMessage || 50} / pesan</span>
                    <span className="text-slate-400 font-normal">Auto-Credit</span>
                  </div>
                </div>

                {/* Card 3: Total Earnings All-Time */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <span>Total Pendapatan</span>
                    <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2 font-mono">
                    Rp {(currentUser?.totalEarned || 0).toLocaleString('id-ID')}
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span>WA Aktif &amp; Komisi Referral</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Otomatis</span>
                  </div>
                </div>

                {/* Card 4: WA Aktif Status */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <span>WA Aktif Berjalan</span>
                    <Radio className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400 mt-2 font-mono">
                    {userBots.filter((b) => b.status === 'ONLINE' && b.isRunning).length}
                    <span className="text-xs text-slate-400 ml-1 font-sans">
                      / {userBots.length} Terhubung
                    </span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <button
                      onClick={() => setShowConnectBotModal(true)}
                      className="text-xs text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-bold flex items-center"
                    >
                      + Tambah WA Baru <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Section: Connected WhatsApp Fleet */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                      <Smartphone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <span>Daftar WhatsApp Anda ({userBots.length})</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Pilih kecepatan lalu klik tombol &quot;Mulai Kirim&quot; pada nomor WhatsApp Anda untuk mulai menghasilkan saldo.
                    </p>
                  </div>

                  <button
                    id="btn-add-new-bot-hero"
                    onClick={() => setShowConnectBotModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-sm shadow-emerald-600/20 flex items-center space-x-2 self-start sm:self-center"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Hubungkan WhatsApp</span>
                  </button>
                </div>

                {userBots.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userBots.map((bot) => (
                      <BotCard
                        key={bot.id}
                        bot={bot}
                        ratePerMessage={settings?.ratePerMessage || 50}
                        onSpeedChange={handleBotSpeedChange}
                        onStart={handleBotStart}
                        onStop={handleBotStop}
                        onReconnect={handleBotReconnect}
                        onDelete={handleBotDelete}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-8 sm:p-10 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
                      <Smartphone className="w-7 h-7" />
                    </div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">Belum Ada WhatsApp Terhubung</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-4 leading-relaxed">
                      Hubungkan WhatsApp Anda sekarang via Scan QR atau Kode Pairing 8-Digit, lalu tekan tombol Mulai untuk memperoleh saldo setiap pesan terkirim.
                    </p>
                    <button
                      onClick={() => setShowConnectBotModal(true)}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-sm"
                    >
                      Hubungkan WhatsApp Sekarang
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <GuestHomeView
              stats={stats}
              settings={settings}
              onOpenAuth={(mode) => {
                setAuthMode(mode);
                setShowAuthModal(true);
              }}
            />
          ))}

        {/* TAB 2: Koneksi WhatsApp Fleet View */}
        {activeUserTab === 'bots' &&
          (currentUser ? (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    Koneksi WhatsApp (Multi-Session)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Atur kecepatan pengiriman, mulai atau jeda tugas blast, serta putuskan koneksi sesuai kebutuhan Anda.
                  </p>
                </div>
                <button
                  onClick={() => setShowConnectBotModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center space-x-2 self-start sm:self-center shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Koneksi WhatsApp</span>
                </button>
              </div>

              {userBots.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userBots.map((bot) => (
                    <BotCard
                      key={bot.id}
                      bot={bot}
                      ratePerMessage={settings?.ratePerMessage || 50}
                      onSpeedChange={handleBotSpeedChange}
                      onStart={handleBotStart}
                      onStop={handleBotStop}
                      onReconnect={handleBotReconnect}
                      onDelete={handleBotDelete}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-8 sm:p-10 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
                    <Smartphone className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">Belum Ada Nomor WhatsApp</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-4 leading-relaxed">
                    Hubungkan nomor WhatsApp untuk mengaktifkan sesi blasting dan menghasilkan pendapatan.
                  </p>
                  <button
                    onClick={() => setShowConnectBotModal(true)}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-sm"
                  >
                    Hubungkan WhatsApp Sekarang
                  </button>
                </div>
              )}
            </div>
          ) : (
            <AuthRequiredCard
              title="Koneksi WhatsApp Memerlukan Akun"
              description="Daftar atau masuk ke akun NamsBlast Anda untuk menghubungkan nomor WhatsApp via Scan QR atau Pairing Code 8-Digit dan mulai menghasilkan saldo."
              onOpenAuth={(mode) => {
                setAuthMode(mode);
                setShowAuthModal(true);
              }}
            />
          ))}

        {/* TAB 3: Wallet (Penarikan Dana & Riwayat) */}
        {activeUserTab === 'withdrawals' && (
          <WalletView
            currentUser={currentUser}
            settings={settings}
            onRefreshUser={refreshLiveState}
            onOpenAuth={() => {
              setAuthMode('login');
              setShowAuthModal(true);
            }}
          />
        )}

        {/* TAB 4: Program Referral */}
        {activeUserTab === 'referrals' &&
          (currentUser ? (
            <ReferralCard currentUser={currentUser} />
          ) : (
            <AuthRequiredCard
              title="Program Referral NamsBlast"
              description="Dapatkan komisi pasif sebesar Rp 10 per pesan dari setiap pengiriman pesan bot WhatsApp downline yang Anda undang."
              onOpenAuth={(mode) => {
                setAuthMode(mode);
                setShowAuthModal(true);
              }}
            />
          ))}
      </main>

      {/* Clean Centered Footer */}
      <footer className="mt-12 border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 py-6 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center gap-1.5">
          <div className="font-black text-slate-900 dark:text-white text-base">
            Nams<span className="text-emerald-600 dark:text-emerald-400">Blast</span>
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-400 font-mono">
            &copy; {new Date().getFullYear()} NamsBlast. Hak cipta dilindungi.
          </div>
        </div>
      </footer>

      {/* Floating Live Chat Widget for Users */}
      <LiveChatWidget
        currentUser={currentUser}
        onOpenAuth={() => {
          setAuthMode('login');
          setShowAuthModal(true);
        }}
      />

      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
        announcements={announcements}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
        initialReferralCode={referralQuery}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Connect Bot QR / Pairing Code Modal */}
      <ConnectBotModal
        isOpen={showConnectBotModal}
        onClose={() => setShowConnectBotModal(false)}
        currentUser={currentUser}
        onBotConnected={() => {
          refreshLiveState();
        }}
      />
    </div>
  );
}
