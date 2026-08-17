import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db, generateReferralCode } from './db';
import { Bot, Contact, MessageTemplate, WithdrawRequest, Announcement, User } from '../src/types';
import { whatsappManager } from './whatsappManager';

export const router = Router();

// ==========================================
// 1. AUTHENTICATION
// ==========================================

router.post('/auth/register', async (req, res) => {
  try {
    const { email, name, password, confirmPassword, referralCode } = req.body;

    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ error: 'Email wajib diisi.' });
    }

    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Password wajib diisi.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({ error: 'Konfirmasi password tidak cocok.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password minimal 6 karakter.' });
    }

    const existing = db.getUserByEmail(cleanEmail);
    if (existing) {
      return res.status(400).json({ error: 'Email sudah terdaftar. Silakan gunakan menu Masuk.' });
    }

    let referrerUserId: string | null = null;
    if (referralCode && typeof referralCode === 'string' && referralCode.trim()) {
      const referrer = db.getUserByReferralCode(referralCode.trim());
      if (referrer) {
        referrerUserId = referrer.id;
      }
    }

    const userId = `usr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newRefCode = generateReferralCode();
    const passwordHash = bcrypt.hashSync(password, 10);

    const newUser: User = {
      id: userId,
      email: cleanEmail,
      name: name?.trim() || cleanEmail.split('@')[0],
      role: 'USER',
      referralCode: newRefCode,
      referredByUserId: referrerUserId,
      balance: 0,
      totalEarned: 0,
      totalReferralEarned: 0,
      totalMessagesSent: 0,
      createdAt: new Date().toISOString(),
    };

    db.createUser(newUser, passwordHash);

    return res.json({
      success: true,
      message: 'Pendaftaran berhasil! Selamat datang di NamsBlast.',
      user: newUser,
    });
  } catch (err: any) {
    console.error('[Register Error]:', err);
    return res.status(500).json({ error: err.message || 'Terjadi kesalahan pada server saat registrasi.' });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password wajib diisi.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = db.getUserByEmail(cleanEmail);
    if (!user) {
      return res.status(401).json({ error: 'Email tidak terdaftar atau password salah.' });
    }

    const hash = db.getPasswordHash(user.id);
    if (!hash || !bcrypt.compareSync(password, hash)) {
      return res.status(401).json({ error: 'Password salah. Silakan periksa kembali.' });
    }

    return res.json({
      success: true,
      message: 'Login berhasil!',
      user,
    });
  } catch (err: any) {
    console.error('[Login Error]:', err);
    return res.status(500).json({ error: err.message || 'Terjadi kesalahan pada server saat login.' });
  }
});

router.get('/auth/me', (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const user = db.getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User tidak ditemukan' });
  }
  return res.json({ user });
});

// ==========================================
// 2. DASHBOARD STATS (Global + User)
// ==========================================

router.get('/dashboard/stats', (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const contacts = db.getContacts();
  const bots = db.getBots();
  const settings = db.getSettings();
  const logs = db.getSentLogs();

  const totalContacts = contacts.length;
  const pendingContacts = contacts.filter((c) => c.status === 'pending').length;
  const sentContacts = contacts.filter((c) => c.status === 'sent').length;
  const failedContacts = contacts.filter((c) => c.status === 'failed').length;

  const onlineBots = bots.filter((b) => b.status === 'ONLINE').length;
  const totalBots = bots.length;

  // Sent today (within last 24h)
  const oneDayAgo = Date.now() - 86400000;
  const globalSentToday = logs.filter(
    (l) => l.status === 'SUCCESS' && new Date(l.timestamp).getTime() > oneDayAgo
  ).length;

  let user = userId ? db.getUserById(userId) : null;
  let userBots = userId ? bots.filter((b) => b.userId === userId) : [];
  let userOnlineBots = userBots.filter((b) => b.status === 'ONLINE').length;
  let userLogs = userId ? logs.filter((l) => l.userId === userId) : [];
  let userSentToday = userLogs.filter(
    (l) => l.status === 'SUCCESS' && new Date(l.timestamp).getTime() > oneDayAgo
  ).length;

  const userReferrals = userId
    ? db.getUsers().filter((u) => u.referredByUserId === userId).length
    : 0;

  return res.json({
    // Global Platform stats
    globalContactsAvailable: pendingContacts,
    globalContactsTotal: totalContacts,
    globalContactsSent: sentContacts,
    globalContactsFailed: failedContacts,
    globalOnlineBots: onlineBots,
    globalTotalBots: totalBots,
    globalSentToday: globalSentToday,
    emptyContactMessage: settings.emptyContactMessage,
    ratePerMessage: settings.ratePerMessage,
    rateReferralPerMessage: settings.rateReferralPerMessage,
    autoBlastEnabled: settings.autoBlastEnabled,

    // User data
    userBalance: user?.balance || 0,
    userTotalEarned: user?.totalEarned || 0,
    userTotalReferralEarned: user?.totalReferralEarned || 0,
    userMessagesSentToday: userSentToday,
    userMessagesSentTotal: user?.totalMessagesSent || 0,
    userBotsCount: userBots.length,
    userOnlineBotsCount: userOnlineBots,
    userReferralCount: userReferrals,
  });
});

// ==========================================
// 3. BOT MANAGEMENT & CONNECTION (QR & PAIRING)
// ==========================================

router.get('/bots', (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const user = userId ? db.getUserById(userId) : null;

  if (user?.role === 'ADMIN' && req.query.all === 'true') {
    return res.json({ bots: db.getBots() });
  }

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userBots = db.getBotsByUserId(userId);
  return res.json({ bots: userBots });
});

// Unified WhatsApp connection endpoint. QR is the default and never needs a
// phone number; pairing_code is optional and explicitly requires one.
router.post('/bots/connect', async (req, res) => {
  let createdBotId: string | undefined;
  try {
    const userId = (req.headers['x-user-id'] as string) || req.body.userId;
    const { name, phoneNumber, phone, authMethod = 'qr' } = req.body;
    if (!userId) return res.status(401).json({ error: 'Unauthorized: User ID diperlukan.' });

    const rawPhone = phoneNumber || phone || '';
    const targetAuthMethod = authMethod === 'pairing_code' ? 'pairing_code' : 'qr';
    const cleanPhone = rawPhone ? whatsappManager.formatInternationalPhone(rawPhone) : '';

    if (targetAuthMethod === 'pairing_code' && !/^62\d{8,13}$/.test(cleanPhone)) {
      return res.status(400).json({ error: 'Nomor WhatsApp internasional valid wajib diisi untuk metode Pairing Code.' });
    }

    const botId = `bot-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    createdBotId = botId;

    const newBot: Bot = {
      id: botId,
      userId,
      phone: cleanPhone,
      name: name?.trim() || 'WhatsApp Multi-Device',
      status: targetAuthMethod === 'pairing_code' ? 'PAIRING' : 'CONNECTING',
      speed: 'FAST',
      isRunning: false,
      qrCodeData: null,
      pairingCode: null,
      lastActive: new Date().toISOString(),
      totalSent: 0,
      totalFailed: 0,
      batteryLevel: 95,
      pushName: name || 'WhatsApp Multi-Device',
      createdAt: new Date().toISOString(),
      currentTask: null,
    };

    db.createBot(newBot);

    // Initialize isolated WhatsApp Multi-Device session
    const result = await whatsappManager.initBotSocket(botId, userId, {
      authMethod: targetAuthMethod,
      phoneNumber: targetAuthMethod === 'pairing_code' ? cleanPhone : undefined,
      botName: name?.trim(),
    });

    return res.json({
      success: true,
      bot: result.bot || newBot,
      authMethod: targetAuthMethod,
      qrDataUrl: result.qrDataUrl,
      pairingCode: result.pairingCode,
      message: targetAuthMethod === 'qr'
        ? 'Sesi QR Code WhatsApp berhasil diinisialisasi. Silakan scan melalui WhatsApp di ponsel Anda.'
        : 'Kode pairing 8-digit WhatsApp berhasil di-generate. Masukkan kode ini pada WhatsApp di ponsel Anda.',
    });
  } catch (err: any) {
    console.error('[Route /bots/connect] Error:', err);
    if (createdBotId) {
      try {
        await whatsappManager.disconnectBot(createdBotId);
      } catch {
        // The socket may not have finished initializing; remove the DB row
        // below regardless so failed attempts never create ghost bots.
      }
      db.deleteBot(createdBotId);
    }
    return res.status(500).json({ error: err.message || 'Gagal menginisialisasi sesi WhatsApp.' });
  }
});

