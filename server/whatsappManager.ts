import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  type WASocket,
  type ConnectionState,
} from '@whiskeysockets/baileys';
import pino from 'pino';
import path from 'path';
import fs from 'fs';
import QRCode from 'qrcode';
import { EventEmitter } from 'events';
import { db } from './db';
import { Bot } from '../src/types';

export type AuthMethod = 'qr' | 'pairing_code';

export interface BotSession {
  botId: string;
  userId: string;
  authMethod: AuthMethod;
  phoneNumber?: string;
  sock: WASocket | null;
  qrCodeUrl: string | null;
  pairingCode: string | null;
  status: 'ONLINE' | 'OFFLINE' | 'CONNECTING' | 'PAIRING';
  lastSeen?: string;
  errorMessage?: string;
  isConnecting: boolean;
  sessionDir: string;
  stepLogs: Array<{ time: string; message: string; type: 'info' | 'success' | 'warning' | 'error' }>;
}

class WhatsAppManager extends EventEmitter {
  private sessions: Map<string, BotSession> = new Map();
  private authBaseDir: string;
  private logger = pino({ level: 'silent' });

  constructor() {
    super();
    this.authBaseDir = path.join(process.cwd(), '.whatsapp_sessions');
    if (!fs.existsSync(this.authBaseDir)) {
      fs.mkdirSync(this.authBaseDir, { recursive: true });
    }
  }

  public getSession(botId: string): BotSession | undefined {
    return this.sessions.get(botId);
  }

  public getStepLogs(botId: string): Array<{ time: string; message: string; type: 'info' | 'success' | 'warning' | 'error' }> {
    const session = this.sessions.get(botId);
    return session?.stepLogs || [];
  }

  public addStepLog(botId: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
    const session = this.sessions.get(botId);
    const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const logItem = { time, message, type };
    if (session) {
      session.stepLogs.push(logItem);
      if (session.stepLogs.length > 20) session.stepLogs.shift();
    }
    this.emit('step_log', { botId, log: logItem });
  }

  public isSocketOnline(botId: string): boolean {
    const session = this.sessions.get(botId);
    return !!session && session.status === 'ONLINE' && !!session.sock;
  }

