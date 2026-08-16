import React, { useState } from 'react';
import {
  LogOut,
  LogIn,
  UserPlus,
  Wallet,
  Smartphone,
  Menu,
  X,
  Gift,
  Coins,
  Bell,
  Sun,
  Moon,
} from 'lucide-react';
import { User, DashboardStats } from '../types';

interface NavbarProps {
  currentUser: User | null;
  activeUserTab: 'dashboard' | 'bots' | 'referrals' | 'withdrawals';
  setActiveUserTab: (tab: 'dashboard' | 'bots' | 'referrals' | 'withdrawals') => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onLogout: () => void;
  onOpenNotifications: () => void;
  announcementsCount: number;
  stats: DashboardStats | null;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeUserTab,
  setActiveUserTab,
  onOpenAuth,
  onLogout,
  onOpenNotifications,
  announcementsCount,
  darkMode,
  onToggleDarkMode,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (tab: 'dashboard' | 'bots' | 'referrals' | 'withdrawals') => {
    setActiveUserTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Left Section: Logo & Brand + User Navigation Tabs */}
          <div className="flex items-center space-x-4 sm:space-x-6">
            <div
              className="flex items-center space-x-2.5 cursor-pointer select-none"
              onClick={() => handleNavClick('dashboard')}
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-md shadow-emerald-600/25 text-white font-black text-xl shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.53 1.771.815 2.791.815 3.18 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.767-5.768-5.768zm3.374 8.163c-.144.405-.837.774-1.17.824-.312.045-.718.067-2.33-.598-1.933-.799-3.167-2.778-3.262-2.905-.096-.128-.778-1.034-.778-1.972 0-.938.492-1.398.667-1.589.175-.19.382-.239.509-.239.127 0 .254.001.365.006.118.005.276-.045.431.328.159.381.54 1.317.587 1.413.048.095.079.206.016.333-.064.127-.095.206-.191.317-.095.111-.2.248-.286.333-.095.096-.195.2-.084.39.111.19.493.813 1.058 1.316.726.647 1.339.847 1.53.942.19.095.302.079.413-.048.111-.127.476-.556.603-.746.127-.19.254-.159.429-.095.175.064 1.111.524 1.302.619.19.095.317.143.365.222.048.079.048.46-.096.865z" />
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 1.891.526 3.66 1.438 5.176L2 22l4.981-1.398A9.957 9.957 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.2a8.17 8.17 0 0 1-4.322-1.228l-.31-.184-2.96.83.845-2.887-.202-.321A8.175 8.175 0 0 1 3.8 12c0-4.522 3.678-8.2 8.2-8.2 4.521 0 8.2 3.678 8.2 8.2 0 4.522-3.679 8.2-8.2 8.2z" />
                </svg>
              </div>
              <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Nams<span className="text-emerald-600 dark:text-emerald-400">Blast</span>
              </span>
            </div>

            {currentUser && (
              <nav className="hidden lg:flex items-center space-x-1 border-l border-slate-200 dark:border-slate-800 pl-4 sm:pl-6">
                <button
                  id="nav-tab-dashboard"
                  onClick={() => handleNavClick('dashboard')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    activeUserTab === 'dashboard'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-extrabold border border-emerald-200 dark:border-emerald-800 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Coins className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Pendapatan</span>
                </button>

                <button
                  id="nav-tab-bots"
                  onClick={() => handleNavClick('bots')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    activeUserTab === 'bots'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-extrabold border border-emerald-200 dark:border-emerald-800 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>WhatsApp</span>
                </button>

                <button
                  id="nav-tab-withdrawals"
                  onClick={() => handleNavClick('withdrawals')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    activeUserTab === 'withdrawals'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-extrabold border border-emerald-200 dark:border-emerald-800 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Wallet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Dompet</span>
                </button>

                <button
                  id="nav-tab-referrals"
                  onClick={() => handleNavClick('referrals')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    activeUserTab === 'referrals'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-extrabold border border-emerald-200 dark:border-emerald-800 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Gift className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Referral</span>
                </button>
              </nav>
            )}
          </div>

          {/* Right Section: Dark Mode Toggle, Notifications, User/Auth */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            {/* Dark Mode Toggle Button */}
            <button
              id="btn-toggle-dark-mode"
              type="button"
              onClick={onToggleDarkMode}
              className="p-2 sm:p-2.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/80 shadow-2xs"
              title={darkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
            >
              {darkMode ? (
                <Sun className="w-4 h-4 text-amber-400 animate-spin-once" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {/* Notification Bell Button */}
            <button
              id="btn-navbar-notifications"
              onClick={onOpenNotifications}
              className="relative p-2 sm:p-2.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/80 shadow-2xs"
              title="Pusat Pengumuman & Notifikasi"
            >
              <Bell className="w-4 h-4" />
              {announcementsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs">
                  {announcementsCount}
                </span>
              )}
            </button>

            {currentUser ? (
              <div className="hidden sm:flex items-center space-x-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    Ref: <span className="font-bold text-emerald-600 dark:text-emerald-400">{currentUser.referralCode}</span>
                  </div>
                </div>
                <button
                  id="btn-logout-desktop"
                  onClick={onLogout}
                  title="Keluar dari Akun"
                  className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <button
                  id="btn-login-header"
                  onClick={() => onOpenAuth('login')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition"
                >
                  <LogIn className="w-3.5 h-3.5 inline mr-1" />
                  Masuk
                </button>
                <button
                  id="btn-register-header"
                  onClick={() => onOpenAuth('register')}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition"
                >
                  <UserPlus className="w-3.5 h-3.5 inline mr-1" />
                  Daftar
                </button>
              </div>
            )}

            {/* Mobile Hamburger Toggle Button */}
            <button
              id="btn-mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 transition"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-3 pb-5 space-y-2 animate-in slide-in-from-top-2 duration-200 shadow-lg">
          {currentUser ? (
            <>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl mb-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">{currentUser.name}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">{currentUser.email}</div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 font-bold">
                    Kode Ref: {currentUser.referralCode}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="px-2.5 py-1 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 hover:bg-red-100 rounded-lg font-bold transition flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" /> Keluar
                </button>
              </div>

              <button
                onClick={() => handleNavClick('dashboard')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                  activeUserTab === 'dashboard'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Coins className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Ringkasan &amp; Pendapatan</span>
              </button>

              <button
                onClick={() => handleNavClick('bots')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                  activeUserTab === 'bots'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Koneksi WhatsApp</span>
              </button>

              <button
                onClick={() => handleNavClick('withdrawals')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                  activeUserTab === 'withdrawals'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Wallet (Penarikan &amp; Riwayat)</span>
              </button>

              <button
                onClick={() => handleNavClick('referrals')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                  activeUserTab === 'referrals'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Gift className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Program Referral</span>
              </button>
            </>
          ) : (
            <div className="pt-2 space-y-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth('login');
                }}
                className="w-full py-3 text-center text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-xl"
              >
                Masuk ke Akun
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth('register');
                }}
                className="w-full py-3 text-center text-xs font-bold text-white bg-emerald-600 rounded-xl shadow-xs"
              >
                Daftar Akun Baru (Gratis)
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