// Real-time Server-Sent Events (SSE) stream for Baileys WhatsApp Connection Lifecycle
router.get('/bots/:id/events', (req, res) => {
  const { id } = req.params;
  const bot = db.getBotById(id);

  if (!bot) {
    return res.status(404).json({ error: 'WhatsApp bot tidak ditemukan' });
  }

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  res.write(`data: ${JSON.stringify({ type: 'init', bot, status: bot.status })}\n\n`);

  // Event handlers
  const handleQr = (data: any) => {
    if (data.botId === id) {
      res.write(`data: ${JSON.stringify({ type: 'qr', qrDataUrl: data.qrDataUrl, botId: id })}\n\n`);
    }
  };

  const handlePairing = (data: any) => {
    if (data.botId === id) {
      res.write(`data: ${JSON.stringify({ type: 'pairing_code', pairingCode: data.pairingCode, botId: id })}\n\n`);
    }
  };

  const handleConnected = (data: any) => {
    if (data.botId === id) {
      res.write(`data: ${JSON.stringify({ type: 'connected', bot: data.bot, botId: id })}\n\n`);
    }
  };

  const handleDisconnected = (data: any) => {
    if (data.botId === id) {
      res.write(`data: ${JSON.stringify({ type: 'disconnected', botId: id, statusCode: data.statusCode })}\n\n`);
    }
  };

  const handleStatus = (data: any) => {
    if (data.botId === id) {
      res.write(`data: ${JSON.stringify({ type: 'status', status: data.status, botId: id })}\n\n`);
    }
  };

  whatsappManager.on('qr', handleQr);
  whatsappManager.on('pairing_code', handlePairing);
  whatsappManager.on('connected', handleConnected);
  whatsappManager.on('disconnected', handleDisconnected);
  whatsappManager.on('status', handleStatus);

  // Keep-alive heartbeat every 15s
  const heartbeat = setInterval(() => {
    res.write(`: heartbeat\n\n`);
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    whatsappManager.off('qr', handleQr);
    whatsappManager.off('pairing_code', handlePairing);
    whatsappManager.off('connected', handleConnected);
    whatsappManager.off('disconnected', handleDisconnected);
    whatsappManager.off('status', handleStatus);
  });
});

