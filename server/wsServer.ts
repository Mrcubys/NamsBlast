import { WebSocketServer, WebSocket } from 'ws';
import type { Server as HttpServer } from 'http';
import { whatsappManager } from './whatsappManager';
import { db } from './db';

interface ClientMeta {
  ws: WebSocket;
  botId?: string;
  userId?: string;
  isAlive: boolean;
}

class WsConnectionManager {
  private wss: WebSocketServer | null = null;
  private clients: Set<ClientMeta> = new Set();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  public init(server: HttpServer) {
    this.wss = new WebSocketServer({ noServer: true });

    server.on('upgrade', (request, socket, head) => {
      const pathname = request.url ? new URL(request.url, 'http://localhost').pathname : '';

      if (pathname === '/ws/bots' || pathname === '/ws') {
        this.wss!.handleUpgrade(request, socket, head, (ws) => {
          this.wss!.emit('connection', ws, request);
        });
      }
    });

    this.wss.on('connection', (ws: WebSocket, req) => {
      const urlObj = req.url ? new URL(req.url, 'http://localhost') : null;
      const botId = urlObj?.searchParams.get('botId') || undefined;
      const userId = urlObj?.searchParams.get('userId') || undefined;

      const meta: ClientMeta = {
        ws,
        botId,
        userId,
        isAlive: true,
      };

      this.clients.add(meta);

      // Send initial welcome & status
      if (botId) {
        const bot = db.getBotById(botId);
        const stepLogs = whatsappManager.getStepLogs(botId);
        this.sendJson(ws, {
          type: 'init',
          botId,
          bot,
          status: bot?.status || 'CONNECTING',
          stepLogs,
          timestamp: new Date().toISOString(),
        });
      }

      ws.on('pong', () => {
        meta.isAlive = true;
      });

      ws.on('message', (raw) => {
        try {
          const msg = JSON.parse(raw.toString());
          if (msg.type === 'subscribe') {
            meta.botId = msg.botId;
            meta.userId = msg.userId;
            const bot = msg.botId ? db.getBotById(msg.botId) : null;
            const stepLogs = msg.botId ? whatsappManager.getStepLogs(msg.botId) : [];
            this.sendJson(ws, {
              type: 'subscribed',
              botId: msg.botId,
              bot,
              status: bot?.status,
              stepLogs,
            });
          } else if (msg.type === 'ping') {
            this.sendJson(ws, { type: 'pong', timestamp: Date.now() });
          } else if (msg.type === 'refresh_qr' && msg.botId) {
            whatsappManager
              .refreshBotQR(msg.botId, msg.userId || '')
              .catch((err) => {
                this.sendJson(ws, {
                  type: 'error',
                  botId: msg.botId,
                  error: err?.message || 'Gagal memperbarui QR Code',
                });
              });
          }
        } catch (err) {
          console.error('[WS Error] Parsing message failed:', err);
        }
      });

      ws.on('close', () => {
        this.clients.delete(meta);
      });

      ws.on('error', () => {
        this.clients.delete(meta);
      });
    });

    // Setup event listeners from WhatsApp Manager
    this.setupWhatsAppEvents();

    // Heartbeat ping/pong every 20s
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach((client) => {
        if (!client.isAlive) {
          client.ws.terminate();
          this.clients.delete(client);
          return;
        }
        client.isAlive = false;
        client.ws.ping();
      });
    }, 20000);

    console.log('[WebSocket Server] Initialized on path /ws/bots');
  }

  private setupWhatsAppEvents() {
    whatsappManager.on('qr', (data) => {
      this.broadcastToBot(data.botId, {
        type: 'qr',
        botId: data.botId,
        userId: data.userId,
        qrDataUrl: data.qrDataUrl,
        timestamp: Date.now(),
      });
    });

    whatsappManager.on('pairing_code', (data) => {
      this.broadcastToBot(data.botId, {
        type: 'pairing_code',
        botId: data.botId,
        userId: data.userId,
        pairingCode: data.pairingCode,
        timestamp: Date.now(),
      });
    });

    whatsappManager.on('connected', (data) => {
      this.broadcastToBot(data.botId, {
        type: 'connected',
        botId: data.botId,
        userId: data.userId,
        bot: data.bot,
        status: 'ONLINE',
        timestamp: Date.now(),
      });
    });

    whatsappManager.on('disconnected', (data) => {
      this.broadcastToBot(data.botId, {
        type: 'disconnected',
        botId: data.botId,
        userId: data.userId,
        statusCode: data.statusCode,
        status: 'OFFLINE',
        timestamp: Date.now(),
      });
    });

    whatsappManager.on('status', (data) => {
      this.broadcastToBot(data.botId, {
        type: 'status',
        botId: data.botId,
        status: data.status,
        timestamp: Date.now(),
      });
    });

    whatsappManager.on('step_log', (data) => {
      this.broadcastToBot(data.botId, {
        type: 'step_log',
        botId: data.botId,
        log: data.log,
        timestamp: Date.now(),
      });
    });
  }

  public broadcastToBot(botId: string, payload: any) {
    const raw = JSON.stringify(payload);
    this.clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        if (!client.botId || client.botId === botId) {
          client.ws.send(raw);
        }
      }
    });
  }

  private sendJson(ws: WebSocket, payload: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  }
}

export const wsConnectionManager = new WsConnectionManager();
