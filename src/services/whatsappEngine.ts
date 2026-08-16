import { Bot } from '../types';
import { ApiService } from './api';

export type AuthMethod = 'qr' | 'pairing_code';
export type ConnectionStatus = 'CONNECTING' | 'PAIRING' | 'ONLINE' | 'OFFLINE';

export interface StoredSessionInfo {
  botId: string;
  userId: string;
  authMethod: AuthMethod;
  phoneNumber?: string;
  name?: string;
  status: ConnectionStatus;
  createdAt: string;
  lastActive: string;
}

export interface StepLogItem {
  time: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface WhatsAppEngineEvents {
  connecting: (data: { botId: string; authMethod: AuthMethod; phone?: string }) => void;
  qr_received: (data: { botId: string; qrDataUrl: string }) => void;
  pairing_code_received: (data: { botId: string; pairingCode: string }) => void;
  connected: (data: { botId: string; bot: Bot }) => void;
  disconnected: (data: { botId: string; reason?: string }) => void;
  status_change: (data: { botId: string; status: ConnectionStatus; bot?: Bot }) => void;
  step_log: (data: { botId: string; log: StepLogItem }) => void;
  error: (data: { botId?: string; error: string }) => void;
}

type EventKey = keyof WhatsAppEngineEvents;
type EventCallback<K extends EventKey> = WhatsAppEngineEvents[K];

/**
 * Custom Typed Event Emitter for Client-Side WhatsApp Engine
 */
class TypedEventEmitter {
  private listeners: Map<EventKey, Set<Function>> = new Map();

  public on<K extends EventKey>(event: K, listener: EventCallback<K>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return () => this.off(event, listener);
  }

  public off<K extends EventKey>(event: K, listener: EventCallback<K>): void {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(listener);
      if (set.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  public emit<K extends EventKey>(event: K, ...args: Parameters<EventCallback<K>>): void {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach((listener) => {
        try {
          (listener as any)(...args);
        } catch (err) {
          console.error(`[WhatsApp Engine Event Error on '${String(event)}']:`, err);
        }
      });
    }
  }

  public removeAllListeners(event?: EventKey): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}

/**
 * WhatsApp Multi-Device Connection & Session Engine
 * Handles the complete lifecycle: pairing code, unique QR stream, real-time WebSocket connection state updates,
 * precision adaptive polling, and user-isolated session persistence.
 */
export class WhatsAppEngineService extends TypedEventEmitter {
  private activeWebSockets: Map<string, WebSocket> = new Map();
  private activeStreams: Map<string, EventSource> = new Map();
  private pollIntervals: Map<string, any> = new Map();

  private getStorageKey(userId: string): string {
    return `namsblast_wa_sessions_${userId}`;
  }

  /**
   * Retrieve all persistently stored WhatsApp sessions for a specific user ID
   */
  public getStoredSessions(userId: string): StoredSessionInfo[] {
    try {
      const raw = localStorage.getItem(this.getStorageKey(userId));
      if (!raw) return [];
      return JSON.parse(raw);
    } catch (e) {
      console.error('[WhatsApp Engine] Failed to parse stored sessions:', e);
      return [];
    }
  }

  /**
   * Save or update a session in user's persistent local storage
   */
  public saveStoredSession(userId: string, session: StoredSessionInfo): void {
    try {
      const existing = this.getStoredSessions(userId);
      const filtered = existing.filter((s) => s.botId !== session.botId);
      filtered.unshift(session);
      localStorage.setItem(this.getStorageKey(userId), JSON.stringify(filtered));
    } catch (e) {
      console.error('[WhatsApp Engine] Failed to save session:', e);
    }
  }

  /**
   * Remove a stored session for user ID
   */
  public removeStoredSession(userId: string, botId: string): void {
    try {
      const existing = this.getStoredSessions(userId);
      const updated = existing.filter((s) => s.botId !== botId);
      localStorage.setItem(this.getStorageKey(userId), JSON.stringify(updated));
    } catch (e) {
      console.error('[WhatsApp Engine] Failed to remove stored session:', e);
    }
  }