// Single Bot Status endpoint
router.get('/bots/:id/status', (req, res) => {
  const { id } = req.params;
  const bot = db.getBotById(id);
  if (!bot) return res.status(404).json({ error: 'Bot tidak ditemukan' });
  const isOnline = whatsappManager.isSocketOnline(id);
  const stepLogs = whatsappManager.getStepLogs(id);
  return res.json({
    bot,
    isOnline,
    status: bot.status,
    qrCodeData: bot.qrCodeData,
    pairingCode: bot.pairingCode,
    stepLogs,
  });
});

// Refresh / Regenerate unique QR code for an active session
router.post('/bots/:id/refresh-qr', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req.headers['x-user-id'] as string) || req.body.userId;
    const bot = db.getBotById(id);
    if (!bot) return res.status(404).json({ error: 'WhatsApp tidak ditemukan' });

    const refreshed = await whatsappManager.refreshBotQR(id, userId || bot.userId);
    return res.json({
      success: true,
      bot: refreshed.bot,
      qrDataUrl: refreshed.qrDataUrl,
      message: 'QR Code sesi unik baru berhasil di-generate.',
    });
  } catch (err: any) {
    console.error('[Route /bots/:id/refresh-qr Error]:', err);
    return res.status(500).json({ error: err.message || 'Gagal memperbarui QR code.' });
  }
});

// Confirm/Verify bot connection (Transitions to ONLINE, not running yet)
router.post('/bots/:id/verify-connect', async (req, res) => {
  const { id } = req.params;
  const bot = db.getBotById(id);

  if (!bot) {
    return res.status(404).json({ error: 'WhatsApp tidak ditemukan.' });
  }

  try {
    const updated = await whatsappManager.verifyAndActivateBot(id);

    return res.json({
      success: true,
      message: 'WhatsApp berhasil diverifikasi dan terhubung secara online! Tekan tombol "Mulai" untuk mulai menghasilkan saldo.',
      bot: updated || bot,
    });
  } catch (err: any) {
    return res.status(409).json({
      error: err?.message || 'WhatsApp belum terhubung.',
    });
  }
});