  /**
   * Helper to format Indonesian phone number to standard international format (e.g. 6281234567890)
   */
  public formatInternationalPhone(phone: string): string {
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    }
    if (!clean.startsWith('62')) {
      clean = '62' + clean;
    }
    return clean;
  }

  /**
   * Initialize an isolated WhatsApp Multi-Device session for a specific user and bot
   * Dynamically handles 'qr' or 'pairing_code' authentication methods.
   */
  public async initBotSocket(
    botId: string,
    userId: string,
    options: {
      authMethod?: AuthMethod;
      phoneNumber?: string;
      botName?: string;
      /**
       * Fresh connection flows should clear old auth state. Automatic
       * reconnects must keep it or a temporary disconnect will log the user
       * out permanently.
       */
      resetAuth?: boolean;
    } = {}
  ): Promise<{
    bot: Bot;
    authMethod: AuthMethod;
    qrDataUrl?: string;
    pairingCode?: string;
  }> {
    const authMethod: AuthMethod = options.authMethod || (options.phoneNumber ? 'pairing_code' : 'qr');
    const resetAuth = options.resetAuth !== false;
    
    // Per-user isolated authentication directory to secure credentials
    const sessionDir = path.join(this.authBaseDir, `user_${userId}_bot_${botId}`);

    // Explicitly requested fresh sessions (new connection / refresh QR) must
    // start clean. Automatic reconnects pass resetAuth=false so valid
    // credentials are never deleted during a transient network failure.
    if (resetAuth && fs.existsSync(sessionDir)) {
      try {
        fs.rmSync(sessionDir, { recursive: true, force: true });
      } catch (e) {
        throw new Error('Gagal membersihkan sesi WhatsApp lama sebelum membuat koneksi baru.');
      }
    }

    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    // Terminate any existing socket instance for this bot
    const existing = this.sessions.get(botId);
    if (existing?.sock) {
      try {
        existing.sock.end(undefined);
      } catch (e) {
        // safely ignore
      }
    }

    const sessionData: BotSession = {
      botId,
      userId,
      authMethod,
      phoneNumber: options.phoneNumber,
      sock: null,
      qrCodeUrl: null,
      pairingCode: null,
      status: authMethod === 'pairing_code' ? 'PAIRING' : 'CONNECTING',
      isConnecting: true,
      sessionDir,
      stepLogs: [],
    };
    this.sessions.set(botId, sessionData);
    this.addStepLog(botId, `Gateway session diinisialisasi untuk Bot (${botId}) via metode [${authMethod.toUpperCase()}]`, 'info');
    this.emit('status', { botId, userId, status: sessionData.status });

    // Multi-file Auth state isolated for this user bot
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version, isLatest } = await fetchLatestBaileysVersion().catch(() => ({
      version: [2, 3000, 1015901307] as [number, number, number],
      isLatest: true,
    }));

    console.log(`[WhatsApp Manager] Initializing isolated session for User (${userId}), Bot (${botId}) via [${authMethod.toUpperCase()}]`);
    this.addStepLog(botId, 'Membuka socket Multi-Device Baileys dengan enkripsi end-to-end...', 'info');

    const sock = makeWASocket({
      version,
      logger: this.logger,
      printQRInTerminal: false,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, this.logger),
      },
      browser: ['Ubuntu', 'Chrome', '20.0.04'],
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 25000,
      emitOwnEvents: false,
      markOnlineOnConnect: true,
      syncFullHistory: false,
    });

    sessionData.sock = sock;

    // Persist and secure session tokens whenever credentials update
    sock.ev.on('creds.update', async () => {
      try {
        await saveCreds();
      } catch (err) {
        console.error(`[WhatsApp Manager] Error securing credentials for bot ${botId}:`, err);
      }
    });

    // Handle connection lifecycle (QR streaming, authenticated open, disconnect)
    sock.ev.on('connection.update', async (update: Partial<ConnectionState>) => {
      // A refresh/new connection can replace this socket while the old one is
      // still emitting close/open events. Ignore stale events so an old
      // socket cannot overwrite the new session state or trigger reconnects.
      if (this.sessions.get(botId) !== sessionData) {
        return;
      }

      const { connection, lastDisconnect, qr } = update;

      // QR is only a user-facing auth method. Baileys may emit an internal QR
      // update while preparing a pairing-code session; never expose that as
      // the selected auth flow.
      if (qr && authMethod === 'qr') {
        console.log(`[WhatsApp Manager] Raw Baileys QR received for bot ${botId}`);
        try {
          const qrDataUrl = await QRCode.toDataURL(qr, {
            margin: 2,
            scale: 6,
            color: {
              dark: '#064e3b',
              light: '#ffffff',
            },
          });
          sessionData.qrCodeUrl = qrDataUrl;

          // Update database with latest QR
          db.updateBot(botId, {
            qrCodeData: qrDataUrl,
            status: 'CONNECTING',
          });

          this.addStepLog(botId, 'QR Code aktif diterbitkan oleh server WhatsApp. Siap di-scan di ponsel Anda.', 'success');
          this.emit('qr', { botId, userId, qrDataUrl });
        } catch (qrErr) {
          console.error('[WhatsApp Manager] Failed to convert QR string to Data URL:', qrErr);
        }
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        console.log(
          `[WhatsApp Manager] Connection closed for bot ${botId}. Status: ${statusCode}. Auto-reconnect: ${shouldReconnect}`
        );

        sessionData.status = 'OFFLINE';
        sessionData.isConnecting = false;

        db.updateBot(botId, {
          status: 'OFFLINE',
          isRunning: false,
        });

        this.addStepLog(botId, `Koneksi sesi socket tertutup (Status Code: ${statusCode || 'Unknown'}).`, 'warning');
        this.emit('disconnected', { botId, userId, statusCode, shouldReconnect });

        if (shouldReconnect && fs.existsSync(sessionDir)) {
          setTimeout(() => {
            if (this.sessions.has(botId)) {
              this.initBotSocket(botId, userId, { ...options, resetAuth: false }).catch((err) =>
                console.error(`[WhatsApp Manager] Auto-reconnect failed for bot ${botId}:`, err)
              );
            }
          }, 6000);
        }
      } else if (connection === 'open') {
        // Status berubah menjadi 'CONNECTED' / 'ONLINE', amankan token sesi
        console.log(`[WhatsApp Manager] ✅ Bot ${botId} CONNECTED and authenticated! Token directory secured at ${sessionDir}`);
        sessionData.status = 'ONLINE';
        sessionData.isConnecting = false;
        sessionData.qrCodeUrl = null;
        sessionData.pairingCode = null;

        const userJid = sock.user?.id || '';
        const realPhone = userJid ? userJid.split(':')[0].replace(/[^0-9]/g, '') : options.phoneNumber || '';
        const realName = sock.user?.name || options.botName || `WhatsApp (${realPhone || 'Terhubung'})`;

        const updatedBot = db.updateBot(botId, {
          status: 'ONLINE',
          phone: realPhone ? this.formatInternationalPhone(realPhone) : undefined,
          name: realName,
          qrCodeData: null,
          pairingCode: null,
          lastActive: new Date().toISOString(),
        });

        this.addStepLog(botId, '✅ Otorisasi Handshake WhatsApp Berhasil! Bot kini ONLINE.', 'success');
        this.emit('connected', { botId, userId, bot: updatedBot });
      }
    });

    // Pairing codes must come from WhatsApp/Baileys. Never generate a local
    // fallback: a fabricated code looks valid but can never be accepted by
    // the WhatsApp mobile app.
    let generatedPairingCode: string | undefined = undefined;
    if (authMethod === 'pairing_code' && options.phoneNumber && !state.creds.registered) {
      const internationalPhone = this.formatInternationalPhone(options.phoneNumber);
      if (!/^62\d{8,13}$/.test(internationalPhone)) {
        throw new Error('Nomor WhatsApp tidak valid. Gunakan format 08123456789 atau 628123456789.');
      }

      console.log(`[WhatsApp Manager] Requesting genuine Baileys pairing code for phone: ${internationalPhone}`);
      this.addStepLog(botId, `Mengirim permintaan kode pairing 8-digit untuk nomor ${internationalPhone}...`, 'info');

      let rawCode = '';
      let lastError: any = null;

      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          await new Promise((resolve) => setTimeout(resolve, attempt === 1 ? 3000 : 2000));
          rawCode = await sock.requestPairingCode(internationalPhone);
          if (rawCode) break;
        } catch (pairErr: any) {
          lastError = pairErr;
          console.warn(`[WhatsApp Manager] Pairing code request attempt ${attempt} warning:`, pairErr?.message || pairErr);
        }
      }

      if (!rawCode) {
        const reason = lastError?.message ? ` Detail: ${lastError.message}` : '';
        const errorMessage = `WhatsApp tidak mengeluarkan kode pairing asli setelah 3 percobaan.${reason}`;
        sessionData.status = 'OFFLINE';
        sessionData.isConnecting = false;
        db.updateBot(botId, {
          status: 'OFFLINE',
          isRunning: false,
          pairingCode: null,
        });
        this.addStepLog(botId, errorMessage, 'error');
        this.sessions.delete(botId);
        try {
          sock.end(undefined);
        } catch {
          // The socket is already unusable; the request still returns the
          // actionable pairing error below.
        }
        throw new Error(errorMessage);
      }

      if (rawCode) {
        // Baileys returns an 8-character code. Normalize only its display
        // formatting; never alter the actual code contents or invent one.
        const normalizedCode = rawCode.replace(/[^a-z0-9]/gi, '').toUpperCase();
        if (normalizedCode.length !== 8) {
          const errorMessage = 'WhatsApp mengembalikan kode pairing dengan format yang tidak valid. Silakan coba lagi.';
          sessionData.status = 'OFFLINE';
          sessionData.isConnecting = false;
          db.updateBot(botId, {
            status: 'OFFLINE',
            isRunning: false,
            pairingCode: null,
          });
          this.addStepLog(botId, errorMessage, 'error');
          this.sessions.delete(botId);
          try {
            sock.end(undefined);
          } catch {
            // Ignore cleanup errors and return the validation error.
          }
          throw new Error(errorMessage);
        }

        const formattedCode = `${normalizedCode.substring(0, 4)}-${normalizedCode.substring(4, 8)}`;

        sessionData.pairingCode = formattedCode;
        generatedPairingCode = formattedCode;

        db.updateBot(botId, {
          pairingCode: formattedCode,
          phone: internationalPhone,
          status: 'PAIRING',
        });
        console.log(`[WhatsApp Manager] ✅ Genuine Baileys pairing code successfully generated: ${formattedCode}`);
        this.addStepLog(botId, `Kode Pairing Diterbitkan: [${formattedCode}]. Masukkan pada WhatsApp HP Anda (Perangkat Tertaut > Tautkan dengan nomor telepon).`, 'success');
        this.emit('pairing_code', { botId, userId, pairingCode: formattedCode });
      }
    }

    // Wait briefly for QR code string if method is QR
    if (authMethod === 'qr') {
      for (let i = 0; i < 25; i++) {
        if (sessionData.qrCodeUrl) break;
        await new Promise((res) => setTimeout(res, 200));
      }
    }

    const updatedBot = db.getBotById(botId)!;
    return {
      bot: updatedBot,
      authMethod,
      qrDataUrl: sessionData.qrCodeUrl || updatedBot?.qrCodeData || undefined,
      pairingCode: generatedPairingCode || sessionData.pairingCode || updatedBot?.pairingCode || undefined,
    };
  }

  /**
   * Send WhatsApp text message via the active Baileys socket
   */
  public async sendMessage(
    botId: string,
    recipientPhone: string,
    messageText: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const session = this.sessions.get(botId);
    const cleanPhone = this.formatInternationalPhone(recipientPhone);
    const jid = cleanPhone.includes('@') ? cleanPhone : `${cleanPhone}@s.whatsapp.net`;

    if (session?.sock && session.status === 'ONLINE') {
      try {
        console.log(`[WhatsApp Manager] 📤 Sending message to ${jid} via socket of Bot ${botId}`);
        const result = await session.sock.sendMessage(jid, {
          text: messageText,
        });

        return {
          success: true,
          messageId: result?.key?.id || `msg_${Date.now()}`,
        };
      } catch (sendErr: any) {
        console.error(`[WhatsApp Manager] Socket dispatch notice:`, sendErr?.message || sendErr);
        return {
          success: false,
          error: sendErr?.message || 'Pesan gagal dikirim melalui WhatsApp.',
        };
      }
    } else {
      return {
        success: false,
        error: 'WhatsApp belum online. Hubungkan kembali sebelum mengirim pesan.',
      };
    }
  }

  /**
   * Refresh and regenerate a brand new unique QR Code session for the bot
   */
  public async refreshBotQR(botId: string, userId: string): Promise<{ qrDataUrl?: string; bot: Bot }> {
    const existing = db.getBotById(botId);
    if (!existing) {
      throw new Error('Bot tidak ditemukan.');
    }

    this.addStepLog(botId, 'Memperbarui sesi dan meminta QR Code unik baru dari server WhatsApp...', 'info');

    // Re-initialize socket with clean credentials
    const result = await this.initBotSocket(botId, userId || existing.userId, {
      authMethod: 'qr',
      botName: existing.name,
      resetAuth: true,
    });

    return {
      qrDataUrl: result.qrDataUrl,
      bot: result.bot,
    };
  }

  /**
   * Verify and confirm connection (called when user completes pairing or QR scan)
   */
  public async verifyAndActivateBot(botId: string): Promise<Bot | null> {
    const session = this.sessions.get(botId);
    if (!session?.sock || session.status !== 'ONLINE') {
      throw new Error('WhatsApp belum terhubung. Selesaikan scan QR atau masukkan kode pairing terlebih dahulu.');
    }

    const updated = db.updateBot(botId, {
      status: 'ONLINE',
      qrCodeData: null,
      pairingCode: null,
      lastActive: new Date().toISOString(),
    });
    if (updated) {
      this.emit('connected', { botId, userId: updated.userId, bot: updated });
    }
    return updated || null;
  }

  /**
   * Disconnect and clear user session files
   */
  public async disconnectBot(botId: string): Promise<void> {
    const session = this.sessions.get(botId);
    if (session?.sock) {
      try {
        session.sock.end(undefined);
      } catch (e) {
        // safely ignore
      }
    }

    if (session?.sessionDir && fs.existsSync(session.sessionDir)) {
      try {
        fs.rmSync(session.sessionDir, { recursive: true, force: true });
        console.log(`[WhatsApp Manager] Cleared session folder: ${session.sessionDir}`);
      } catch (e) {
        console.error(`[WhatsApp Manager] Failed to remove session dir:`, e);
      }
    }
    const userId = session?.userId;
    this.sessions.delete(botId);

    db.updateBot(botId, {
      status: 'OFFLINE',
      isRunning: false,
      qrCodeData: null,
      pairingCode: null,
    });

    this.emit('disconnected', { botId, userId, statusCode: 200, manual: true });
  }
}

export const whatsappManager = new WhatsAppManager();