  /**
   * Format phone number to international standard (628xxx)
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
   * Start a new WhatsApp Multi-Device session (QR or Pairing Code)
   */
  public async startSession(
    userId: string,
    options: {
      authMethod: AuthMethod;
      phoneNumber?: string;
      name?: string;
    }
  ): Promise<{
    bot: Bot;
    authMethod: AuthMethod;
    qrDataUrl?: string;
    pairingCode?: string;
  }> {
    const { authMethod, phoneNumber, name } = options;
    const cleanPhone = phoneNumber ? this.formatInternationalPhone(phoneNumber) : undefined;

    this.emit('connecting', {
      botId: 'pending',
      authMethod,
      phone: cleanPhone,
    });

    try {
      const response = await ApiService.connectBot(userId, {
        authMethod,
        phoneNumber: cleanPhone,
        name: name || (cleanPhone ? `WhatsApp (${cleanPhone})` : 'WhatsApp Multi-Device'),
      });

      const bot = response.bot;

      // Save initial session state in user-specific storage
      this.saveStoredSession(userId, {
        botId: bot.id,
        userId,
        authMethod,
        phoneNumber: bot.phone,
        name: bot.name,
        status: bot.status as ConnectionStatus,
        createdAt: bot.createdAt || new Date().toISOString(),
        lastActive: bot.lastActive || new Date().toISOString(),
      });

      if (authMethod === 'qr' && response.qrDataUrl) {
        this.emit('qr_received', {
          botId: bot.id,
          qrDataUrl: response.qrDataUrl,
        });
      } else if (authMethod === 'pairing_code' && response.pairingCode) {
        this.emit('pairing_code_received', {
          botId: bot.id,
          pairingCode: response.pairingCode,
        });
      }

      this.emit('status_change', {
        botId: bot.id,
        status: bot.status as ConnectionStatus,
        bot,
      });

      // Start listening to live WhatsApp events via WebSocket, SSE, and fast polling
      this.listenToSessionEvents(userId, bot.id);

      return response;
    } catch (err: any) {
      const msg = err?.message || 'Gagal menginisialisasi engine WhatsApp.';
      this.emit('error', { error: msg });
      throw err;
    }
  }

  /**
   * Request a fresh, unique QR code from the gateway for an active session
   */
  public async refreshQR(userId: string, botId: string): Promise<string | undefined> {
    try {
      const res = await ApiService.refreshBotQr(botId, userId);
      if (res.qrDataUrl) {
        this.emit('qr_received', { botId, qrDataUrl: res.qrDataUrl });
      }
      return res.qrDataUrl;
    } catch (err: any) {
      this.emit('error', { botId, error: err?.message || 'Gagal memperbarui QR code.' });
      throw err;
    }
  }