// Start Bot Blasting
router.post('/bots/:id/start', (req, res) => {
  const { id } = req.params;
  const { speed } = req.body;
  const bot = db.getBotById(id);

  if (!bot) return res.status(404).json({ error: 'WhatsApp tidak ditemukan.' });

  const updated = db.updateBot(id, {
    status: 'ONLINE',
    isRunning: true,
    speed: speed || bot.speed || 'FAST',
    lastActive: new Date().toISOString(),
  });

  return res.json({
    success: true,
    message: 'Pengiriman pesan berhasil dimulai!',
    bot: updated,
  });
});

// Pause / Stop Bot Blasting
router.post('/bots/:id/stop', (req, res) => {
  const { id } = req.params;
  const bot = db.getBotById(id);

  if (!bot) return res.status(404).json({ error: 'WhatsApp tidak ditemukan.' });

  const updated = db.updateBot(id, {
    isRunning: false,
    currentTask: null,
    lastActive: new Date().toISOString(),
  });

  return res.json({
    success: true,
    message: 'Pengiriman berhasil dijeda.',
    bot: updated,
  });
});

// Reconnect Bot if disconnected
router.post('/bots/:id/reconnect', async (req, res) => {
  const { id } = req.params;
  const bot = db.getBotById(id);

  if (!bot) return res.status(404).json({ error: 'WhatsApp tidak ditemukan.' });

  try {
    await whatsappManager.initBotSocket(id, bot.userId, {
      // Reconnect with the saved auth state. Do not infer pairing mode from
      // the stored phone number: that made QR sessions request a new pairing
      // code and forced users to enter a number unexpectedly.
      authMethod: 'qr',
      resetAuth: false,
      botName: bot.name,
    });
  } catch (e: any) {
    console.error('Reconnect error:', e);
    return res.status(500).json({
      error: e?.message || 'WhatsApp gagal disambungkan ulang.',
    });
  }

  const updated = db.updateBot(id, {
    isRunning: false,
    lastActive: new Date().toISOString(),
  });

  return res.json({
    success: true,
    message: 'WhatsApp berhasil disambungkan ulang!',
    bot: updated || bot,
  });
});

// Update bot speed (Super Fast, Fast, Slow, Super Slow)
router.put('/bots/:id/speed', (req, res) => {
  const { id } = req.params;
  const { speed } = req.body;
  const userId = req.headers['x-user-id'] as string;

  const validSpeeds = ['SUPER_FAST', 'FAST', 'SLOW', 'SUPER_SLOW'];
  if (!validSpeeds.includes(speed)) {
    return res.status(400).json({ error: 'Pilihan kecepatan tidak valid.' });
  }

  const bot = db.getBotById(id);
  if (!bot) return res.status(404).json({ error: 'Bot tidak ditemukan.' });
  if (bot.userId !== userId) {
    const user = db.getUserById(userId);
    if (user?.role !== 'ADMIN') return res.status(403).json({ error: 'Akses ditolak.' });
  }

  const updated = db.updateBot(id, { speed });
  return res.json({ success: true, bot: updated });
});

// Toggle Bot Status (ONLINE / OFFLINE)
router.put('/bots/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const bot = db.getBotById(id);
  if (!bot) return res.status(404).json({ error: 'Bot tidak ditemukan.' });

  const updated = db.updateBot(id, {
    status,
    isRunning: status === 'OFFLINE' ? false : bot.isRunning,
    lastActive: new Date().toISOString(),
  });
  return res.json({ success: true, bot: updated });
});

// Delete bot (Disconnects and removes)
router.delete('/bots/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await whatsappManager.disconnectBot(id);
  } catch (e) {
    console.error('Error disconnecting bot:', e);
  }
  const success = db.deleteBot(id);
  return res.json({ success, message: 'Koneksi WhatsApp berhasil diputuskan dan akun dihapus.' });
});

// ==========================================
// 4. CONTACTS MANAGEMENT (Admin & Global)
// ==========================================

router.get('/contacts', (req, res) => {
  const contacts = db.getContacts();
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const status = req.query.status as string;
  const search = (req.query.search as string)?.toLowerCase();

  let filtered = contacts;
  if (status && status !== 'all') {
    filtered = filtered.filter((c) => c.status === status);
  }
  if (search) {
    filtered = filtered.filter(
      (c) => c.phone.includes(search) || c.name.toLowerCase().includes(search)
    );
  }

  const total = filtered.length;
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);

  const counts = {
    all: contacts.length,
    pending: contacts.filter((c) => c.status === 'pending').length,
    sent: contacts.filter((c) => c.status === 'sent').length,
    failed: contacts.filter((c) => c.status === 'failed').length,
  };

  return res.json({
    contacts: paginated,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    counts,
  });
});

