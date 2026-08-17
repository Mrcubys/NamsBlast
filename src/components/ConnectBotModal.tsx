import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  KeyRound,
  X,
  Smartphone,
  CheckCircle2,
  RefreshCw,
  Copy,
  Check,
  Info,
  ShieldCheck,
  Terminal,
  Activity,
  Radio,
  Wifi,
  Sparkles,
} from 'lucide-react';
import { User, Bot } from '../types';
import { ApiService } from '../services/api';
import { whatsappEngine, StepLogItem } from '../services/whatsappEngine';

interface ConnectBotModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onBotConnected: (bot: Bot) => void;
}

export const ConnectBotModal: React.FC<ConnectBotModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onBotConnected,
}) => {
  const [tab, setTab] = useState<'qr' | 'pairing'>('qr');
  const [botName, setBotName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshingQr, setRefreshingQr] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active Session State
  const [activeBot, setActiveBot] = useState<Bot | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState<number>(60);
  const [isVerifying, setIsVerifying] = useState(false);
  const [connectedSuccess, setConnectedSuccess] = useState(false);

  // Step-by-Step Verification Logs
  const [stepLogs, setStepLogs] = useState<StepLogItem[]>([]);

  // Ref to track modal open transition
  const prevIsOpenRef = useRef(false);

  const addLocalLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setStepLogs((prev) => {
      // Prevent identical consecutive duplicate logs
      if (prev.length > 0 && prev[prev.length - 1].message === message) {
        return prev;
      }
      const updated = [...prev, { time, message, type }];
      if (updated.length > 25) updated.shift();
      return updated;
    });
  };

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      setError(null);
      setActiveBot(null);
      setQrCodeData(null);
      setPairingCode(null);
      setConnectedSuccess(false);
      setStepLogs([]);
      setBotName(`WhatsApp ${currentUser?.name || 'Saya'}`);
      setPhoneNumber('');
      setCountdown(60);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, currentUser]);

  // Countdown timer for QR / Pairing
  useEffect(() => {
    if (!activeBot || countdown <= 0 || connectedSuccess) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (tab === 'qr' && !connectedSuccess) {
            addLocalLog('Sesi QR telah habis waktu. Anda dapat mengklik "Perbarui QR Baru".', 'warning');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeBot, countdown, connectedSuccess, tab]);

  // Real-time WhatsApp socket connection listener & WebSocket / SSE events
  useEffect(() => {
    if (!activeBot || connectedSuccess || !currentUser) return;

    const unsubConnected = whatsappEngine.on('connected', (data) => {
      if (data.botId === activeBot.id) {
        addLocalLog('✅ Otorisasi Handshake WhatsApp Berhasil! Bot status: ONLINE.', 'success');
        setConnectedSuccess(true);
        setTimeout(() => {
          onBotConnected(data.bot);
          onClose();
        }, 1200);
      }
    });

    const unsubQr = whatsappEngine.on('qr_received', (data) => {
      if (data.botId === activeBot.id) {
        setQrCodeData(data.qrDataUrl);
        setCountdown(60);
        addLocalLog('QR Code sesi unik diterima dari gateway WhatsApp.', 'success');
      }
    });

    const unsubPairing = whatsappEngine.on('pairing_code_received', (data) => {
      if (data.botId === activeBot.id) {
        setPairingCode(data.pairingCode);
        addLocalLog(`Kode Pairing Resmi Diterbitkan: ${data.pairingCode}`, 'success');
      }
    });

    const unsubStepLog = whatsappEngine.on('step_log', (data) => {
      if (data.botId === activeBot.id && data.log) {
        setStepLogs((prev) => {
          if (prev.some((l) => l.message === data.log.message && l.time === data.log.time)) {
            return prev;
          }
          const next = [...prev, data.log];
          if (next.length > 25) next.shift();
          return next;
        });
      }
    });

    const unsubError = whatsappEngine.on('error', (data) => {
      if (!data.botId || data.botId === activeBot.id) {
        setError(data.error);
        addLocalLog(`Error: ${data.error}`, 'error');
      }
    });

    return () => {
      unsubConnected();
      unsubQr();
      unsubPairing();
      unsubStepLog();
      unsubError();
    };
  }, [activeBot, connectedSuccess, currentUser, onBotConnected, onClose]);

  // Fast Adaptive Status Polling as robust fallback
  useEffect(() => {
    if (!activeBot || connectedSuccess) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await ApiService.getBotStatus(activeBot.id);
        if (res.stepLogs && res.stepLogs.length > 0) {
          setStepLogs(res.stepLogs);
        }
        if (res.qrCodeData && (!qrCodeData || qrCodeData !== res.qrCodeData)) {
          setQrCodeData(res.qrCodeData);
        }
        if (res.pairingCode && (!pairingCode || pairingCode !== res.pairingCode)) {
          setPairingCode(res.pairingCode);
        }
        if (res.bot.status === 'ONLINE' || res.isOnline) {
          setConnectedSuccess(true);
          addLocalLog('✅ Status Bot Terkonfirmasi ONLINE via Gateway Backend.', 'success');
          setTimeout(() => {
            onBotConnected(res.bot);
            onClose();
          }, 1200);
        }
      } catch (e) {
        // quiet error
      }
    }, 1200);

    return () => clearInterval(pollInterval);
  }, [activeBot, connectedSuccess, onBotConnected, onClose, qrCodeData, pairingCode]);

  if (!isOpen) return null;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(e.target.value);
  };

  const handleConnect = async (selectedMethod: 'qr' | 'pairing_code') => {
    if (!currentUser) return;
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');

    if (selectedMethod === 'pairing_code' && (!cleanPhone || cleanPhone.length < 8)) {
      setError('Masukkan nomor WhatsApp yang valid (contoh: 08123456789 atau 628123456789).');
      return;
    }

    setLoading(true);
    setError(null);
    setStepLogs([]);
    addLocalLog(`Membuat sesi gateway unik [${selectedMethod.toUpperCase()}] dengan enkripsi end-to-end...`, 'info');

    try {
      const res = await whatsappEngine.startSession(currentUser.id, {
        authMethod: selectedMethod,
        phoneNumber: selectedMethod === 'pairing_code' ? cleanPhone : undefined,
        name: botName.trim() || (selectedMethod === 'pairing_code' ? `WhatsApp (${cleanPhone})` : 'WhatsApp Multi-Device'),
      });

      setActiveBot(res.bot);
      if (selectedMethod === 'qr') {
        setQrCodeData(res.qrDataUrl || null);
        setCountdown(60);
        addLocalLog('QR Code sesi baru berhasil diterbitkan oleh gateway WhatsApp.', 'info');
      } else {
        setPairingCode(res.pairingCode || null);
        setCountdown(120);
        addLocalLog(`Kode pairing 8-digit terbit: ${res.pairingCode || 'Menunggu sinyal...'}`, 'info');
      }
    } catch (err: any) {
      const errMsg = err.message || 'Gagal menginisialisasi sesi WhatsApp.';
      setError(errMsg);
      addLocalLog(`Inisialisasi gagal: ${errMsg}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshQR = async () => {
    if (!activeBot || !currentUser) return;
    setRefreshingQr(true);
    setError(null);
    addLocalLog('Meminta QR Code unik baru dari server gateway...', 'info');

    try {
      const newQrUrl = await whatsappEngine.refreshQR(currentUser.id, activeBot.id);
      if (newQrUrl) {
        setQrCodeData(newQrUrl);
        setCountdown(60);
        addLocalLog('✅ QR Code unik baru berhasil diperbarui.', 'success');
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Gagal memperbarui QR code.';
      setError(errMsg);
      addLocalLog(`Pembaruan QR gagal: ${errMsg}`, 'error');
    } finally {
      setRefreshingQr(false);
    }
  };

  const handleConfirmConnection = async () => {
    if (!activeBot || !currentUser) return;
    setIsVerifying(true);
    setError(null);
    addLocalLog('Memverifikasi status sesi dan mengaktifkan bot ke database...', 'info');

    try {
      const bot = await whatsappEngine.verifySession(currentUser.id, activeBot.id);
      addLocalLog('✅ Verifikasi berhasil! Bot WhatsApp siap digunakan.', 'success');
      setConnectedSuccess(true);
      setTimeout(() => {
        onBotConnected(bot);
        onClose();
      }, 1000);
    } catch (err: any) {
      const errMsg = err.message || 'Gagal memverifikasi koneksi WhatsApp.';
      setError(errMsg);
      addLocalLog(`Verifikasi gagal: ${errMsg}`, 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCopyCode = () => {
    if (pairingCode) {
      navigator.clipboard.writeText(pairingCode.replace('-', ''));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/90">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center shadow-xs shrink-0">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.53 1.771.815 2.791.815 3.18 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.767-5.768-5.768zm3.374 8.163c-.144.405-.837.774-1.17.824-.312.045-.718.067-2.33-.598-1.933-.799-3.167-2.778-3.262-2.905-.096-.128-.778-1.034-.778-1.972 0-.938.492-1.398.667-1.589.175-.19.382-.239.509-.239.127 0 .254.001.365.006.118.005.276-.045.431.328.159.381.54 1.317.587 1.413.048.095.079.206.016.333-.064.127-.095.206-.191.317-.095.111-.2.248-.286.333-.095.096-.195.2-.084.39.111.19.493.813 1.058 1.316.726.647 1.339.847 1.53.942.19.095.302.079.413-.048.111-.127.476-.556.603-.746.127-.19.254-.159.429-.095.175.064 1.111.524 1.302.619.19.095.317.143.365.222.048.079.048.46-.096.865z" />
                <path d="M12 2C6.477 2 2 6.477 2 12c0 1.891.526 3.66 1.438 5.176L2 22l4.981-1.398A9.957 9.957 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.2a8.17 8.17 0 0 1-4.322-1.228l-.31-.184-2.96.83.845-2.887-.202-.321A8.175 8.175 0 0 1 3.8 12c0-4.522 3.678-8.2 8.2-8.2 4.521 0 8.2 3.678 8.2 8.2 0 4.522-3.679 8.2-8.2 8.2z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">Hubungkan WhatsApp</h3>
                {activeBot && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live Sync
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Tautkan akun WhatsApp untuk mulai menjalankan sesi blast</p>
            </div>
          </div>
          <button
            id="btn-close-connect-modal"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/80 text-red-700 dark:text-red-300 rounded-xl text-xs flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {connectedSuccess ? (
            /* Success Feedback View */
            <div className="py-8 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white">WhatsApp Berhasil Terhubung!</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Nomor siap digunakan. Pilih kecepatan dan klik tombol &quot;Mulai Kirim&quot; di dashboard.
                </p>
              </div>
            </div>
          ) : !activeBot ? (
            <>
              {/* Tab Selector: Pairing Code vs QR Code */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
                <button
                  type="button"
                  id="tab-select-pairing"
                  onClick={() => {
                    setTab('pairing');
                    setError(null);
                  }}
                  className={`flex items-center justify-center space-x-2 py-2 text-xs font-bold rounded-lg transition ${
                    tab === 'pairing'
                      ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Kode Pairing (8 Karakter)</span>
                </button>
                <button
                  type="button"
                  id="tab-select-qr"
                  onClick={() => {
                    setTab('qr');
                    setError(null);
                  }}
                  className={`flex items-center justify-center space-x-2 py-2 text-xs font-bold rounded-lg transition ${
                    tab === 'qr'
                      ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>Scan QR Code Unik</span>
                </button>
              </div>

              {/* Bot Name / Label Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nama Label Akun WhatsApp (Opsional)
                </label>
                <input
                  id="input-connect-bot-name"
                  type="text"
                  value={botName}
                  onChange={(e) => setBotName(e.target.value)}
                  placeholder="Contoh: WhatsApp Bisnis Utama, CS Toko..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Phone Number Input (Required for Pairing, Optional for QR) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nomor WhatsApp Anda {tab === 'pairing' && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-extrabold text-slate-400">
                    WA
                  </span>
                  <input
                    id="input-connect-phone-number"
                    type="tel"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    placeholder="081234567890 atau 628123456789"
                    className="w-full pl-11 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Masukkan nomor WhatsApp aktif di HP Anda. Format: 08xxx atau 628xxx.
                </p>
              </div>

              {/* Instructions Box */}
              <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/50 rounded-xl space-y-2">
                <h5 className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Langkah Menghubungkan WhatsApp:
                </h5>
                <ol className="text-[11px] text-emerald-800 dark:text-emerald-400/90 space-y-1 pl-4 list-decimal leading-relaxed">
                  <li>Buka WhatsApp di HP Anda.</li>
                  <li>Ketuk Menu (titik tiga) atau Pengaturan &gt; <b>Perangkat Tertaut</b>.</li>
                  <li>
                    {tab === 'pairing' ? (
                      <span>Pilih <b>&quot;Tautkan dengan nomor telepon saja&quot;</b> lalu masukkan kode pairing 8 karakter.</span>
                    ) : (
                      <span>Pilih <b>&quot;Tautkan Perangkat&quot;</b> lalu scan QR Code unik yang tampil di layar.</span>
                    )}
                  </li>
                </ol>
              </div>

              {/* Action Button */}
              <button
                id="btn-generate-session"
                onClick={() => handleConnect(tab === 'pairing' ? 'pairing_code' : 'qr')}
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center space-x-2 shadow-md shadow-emerald-700/20"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menghubungkan ke Gateway WhatsApp...</span>
                  </>
                ) : tab === 'pairing' ? (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Dapatkan Kode Pairing 8-Karakter</span>
                  </>
                ) : (
                  <>
                    <QrCode className="w-4 h-4" />
                    <span>Tampilkan QR Code WhatsApp Unik</span>
                  </>
                )}
              </button>
            </>
          ) : (
            /* Active Session View (QR Code or Pairing Code Handshake) */
            <div className="space-y-5 text-center">
              {tab === 'qr' && (
                <div className="space-y-3">
                  {qrCodeData ? (
                    <div className="relative inline-block">
                      <div className="p-3 bg-white rounded-2xl border-2 border-emerald-400 dark:border-emerald-500 shadow-md">
                        <img
                          src={qrCodeData}
                          alt="WhatsApp Session QR Code"
                          className="w-56 h-56 mx-auto rounded-lg"
                        />
                      </div>
                      {countdown === 0 && (
                        <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center p-4 text-white space-y-2">
                          <span className="text-xs font-bold text-amber-300">QR Code Kedaluwarsa</span>
                          <button
                            type="button"
                            onClick={handleRefreshQR}
                            disabled={refreshingQr}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${refreshingQr ? 'animate-spin' : ''}`} />
                            <span>Perbarui QR Baru</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-56 h-56 mx-auto bg-slate-100 dark:bg-slate-800 rounded-2xl flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-500">
                      <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
                      <span className="text-xs font-medium">Memuat QR Code unik...</span>
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-3">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Arahkan kamera WhatsApp Anda ke QR Code di atas
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Sesi QR kedaluwarsa dalam: <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono">{countdown} detik</span>
                    </span>
                    <button
                      type="button"
                      id="btn-refresh-qr"
                      onClick={handleRefreshQR}
                      disabled={refreshingQr}
                      className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${refreshingQr ? 'animate-spin' : ''}`} />
                      <span>Muat Ulang QR</span>
                    </button>
                  </div>
                </div>
              )}

              {tab === 'pairing' && pairingCode && (
                <div className="space-y-4 py-2">
                  <div className="p-5 bg-slate-50 dark:bg-slate-800/80 border-2 border-emerald-300 dark:border-emerald-700 rounded-2xl max-w-xs mx-auto">
                    <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                      Kode Pairing WhatsApp
                    </span>
                    <div className="text-3xl font-black font-mono tracking-widest text-emerald-700 dark:text-emerald-400 my-2">
                      {pairingCode}
                    </div>
                    <button
                      type="button"
                      id="btn-copy-pairing-code"
                      onClick={handleCopyCode}
                      className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg shadow-2xs transition"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Kode Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin Kode</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-left p-3.5 rounded-xl text-xs space-y-1.5 text-slate-700 dark:text-slate-300 max-w-md mx-auto">
                    <div className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Cara Memasukkan Kode di WhatsApp HP:</span>
                    </div>
                    <ol className="list-decimal pl-4 space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                      <li>Buka aplikasi WhatsApp di HP Anda.</li>
                      <li>Buka <b>Menu (titik tiga)</b> atau <b>Pengaturan</b> &gt; <b>Perangkat Tertaut</b>.</li>
                      <li>Ketuk <b>Tautkan Perangkat</b>.</li>
                      <li>Di bawah scanner kamera, ketuk <b>&quot;Tautkan dengan nomor telepon saja&quot;</b>.</li>
                      <li>Masukkan 8 karakter kode pairing di atas.</li>
                    </ol>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Kedaluwarsa dalam: <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono">{countdown} detik</span>
                  </p>
                </div>
              )}

              {/* Status Indicator */}
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-center space-x-2">
                <RefreshCw className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-spin" />
                <span>Menunggu otentikasi dari aplikasi WhatsApp di HP Anda...</span>
              </div>

              {/* Step-by-Step Verification Logs Console */}
              {stepLogs.length > 0 && (
                <div className="text-left bg-slate-900 dark:bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 border-b border-slate-800 pb-1.5">
                    <div className="flex items-center space-x-1.5">
                      <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Log Gateway WhatsApp (Baileys Multi-Device):</span>
                    </div>
                    <span className="text-emerald-400 flex items-center space-x-1">
                      <Activity className="w-3 h-3 animate-pulse" />
                      <span>Realtime WebSocket</span>
                    </span>
                  </div>
                  <div className="space-y-1 max-h-28 overflow-y-auto font-mono text-[10px]">
                    {stepLogs.map((log, idx) => (
                      <div key={idx} className="flex items-start space-x-1.5 leading-tight">
                        <span className="text-slate-500 shrink-0">[{log.time}]</span>
                        <span
                          className={
                            log.type === 'success'
                              ? 'text-emerald-400 font-semibold'
                              : log.type === 'error'
                              ? 'text-rose-400'
                              : log.type === 'warning'
                              ? 'text-amber-300'
                              : 'text-slate-300'
                          }
                        >
                          {log.message}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Confirm / Finish Connection Button */}
              <div className="pt-2 space-y-2">
                <button
                  id="btn-confirm-connect-success"
                  onClick={handleConfirmConnection}
                  disabled={isVerifying}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center space-x-2 shadow-md shadow-emerald-700/20"
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Menyimpan &amp; Memverifikasi Koneksi...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Selesaikan &amp; Hubungkan WhatsApp</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveBot(null);
                    setQrCodeData(null);
                    setPairingCode(null);
                  }}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition"
                >
                  Ubah Nomor / Ganti Metode
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