  /**
   * Open real-time WebSocket stream, SSE stream, & precision poller for WhatsApp socket lifecycle events
   */
  public listenToSessionEvents(userId: string, botId: string): () => void {
    this.stopSessionListener(botId);

    // 1. WebSocket Realtime Connection
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/bots?botId=${encodeURIComponent(botId)}&userId=${encodeURIComponent(userId)}`;
      const ws = new WebSocket(wsUrl);
      this.activeWebSockets.set(botId, ws);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleIncomingSocketEvent(userId, botId, data);
        } catch (err) {
          // ignore
        }
      };

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'subscribe', botId, userId }));
      };

      ws.onerror = () => {
        // ws error, SSE / polling backup will handle seamlessly
      };
    } catch (e) {
      console.warn('[WhatsApp Engine] WebSocket unavailable, falling back to SSE and precision polling');
    }

    // 2. Server-Sent Events (SSE) Stream
    try {
      const sseUrl = `/api/bots/${botId}/events`;
      const eventSource = new EventSource(sseUrl);
      this.activeStreams.set(botId, eventSource);

      eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          this.handleIncomingSocketEvent(userId, botId, data);
        } catch (err) {
          // ignore heartbeat
        }
      };

      eventSource.onerror = () => {
        // SSE reconnecting
      };
    } catch (e) {
      console.warn('[WhatsApp Engine] EventSource not available, falling back to active polling');
    }

    // 3. Precision Poller (fast 1200ms interval during pairing/connecting)
    const poller = setInterval(async () => {
      try {
        const res = await ApiService.getBotStatus(botId);
        if (res.stepLogs && res.stepLogs.length > 0) {
          res.stepLogs.forEach((log) => {
            this.emit('step_log', { botId, log });
          });
        }
        if (res.qrCodeData) {
          this.emit('qr_received', { botId, qrDataUrl: res.qrCodeData });
        }
        if (res.pairingCode) {
          this.emit('pairing_code_received', { botId, pairingCode: res.pairingCode });
        }

        if (res.bot?.status === 'ONLINE' || res.isOnline) {
          this.emit('connected', { botId, bot: res.bot });
          this.emit('status_change', { botId, status: 'ONLINE', bot: res.bot });
          this.saveStoredSession(userId, {
            botId,
            userId,
            authMethod: res.bot.pairingCode ? 'pairing_code' : 'qr',
            phoneNumber: res.bot.phone,
            name: res.bot.name,
            status: 'ONLINE',
            createdAt: res.bot.createdAt,
            lastActive: res.bot.lastActive,
          });
          this.stopSessionListener(botId);
        } else if (res.bot?.status === 'OFFLINE') {
          this.emit('disconnected', { botId, reason: 'Disconnected from WhatsApp' });
          this.emit('status_change', { botId, status: 'OFFLINE', bot: res.bot });
        }
      } catch (err) {
        // silent polling error
      }
    }, 1200);

    this.pollIntervals.set(botId, poller);

    return () => this.stopSessionListener(botId);
  }

  /**
   * Stop active WebSocket, SSE stream & poller for a bot
   */
  public stopSessionListener(botId: string): void {
    const ws = this.activeWebSockets.get(botId);
    if (ws) {
      try {
        ws.close();
      } catch (e) {
        // ignore
      }
      this.activeWebSockets.delete(botId);
    }

    const sse = this.activeStreams.get(botId);
    if (sse) {
      try {
        sse.close();
      } catch (e) {
        // ignore
      }
      this.activeStreams.delete(botId);
    }

    const poller = this.pollIntervals.get(botId);
    if (poller) {
      clearInterval(poller);
      this.pollIntervals.delete(botId);
    }
  }

  /**
   * Process incoming WhatsApp socket events from server
   */
  private handleIncomingSocketEvent(userId: string, botId: string, event: any): void {
    if (!event || !event.type) return;

    switch (event.type) {
      case 'qr':
        if (event.qrDataUrl) {
          this.emit('qr_received', { botId, qrDataUrl: event.qrDataUrl });
        }
        break;

      case 'pairing_code':
        if (event.pairingCode) {
          this.emit('pairing_code_received', { botId, pairingCode: event.pairingCode });
        }
        break;

      case 'step_log':
        if (event.log) {
          this.emit('step_log', { botId, log: event.log });
        }
        break;

      case 'connected':
        if (event.bot) {
          this.emit('connected', { botId, bot: event.bot });
          this.emit('status_change', { botId, status: 'ONLINE', bot: event.bot });
          this.saveStoredSession(userId, {
            botId,
            userId,
            authMethod: event.bot.pairingCode ? 'pairing_code' : 'qr',
            phoneNumber: event.bot.phone,
            name: event.bot.name,
            status: 'ONLINE',
            createdAt: event.bot.createdAt,
            lastActive: event.bot.lastActive,
          });
          this.stopSessionListener(botId);
        }
        break;

      case 'disconnected':
        this.emit('disconnected', { botId, reason: `Status code ${event.statusCode}` });
        this.emit('status_change', { botId, status: 'OFFLINE' });
        break;

      case 'status':
        if (event.status) {
          this.emit('status_change', { botId, status: event.status });
        }
        break;
    }
  }

  /**
   * Manually verify and activate connection
   */
  public async verifySession(userId: string, botId: string): Promise<Bot> {
    try {
      const res = await ApiService.verifyConnect(botId);
      const bot = res.bot;
      this.emit('connected', { botId, bot });
      this.emit('status_change', { botId, status: 'ONLINE', bot });
      this.saveStoredSession(userId, {
        botId,
        userId,
        authMethod: bot.pairingCode ? 'pairing_code' : 'qr',
        phoneNumber: bot.phone,
        name: bot.name,
        status: 'ONLINE',
        createdAt: bot.createdAt,
        lastActive: bot.lastActive,
      });
      return bot;
    } catch (err: any) {
      this.emit('error', { botId, error: err.message || 'Gagal memverifikasi koneksi.' });
      throw err;
    }
  }

  /**
   * Disconnect and clear session
   */
  public async disconnectSession(userId: string, botId: string): Promise<boolean> {
    this.stopSessionListener(botId);
    try {
      await ApiService.deleteBot(userId, botId);
      this.removeStoredSession(userId, botId);
      this.emit('disconnected', { botId, reason: 'Disconnected manually by user' });
      this.emit('status_change', { botId, status: 'OFFLINE' });
      return true;
    } catch (err: any) {
      this.emit('error', { botId, error: err.message || 'Gagal memutuskan koneksi WhatsApp.' });
      throw err;
    }
  }
}

export const whatsappEngine = new WhatsAppEngineService();