router.post('/contacts/upload', (req, res) => {
  try {
    const { contacts } = req.body;
    if (!Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({ error: 'Data kontak tidak valid.' });
    }

    const batchId = `batch-${Date.now()}`;
    const newItems: Contact[] = contacts
      .map((item: any, idx: number) => {
        const phone = String(item.phone || item.nomor || '').trim();
        const name = String(item.name || item.nama || `Kontak ${idx + 1}`).trim();
        return {
          id: `cnt-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
          phone,
          name,
          status: 'pending' as const,
          assignedBotId: null,
          sentAt: null,
          errorMessage: null,
          batchId,
          createdAt: new Date().toISOString(),
        };
      })
      .filter((c: Contact) => c.phone.length >= 8);

    const result = db.addContacts(newItems);

    return res.json({
      success: true,
      added: result.added,
      skipped: result.skippedDuplicates,
      message: `Berhasil menambahkan ${result.added} kontak baru! (${result.skippedDuplicates} duplikat diabaikan)`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/contacts/add-single', (req, res) => {
  const { phone, name } = req.body;
  if (!phone) return res.status(400).json({ error: 'Nomor telepon wajib diisi.' });

  const contact: Contact = {
    id: `cnt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    phone: phone.trim(),
    name: name?.trim() || 'Kontak Baru',
    status: 'pending',
    assignedBotId: null,
    sentAt: null,
    errorMessage: null,
    batchId: `manual-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  const result = db.addContacts([contact]);
  return res.json({ success: true, contact, added: result.added });
});

router.delete('/contacts/clear-all', (req, res) => {
  db.clearAllContacts();
  return res.json({ success: true, message: 'Semua kontak berhasil dikosongkan.' });
});

// ==========================================
// 5. MESSAGE TEMPLATES
// ==========================================

router.get('/templates', (req, res) => {
  const templates = db.getTemplates();
  const settings = db.getSettings();
  return res.json({
    templates,
    activeTemplateId: settings.selectedTemplateId || templates.find((t) => t.isActive)?.id,
  });
});

router.post('/templates', (req, res) => {
  const { title, text, imageUrl, type, isActive } = req.body;
  if (!title || !text) {
    return res.status(400).json({ error: 'Judul dan teks template wajib diisi.' });
  }

  const newTpl: MessageTemplate = {
    id: `tpl-${Date.now()}`,
    title: title.trim(),
    text: text.trim(),
    imageUrl: imageUrl?.trim() || null,
    type: type || 'TEXT',
    isActive: Boolean(isActive),
    createdAt: new Date().toISOString(),
  };

  if (newTpl.isActive) {
    // Deactivate others
    db.getTemplates().forEach((t) => {
      db.updateTemplate(t.id, { isActive: false });
    });
    db.updateSettings({ selectedTemplateId: newTpl.id });
  }

  db.createTemplate(newTpl);
  return res.json({ success: true, template: newTpl });
});

router.put('/templates/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (updates.isActive) {
    db.getTemplates().forEach((t) => {
      if (t.id !== id) db.updateTemplate(t.id, { isActive: false });
    });
    db.updateSettings({ selectedTemplateId: id });
  }

  const updated = db.updateTemplate(id, updates);
  return res.json({ success: true, template: updated });
});

router.delete('/templates/:id', (req, res) => {
  const { id } = req.params;
  db.deleteTemplate(id);
  return res.json({ success: true, message: 'Template berhasil dihapus.' });
});

router.post('/templates/:id/set-active', (req, res) => {
  const { id } = req.params;
  db.getTemplates().forEach((t) => {
    db.updateTemplate(t.id, { isActive: t.id === id });
  });
  db.updateSettings({ selectedTemplateId: id });
  return res.json({ success: true, message: 'Template aktif berhasil diperbarui.' });
});

// ==========================================
// 6. WITHDRAW MANAGEMENT
// ==========================================

router.get('/withdraw/my', (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const all = db.getWithdrawRequests();
  const myRequests = all.filter((w) => w.userId === userId);
  return res.json({ requests: myRequests });
});

router.post('/withdraw/request', (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { amount, bankName, accountNumber, accountHolder } = req.body;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = db.getUserById(userId);
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan.' });

    const settings = db.getSettings();
    const numAmount = Number(amount);

    if (isNaN(numAmount) || numAmount < settings.minWithdraw) {
      return res.status(400).json({
        error: `Minimal penarikan adalah Rp ${settings.minWithdraw.toLocaleString('id-ID')}`,
      });
    }

    if (numAmount > settings.maxWithdraw) {
      return res.status(400).json({
        error: `Maksimal penarikan per transaksi adalah Rp ${settings.maxWithdraw.toLocaleString('id-ID')}`,
      });
    }

    if (user.balance < numAmount) {
      return res.status(400).json({
        error: `Saldo Anda (Rp ${user.balance.toLocaleString('id-ID')}) tidak mencukupi untuk penarikan ini.`,
      });
    }

    if (!bankName || !accountNumber || !accountHolder) {
      return res.status(400).json({ error: 'Informasi rekening/e-wallet wajib diisi lengkap.' });
    }

    // Deduct user balance immediately
    db.updateUser(userId, { balance: user.balance - numAmount });

    const newWd: WithdrawRequest = {
      id: `wd-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId,
      userEmail: user.email,
      userName: user.name,
      amount: numAmount,
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
      accountHolder: accountHolder.trim(),
      status: 'PENDING',
      adminNote: null,
      requestedAt: new Date().toISOString(),
      processedAt: null,
    };

    db.createWithdrawRequest(newWd);

    return res.json({
      success: true,
      message: 'Permintaan penarikan saldo berhasil dikirim! Admin akan segera memproses dana Anda.',
      withdraw: newWd,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/withdraw/admin/all', (req, res) => {
  const requests = db.getWithdrawRequests();
  return res.json({ requests });
});

router.post('/withdraw/admin/:id/approve', (req, res) => {
  const { id } = req.params;
  const { note } = req.body;

  const wd = db.getWithdrawRequests().find((w) => w.id === id);
  if (!wd) return res.status(404).json({ error: 'Data penarikan tidak ditemukan.' });

  const updated = db.updateWithdrawRequest(id, {
    status: 'SUCCESS',
    adminNote: note || 'Transfer berhasil diproses oleh Admin.',
    processedAt: new Date().toISOString(),
  });

  return res.json({ success: true, withdraw: updated });
});

router.post('/withdraw/admin/:id/reject', (req, res) => {
  const { id } = req.params;
  const { note } = req.body;

  const wd = db.getWithdrawRequests().find((w) => w.id === id);
  if (!wd) return res.status(404).json({ error: 'Data penarikan tidak ditemukan.' });

  // Refund balance back to user
  const user = db.getUserById(wd.userId);
  if (user && wd.status !== 'REJECTED') {
    db.updateUser(user.id, { balance: user.balance + wd.amount });
  }

  const updated = db.updateWithdrawRequest(id, {
    status: 'REJECTED',
    adminNote: note || 'Penarikan ditolak oleh Admin. Saldo telah dikembalikan.',
    processedAt: new Date().toISOString(),
  });

  return res.json({ success: true, withdraw: updated });
});

// ==========================================
// 7. REFERRALS
// ==========================================

router.get('/referrals/my', (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const user = db.getUserById(userId);
  if (!user) return res.status(404).json({ error: 'User tidak ditemukan.' });

  const settings = db.getSettings();
  const allUsers = db.getUsers();
  const downlines = allUsers
    .filter((u) => u.referredByUserId === userId)
    .map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      totalMessagesSent: u.totalMessagesSent,
      joinedAt: u.createdAt,
    }));

  return res.json({
    referralCode: user.referralCode,
    totalReferralEarned: user.totalReferralEarned,
    rateReferralPerMessage: settings.rateReferralPerMessage,
    totalDownlines: downlines.length,
    downlines,
  });
});

// ==========================================
// 8. ANNOUNCEMENTS
// ==========================================

router.get('/announcements', (req, res) => {
  const all = db.getAnnouncements().filter((a) => a.isActive);
  return res.json({ announcements: all });
});

router.get('/announcements/admin/all', (req, res) => {
  return res.json({ announcements: db.getAnnouncements() });
});

router.post('/announcements/admin', (req, res) => {
  const { title, content, type, isActive } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Judul dan isi pengumuman wajib diisi.' });
  }

  const newAnn: Announcement = {
    id: `ann-${Date.now()}`,
    title: title.trim(),
    content: content.trim(),
    type: type || 'INFO',
    isActive: isActive !== undefined ? Boolean(isActive) : true,
    createdAt: new Date().toISOString(),
  };

  db.createAnnouncement(newAnn);
  return res.json({ success: true, announcement: newAnn });
});

router.put('/announcements/admin/:id', (req, res) => {
  const { id } = req.params;
  const updated = db.updateAnnouncement(id, req.body);
  return res.json({ success: true, announcement: updated });
});

router.delete('/announcements/admin/:id', (req, res) => {
  const { id } = req.params;
  db.deleteAnnouncement(id);
  return res.json({ success: true, message: 'Pengumuman berhasil dihapus.' });
});

// ==========================================
// 9. SYSTEM SETTINGS
// ==========================================

router.get('/settings', (req, res) => {
  return res.json({ settings: db.getSettings() });
});

router.put('/settings/admin', (req, res) => {
  const updates = req.body;
  const updated = db.updateSettings(updates);
  return res.json({
    success: true,
    message: 'Pengaturan sistem berhasil disimpan!',
    settings: updated,
  });
});

// ==========================================
// 10. SENT LOGS & MONITORING
// ==========================================

router.get('/logs', (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const user = userId ? db.getUserById(userId) : null;
  const allLogs = db.getSentLogs();

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;

  let filtered = allLogs;
  if (user?.role !== 'ADMIN') {
    filtered = allLogs.filter((l) => l.userId === userId);
  }

  const total = filtered.length;
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);

  return res.json({
    logs: paginated,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
});

// ==========================================
// 11. ADMIN USER ROSTER
// ==========================================

router.get('/admin/users', (req, res) => {
  const users = db.getUsers();
  const bots = db.getBots();

  const userList = users.map((u) => {
    const userBots = bots.filter((b) => b.userId === u.id);
    return {
      ...u,
      botsCount: userBots.length,
      onlineBotsCount: userBots.filter((b) => b.status === 'ONLINE').length,
    };
  });

  return res.json({ users: userList });
});

// ==========================================
// 12. LIVE CHAT SUPPORT (User <-> Admin)
// ==========================================

router.get('/chat/my', (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const messages = db.getChatMessages(userId);
  // Mark admin messages as read when user fetches
  db.markChatRead(userId, 'ADMIN');

  return res.json({ messages });
});

router.post('/chat/send', (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const { text } = req.body;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  if (!text || !text.trim()) return res.status(400).json({ error: 'Pesan tidak boleh kosong' });

  const user = db.getUserById(userId);
  if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });

  const msg = db.addChatMessage({
    userId,
    userName: user.name,
    userEmail: user.email,
    sender: 'USER',
    text: text.trim(),
  });

  // Auto-reply jika pesan baru dari user:
  // "Agent customer support kami akan segera datang membantu Anda, mohon tunggu sebentar ya..."
  const existingChat = db.getChatMessages(userId);
  const adminMessages = existingChat.filter((m) => m.sender === 'ADMIN');
  const recentAdmin = adminMessages[adminMessages.length - 1];
  const lastAdminTime = recentAdmin ? new Date(recentAdmin.createdAt).getTime() : 0;
  const now = Date.now();

  // Kirim auto-reply jika belum ada respon admin dalam 1 menit terakhir
  if (now - lastAdminTime > 60000) {
    setTimeout(() => {
      db.addChatMessage({
        userId,
        userName: 'Agent NamsBlast Support',
        userEmail: 'support@namsblast.com',
        sender: 'ADMIN',
        text: 'Agent customer support kami akan segera datang membantu Anda, mohon tunggu sebentar ya...',
      });
    }, 600);
  }

  return res.json({ success: true, message: msg });
});

