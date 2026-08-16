import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  User,
  Bot,
  Contact,
  MessageTemplate,
  SentLog,
  WithdrawRequest,
  Announcement,
  SystemSettings,
  ChatMessage,
} from '../src/types';

interface DatabaseSchema {
  users: User[];
  passwords: Record<string, string>; // userId -> bcrypt hash
  adminPassword?: string; // Master admin panel gate password
  bots: Bot[];
  contacts: Contact[];
  templates: MessageTemplate[];
  sentLogs: SentLog[];
  withdrawRequests: WithdrawRequest[];
  announcements: Announcement[];
  settings: SystemSettings;
  chatMessages: ChatMessage[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'database.json');

const DEFAULT_SETTINGS: SystemSettings = {
  ratePerMessage: 50, // Rp 50 per pesan
  rateReferralPerMessage: 10, // Rp 10 per pesan referral
  delaySuperFast: 3, // 3 detik
  delayFast: 7, // 7 detik
  delaySlow: 15, // 15 detik
  delaySuperSlow: 30, // 30 detik
  minWithdraw: 20000, // Min WD Rp 20.000
  maxWithdraw: 2000000, // Max WD Rp 2.000.000
  emptyContactMessage:
    'Kontak sedang habis saat ini. Mohon tunggu terlebih dahulu sampai admin melakukan pengisian ulang kontak. Terima kasih atas kesabaran Anda.',
  autoBlastEnabled: true,
  selectedTemplateId: 'tpl-1',
};

export function generateReferralCode(): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `nams${randomNum}`;
}