// Admin Gate Password Verification
router.post('/admin/verify-gate', (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Password wajib diisi.' });
  }

  const isValid = db.verifyAdminPassword(password);
  if (isValid) {
    return res.json({ success: true, message: 'Otorisasi Master Admin berhasil.' });
  } else {
    return res.status(401).json({ error: 'Password Master Admin salah. Akses ditolak.' });
  }
});

// Admin Change Master Password
router.put('/admin/change-password', (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Password lama dan password baru wajib diisi.' });
  }

  if (newPassword.trim().length < 6) {
    return res.status(400).json({ error: 'Password baru minimal 6 karakter.' });
  }

  const isOldValid = db.verifyAdminPassword(oldPassword);
  if (!isOldValid) {
    return res.status(401).json({ error: 'Password lama tidak sesuai.' });
  }

  db.setAdminPassword(newPassword.trim());
  return res.json({
    success: true,
    message: 'Password Master Admin berhasil diperbarui!',
  });
});

router.get('/chat/admin/all', (req, res) => {
  const allMessages = db.getChatMessages();
  const users = db.getUsers();

  // Group messages by userId
  const threadsMap = new Map<string, { user: User; messages: any[]; unreadCount: number; lastMessage: any }>();

  for (const msg of allMessages) {
    if (!threadsMap.has(msg.userId)) {
      const user = users.find((u) => u.id === msg.userId) || {
        id: msg.userId,
        name: msg.userName,
        email: msg.userEmail,
        role: 'USER',
        referralCode: '',
        balance: 0,
        totalEarned: 0,
        totalReferralEarned: 0,
        totalMessagesSent: 0,
        createdAt: '',
      };
      threadsMap.set(msg.userId, {
        user: user as User,
        messages: [],
        unreadCount: 0,
        lastMessage: null,
      });
    }
    const thread = threadsMap.get(msg.userId)!;
    thread.messages.push(msg);
    if (msg.sender === 'USER' && !msg.read) {
      thread.unreadCount++;
    }
    thread.lastMessage = msg;
  }

  const threads = Array.from(threadsMap.values()).sort((a, b) => {
    const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
    const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
    return timeB - timeA;
  });

  return res.json({ threads });
});

router.post('/chat/admin/reply', (req, res) => {
  const { targetUserId, text } = req.body;
  if (!targetUserId || !text || !text.trim()) {
    return res.status(400).json({ error: 'Target user ID dan pesan wajib diisi' });
  }

  const user = db.getUserById(targetUserId);
  const msg = db.addChatMessage({
    userId: targetUserId,
    userName: user?.name || 'User',
    userEmail: user?.email || '',
    sender: 'ADMIN',
    text: text.trim(),
  });

  // Mark all user messages in this thread as read
  db.markChatRead(targetUserId, 'USER');

  return res.json({ success: true, message: msg });
});

router.post('/chat/read', (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const { sender } = req.body;
  if (userId) {
    db.markChatRead(userId, sender || 'ADMIN');
  }
  return res.json({ success: true });
});

// ==========================================
// 8. DIRECT DATABASE MANAGEMENT FOR ADMIN
// ==========================================

router.get('/admin/database/raw', (req, res) => {
  try {
    const rawDb = db.getRawDatabase();
    return res.json({
      success: true,
      database: rawDb,
      summary: {
        totalUsers: rawDb.users.length,
        totalBots: rawDb.bots.length,
        totalContacts: rawDb.contacts.length,
        totalTemplates: rawDb.templates.length,
        totalSentLogs: rawDb.sentLogs.length,
        totalWithdrawRequests: rawDb.withdrawRequests.length,
        totalAnnouncements: rawDb.announcements.length,
        totalChatMessages: rawDb.chatMessages.length,
        sizeBytes: rawDb.stats.sizeBytes,
        lastModified: rawDb.stats.lastModified,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Gagal memuat database' });
  }
});

router.post('/admin/database/import', (req, res) => {
  try {
    const { data } = req.body;
    if (!data) {
      return res.status(400).json({ error: 'Payload data database tidak boleh kosong' });
    }
    db.importRawDatabase(data);
    return res.json({
      success: true,
      message: 'Database berhasil diimpor dan diperbarui!',
      database: db.getRawDatabase(),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Gagal mengimpor database' });
  }
});

router.post('/admin/database/clear-table', (req, res) => {
  try {
    const { tableName } = req.body;
    if (!tableName) {
      return res.status(400).json({ error: 'Nama tabel wajib ditentukan' });
    }
    const success = db.clearTable(tableName);
    if (!success) {
      return res.status(400).json({ error: `Tabel '${tableName}' tidak dapat dibersihkan atau tidak dikenali.` });
    }
    return res.json({
      success: true,
      message: `Tabel ${tableName} berhasil dibersihkan!`,
      database: db.getRawDatabase(),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Gagal membersihkan tabel' });
  }
});

router.post('/admin/database/reset', (req, res) => {
  try {
    db.resetDatabase();
    return res.json({
      success: true,
      message: 'Database berhasil di-reset ke kondisi awal (seed default)!',
      database: db.getRawDatabase(),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Gagal mereset database' });
  }
});