class Database {
  private data: DatabaseSchema = {
    users: [],
    passwords: {},
    bots: [],
    contacts: [],
    templates: [],
    sentLogs: [],
    withdrawRequests: [],
    announcements: [],
    settings: DEFAULT_SETTINGS,
    chatMessages: [],
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        // Ensure settings merge with defaults if keys are missing
        this.data.settings = { ...DEFAULT_SETTINGS, ...this.data.settings };
        if (!this.data.adminPassword) {
          this.data.adminPassword = 'namsblast2026';
        }
        if (!this.data.chatMessages) {
          this.data.chatMessages = [];
        }
      } else {
        this.seedInitialData();
        this.save();
      }
    } catch (e) {
      console.error('Error loading database file, initializing with seed data:', e);
      this.seedInitialData();
    }
  }

  private seedInitialData() {
    this.data.adminPassword = 'namsblast2026';
    const adminPassHash = bcrypt.hashSync('admin123', 10);
    const userPassHash = bcrypt.hashSync('user123', 10);

    const adminUser: User = {
      id: 'usr-admin-1',
      email: 'admin@namsblast.com',
      name: 'Super Administrator',
      role: 'ADMIN',
      referralCode: 'nams9999',
      referredByUserId: null,
      balance: 0,
      totalEarned: 0,
      totalReferralEarned: 0,
      totalMessagesSent: 0,
      createdAt: new Date().toISOString(),
    };

    const demoUser: User = {
      id: 'usr-user-1',
      email: 'user@namsblast.com',
      name: 'Budi Santoso',
      role: 'USER',
      referralCode: 'nams8291',
      referredByUserId: null,
      balance: 45750,
      totalEarned: 128500,
      totalReferralEarned: 15400,
      totalMessagesSent: 2570,
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    };

    const demoDownline: User = {
      id: 'usr-user-2',
      email: 'downline@namsblast.com',
      name: 'Ahmad Rizky',
      role: 'USER',
      referralCode: 'nams3041',
      referredByUserId: 'usr-user-1',
      balance: 15200,
      totalEarned: 45000,
      totalReferralEarned: 0,
      totalMessagesSent: 900,
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    };

    const demoBots: Bot[] = [
      {
        id: 'bot-1',
        userId: 'usr-user-1',
        phone: '6281234567890',
        name: 'WhatsApp Bisnis Utama',
        status: 'ONLINE',
        speed: 'FAST',
        isRunning: false, // User starts it manually
        lastActive: new Date().toISOString(),
        totalSent: 1640,
        totalFailed: 12,
        batteryLevel: 92,
        pushName: 'Budi Store CS',
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        currentTask: null,
      },
    ];

    const templates: MessageTemplate[] = [
      {
        id: 'tpl-1',
        title: 'Promo Spesial Diskon & Launching',
        text: 'Halo {nama}! 🌟\n\nDapatkan penawaran eksklusif diskon s/d 70% untuk semua layanan hari ini. Jangan lewatkan kesempatan terbatas ini!\n\nBalas *INFO* untuk konsultasi gratis.\nSalam hangat,\nTim Promosi',
        imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&auto=format&fit=crop&q=60',
        type: 'TEXT_IMAGE',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'tpl-2',
        title: 'Broadcast Pemberitahuan Event / Webinar',
        text: 'Selamat pagi {nama},\n\nKami mengundang Anda menghadiri Masterclass Bisnis Online Gratis yang akan diadakan malam ini pukul 19.30 WIB.\n\nKlik tautan berikut untuk klaim tiket:\nhttps://namsblast.com/event\n\nSampai jumpa di ruang webinar!',
        imageUrl: null,
        type: 'TEXT',
        isActive: false,
        createdAt: new Date().toISOString(),
      },
    ];

    // Seed initial contacts
    const sampleNames = ['Andi', 'Siti', 'Budi', 'Rina', 'Dewi', 'Hendra', 'Maya', 'Fajar', 'Putri', 'Dimas', 'Eka', 'Bayu', 'Ratna', 'Agus', 'Lestari'];
    const contacts: Contact[] = [];
    for (let i = 1; i <= 350; i++) {
      const randomPrefix = ['0812', '0813', '0821', '0857', '0878', '0896'][i % 6];
      const randomSuffix = String(1000000 + i * 37).slice(-7);
      const name = sampleNames[i % sampleNames.length] + ' ' + (i % 20 === 0 ? 'Kusuma' : '');
      contacts.push({
        id: `cnt-${i}`,
        phone: `${randomPrefix}${randomSuffix}`,
        name: name.trim(),
        status: i <= 20 ? 'sent' : 'pending',
        assignedBotId: i <= 20 ? 'bot-1' : null,
        sentAt: i <= 20 ? new Date(Date.now() - i * 60000).toISOString() : null,
        errorMessage: null,
        batchId: 'batch-initial-01',
        createdAt: new Date().toISOString(),
      });
    }

    const announcements: Announcement[] = [
      {
        id: 'ann-1',
        title: '🚀 Server Blast NamsBlast v2.5 Resmi Dirilis!',
        content: 'Kami telah mengoptimalkan queue Baileys multi-bot dengan fitur anti double-send dan perlindungan session otomatis. Pastikan nomor bot Anda selalu online untuk memaksimalkan passive income!',
        type: 'IMPORTANT',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'ann-2',
        title: '💸 Jadwal Proses Withdraw Setiap Hari Pukul 10.00 & 19.00 WIB',
        content: 'Admin memproses pencairan saldo ke seluruh Bank (BCA, Mandiri, BRI, BNI) dan E-Wallet (DANA, GoPay, OVO, ShopeePay). Maksimal proses 24 jam.',
        type: 'INFO',
        isActive: true,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ];

    const withdrawRequests: WithdrawRequest[] = [
      {
        id: 'wd-101',
        userId: 'usr-user-1',
        userEmail: 'user@namsblast.com',
        userName: 'Budi Santoso',
        amount: 50000,
        bankName: 'BCA',
        accountNumber: '8270192811',
        accountHolder: 'Budi Santoso',
        status: 'SUCCESS',
        adminNote: 'Dana berhasil ditransfer via Flip/BCA.',
        requestedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        processedAt: new Date(Date.now() - 86400000 * 2 + 3600000).toISOString(),
      },
      {
        id: 'wd-102',
        userId: 'usr-user-1',
        userEmail: 'user@namsblast.com',
        userName: 'Budi Santoso',
        amount: 30000,
        bankName: 'DANA',
        accountNumber: '081234567890',
        accountHolder: 'Budi Santoso',
        status: 'PENDING',
        adminNote: null,
        requestedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        processedAt: null,
      },
    ];

    const chatMessages: ChatMessage[] = [
      {
        id: 'chat-1',
        userId: 'usr-user-1',
        userName: 'Budi Santoso',
        userEmail: 'user@namsblast.com',
        sender: 'ADMIN',
        text: 'Halo Budi! Selamat datang di NamsBlast. Ada yang bisa kami bantu seputar koneksi WhatsApp atau pencairan saldo?',
        createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
        read: true,
      },
      {
        id: 'chat-2',
        userId: 'usr-user-1',
        userName: 'Budi Santoso',
        userEmail: 'user@namsblast.com',
        sender: 'USER',
        text: 'Halo admin, untuk minimal penarikan berapa ya dan prosesnya berapa lama?',
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        read: true,
      },
      {
        id: 'chat-3',
        userId: 'usr-user-1',
        userName: 'Budi Santoso',
        userEmail: 'user@namsblast.com',
        sender: 'ADMIN',
        text: 'Minimal penarikan adalah Rp 20.000 ke semua Bank dan E-Wallet (DANA/OVO/GoPay/ShopeePay). Proses otomatis di batch pukul 10.00 & 19.00 WIB setiap hari ya!',
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        read: true,
      },
    ];

    this.data = {
      users: [adminUser, demoUser, demoDownline],
      passwords: {
        'usr-admin-1': adminPassHash,
        'usr-user-1': userPassHash,
        'usr-user-2': userPassHash,
      },
      bots: demoBots,
      contacts,
      templates,
      sentLogs: [],
      withdrawRequests,
      announcements,
      settings: DEFAULT_SETTINGS,
      chatMessages,
    };
  }

  public save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write database file:', e);
    }
  }

  // --- Users ---
  public getUsers(): User[] {
    return this.data.users;
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public getUserByReferralCode(code: string): User | undefined {
    return this.data.users.find((u) => u.referralCode.toUpperCase() === code.trim().toUpperCase());
  }

  public createUser(user: User, passwordHash: string): User {
    this.data.users.push(user);
    this.data.passwords[user.id] = passwordHash;
    this.save();
    return user;
  }

  public getPasswordHash(userId: string): string | undefined {
    return this.data.passwords[userId];
  }

  // --- Admin Master Password Management ---
  public getAdminPassword(): string {
    return this.data.adminPassword || 'namsblast2026';
  }

  public setAdminPassword(newPassword: string): void {
    this.data.adminPassword = newPassword.trim();
    this.save();
  }

  public verifyAdminPassword(inputPass: string): boolean {
    const current = this.getAdminPassword();
    return current === inputPass.trim();
  }

  public updateUser(userId: string, updates: Partial<User>): User | undefined {
    const idx = this.data.users.findIndex((u) => u.id === userId);
    if (idx === -1) return undefined;
    this.data.users[idx] = { ...this.data.users[idx], ...updates };
    this.save();
    return this.data.users[idx];
  }

  // --- Bots ---
  public getBots(): Bot[] {
    return this.data.bots;
  }

  public getBotsByUserId(userId: string): Bot[] {
    return this.data.bots.filter((b) => b.userId === userId);
  }

  public getBotById(id: string): Bot | undefined {
    return this.data.bots.find((b) => b.id === id);
  }

  public createBot(bot: Bot): Bot {
    this.data.bots.push(bot);
    this.save();
    return bot;
  }

  public updateBot(botId: string, updates: Partial<Bot>): Bot | undefined {
    const idx = this.data.bots.findIndex((b) => b.id === botId);
    if (idx === -1) return undefined;
    this.data.bots[idx] = { ...this.data.bots[idx], ...updates };
    this.save();
    return this.data.bots[idx];
  }

  public deleteBot(botId: string): boolean {
    const initialLen = this.data.bots.length;
    this.data.bots = this.data.bots.filter((b) => b.id !== botId);
    if (this.data.bots.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // --- Contacts ---
  public getContacts(): Contact[] {
    return this.data.contacts;
  }

  public getPendingContacts(): Contact[] {
    const sentPhones = new Set<string>();
    for (const l of this.data.sentLogs) {
      if (l.status === 'SUCCESS') {
        sentPhones.add(l.phone.replace(/[^0-9]/g, ''));
      }
    }
    for (const c of this.data.contacts) {
      if (c.status === 'sent') {
        sentPhones.add(c.phone.replace(/[^0-9]/g, ''));
      }
    }

    return this.data.contacts.filter((c) => {
      if (c.status !== 'pending') return false;
      const clean = c.phone.replace(/[^0-9]/g, '');
      if (sentPhones.has(clean)) {
        // Automatically mark as sent so it won't ever be blasted again (1 number 1 message strict)
        c.status = 'sent';
        return false;
      }
      return true;
    });
  }

  public addContacts(newContacts: Contact[]): { added: number; skippedDuplicates: number } {
    const existingPhones = new Set(this.data.contacts.map((c) => c.phone.replace(/[^0-9]/g, '')));
    const toAdd: Contact[] = [];
    let skipped = 0;

    for (const c of newContacts) {
      const cleanPhone = c.phone.replace(/[^0-9]/g, '');
      if (!cleanPhone || existingPhones.has(cleanPhone)) {
        skipped++;
      } else {
        existingPhones.add(cleanPhone);
        toAdd.push(c);
      }
    }

    this.data.contacts.push(...toAdd);
    this.save();
    return { added: toAdd.length, skippedDuplicates: skipped };
  }

  public updateContact(id: string, updates: Partial<Contact>): Contact | undefined {
    const idx = this.data.contacts.findIndex((c) => c.id === id);
    if (idx === -1) return undefined;
    this.data.contacts[idx] = { ...this.data.contacts[idx], ...updates };
    this.save();
    return this.data.contacts[idx];
  }

  public clearAllContacts(): void {
    this.data.contacts = [];
    this.save();
  }

  // --- Sent Logs ---
  public getSentLogs(): SentLog[] {
    return this.data.sentLogs;
  }

  public addSentLog(log: SentLog): SentLog {
    this.data.sentLogs.unshift(log); // newest first
    if (this.data.sentLogs.length > 5000) {
      this.data.sentLogs = this.data.sentLogs.slice(0, 5000);
    }
    this.save();
    return log;
  }

  public isPhoneAlreadySent(phone: string): boolean {
    const clean = phone.replace(/[^0-9]/g, '');
    if (!clean) return true;
    const sentInLogs = this.data.sentLogs.some(
      (l) => l.status === 'SUCCESS' && l.phone.replace(/[^0-9]/g, '') === clean
    );
    const sentInContacts = this.data.contacts.some(
      (c) => c.status === 'sent' && c.phone.replace(/[^0-9]/g, '') === clean
    );
    return sentInLogs || sentInContacts;
  }

  // --- Message Templates ---
  public getTemplates(): MessageTemplate[] {
    return this.data.templates;
  }

  public getTemplateById(id: string): MessageTemplate | undefined {
    return this.data.templates.find((t) => t.id === id);
  }

  public getActiveTemplate(): MessageTemplate | undefined {
    if (this.data.settings.selectedTemplateId) {
      const found = this.data.templates.find((t) => t.id === this.data.settings.selectedTemplateId);
      if (found) return found;
    }
    return this.data.templates.find((t) => t.isActive) || this.data.templates[0];
  }

  public createTemplate(tpl: MessageTemplate): MessageTemplate {
    this.data.templates.push(tpl);
    this.save();
    return tpl;
  }

  public updateTemplate(id: string, updates: Partial<MessageTemplate>): MessageTemplate | undefined {
    const idx = this.data.templates.findIndex((t) => t.id === id);
    if (idx === -1) return undefined;
    this.data.templates[idx] = { ...this.data.templates[idx], ...updates };
    this.save();
    return this.data.templates[idx];
  }

  public deleteTemplate(id: string): boolean {
    const initialLen = this.data.templates.length;
    this.data.templates = this.data.templates.filter((t) => t.id !== id);
    if (this.data.templates.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // --- Withdraw Requests ---
  public getWithdrawRequests(): WithdrawRequest[] {
    return this.data.withdrawRequests;
  }

  public createWithdrawRequest(req: WithdrawRequest): WithdrawRequest {
    this.data.withdrawRequests.unshift(req);
    this.save();
    return req;
  }

  public updateWithdrawRequest(id: string, updates: Partial<WithdrawRequest>): WithdrawRequest | undefined {
    const idx = this.data.withdrawRequests.findIndex((w) => w.id === id);
    if (idx === -1) return undefined;
    this.data.withdrawRequests[idx] = { ...this.data.withdrawRequests[idx], ...updates };
    this.save();
    return this.data.withdrawRequests[idx];
  }

  // --- Announcements ---
  public getAnnouncements(): Announcement[] {
    return this.data.announcements;
  }

  public createAnnouncement(ann: Announcement): Announcement {
    this.data.announcements.unshift(ann);
    this.save();
    return ann;
  }

  public updateAnnouncement(id: string, updates: Partial<Announcement>): Announcement | undefined {
    const idx = this.data.announcements.findIndex((a) => a.id === id);
    if (idx === -1) return undefined;
    this.data.announcements[idx] = { ...this.data.announcements[idx], ...updates };
    this.save();
    return this.data.announcements[idx];
  }

  public deleteAnnouncement(id: string): boolean {
    const initialLen = this.data.announcements.length;
    this.data.announcements = this.data.announcements.filter((a) => a.id !== id);
    if (this.data.announcements.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // --- Settings ---
  public getSettings(): SystemSettings {
    return this.data.settings;
  }

  public updateSettings(updates: Partial<SystemSettings>): SystemSettings {
    this.data.settings = { ...this.data.settings, ...updates };
    this.save();
    return this.data.settings;
  }

  // --- Live Chat Support ---
  public getChatMessages(userId?: string): ChatMessage[] {
    if (!userId) return this.data.chatMessages || [];
    return (this.data.chatMessages || []).filter((c) => c.userId === userId);
  }

  public addChatMessage(msg: Omit<ChatMessage, 'id' | 'createdAt' | 'read'>): ChatMessage {
    const newMsg: ChatMessage = {
      id: `chat-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
      read: false,
      ...msg,
    };
    if (!this.data.chatMessages) this.data.chatMessages = [];
    this.data.chatMessages.push(newMsg);
    this.save();
    return newMsg;
  }

  public markChatRead(userId: string, sender: 'USER' | 'ADMIN'): void {
    if (!this.data.chatMessages) return;
    let changed = false;
    for (const msg of this.data.chatMessages) {
      if (msg.userId === userId && msg.sender === sender && !msg.read) {
        msg.read = true;
        changed = true;
      }
    }
    if (changed) this.save();
  }

  // --- Database Direct Management (Admin Panel Integration) ---
  public getRawDatabase(): Omit<DatabaseSchema, 'passwords'> & { stats: { sizeBytes: number; lastModified: string } } {
    let sizeBytes = 0;
    let lastModified = new Date().toISOString();
    try {
      if (fs.existsSync(DATA_FILE)) {
        const stat = fs.statSync(DATA_FILE);
        sizeBytes = stat.size;
        lastModified = stat.mtime.toISOString();
      }
    } catch (e) {}

    return {
      users: this.data.users,
      bots: this.data.bots,
      contacts: this.data.contacts,
      templates: this.data.templates,
      sentLogs: this.data.sentLogs,
      withdrawRequests: this.data.withdrawRequests,
      announcements: this.data.announcements,
      settings: this.data.settings,
      chatMessages: this.data.chatMessages || [],
      stats: {
        sizeBytes,
        lastModified,
      },
    };
  }

  public importRawDatabase(importedData: any): boolean {
    if (!importedData || typeof importedData !== 'object') {
      throw new Error('Format data JSON database tidak valid.');
    }

    if (Array.isArray(importedData.users)) this.data.users = importedData.users;
    if (Array.isArray(importedData.bots)) this.data.bots = importedData.bots;
    if (Array.isArray(importedData.contacts)) this.data.contacts = importedData.contacts;
    if (Array.isArray(importedData.templates)) this.data.templates = importedData.templates;
    if (Array.isArray(importedData.sentLogs)) this.data.sentLogs = importedData.sentLogs;
    if (Array.isArray(importedData.withdrawRequests)) this.data.withdrawRequests = importedData.withdrawRequests;
    if (Array.isArray(importedData.announcements)) this.data.announcements = importedData.announcements;
    if (importedData.settings && typeof importedData.settings === 'object') {
      this.data.settings = { ...DEFAULT_SETTINGS, ...importedData.settings };
    }
    if (Array.isArray(importedData.chatMessages)) this.data.chatMessages = importedData.chatMessages;

    this.save();
    return true;
  }

  public clearTable(tableName: string): boolean {
    switch (tableName) {
      case 'contacts':
        this.data.contacts = [];
        break;
      case 'sentLogs':
        this.data.sentLogs = [];
        break;
      case 'chatMessages':
        this.data.chatMessages = [];
        break;
      case 'withdrawRequests':
        this.data.withdrawRequests = [];
        break;
      case 'announcements':
        this.data.announcements = [];
        break;
      case 'bots':
        this.data.bots = [];
        break;
      default:
        return false;
    }
    this.save();
    return true;
  }

  public resetDatabase(): void {
    this.data = {
      users: [],
      passwords: {},
      bots: [],
      contacts: [],
      templates: [],
      sentLogs: [],
      withdrawRequests: [],
      announcements: [],
      settings: DEFAULT_SETTINGS,
      chatMessages: [],
    };
    this.seedInitialData();
    this.save();
  }
}

export const db = new Database();
