import {
  User,
  Bot,
  Contact,
  MessageTemplate,
  SentLog,
  WithdrawRequest,
  Announcement,
  SystemSettings,
  DashboardStats,
  BotSpeed,
  ChatMessage,
} from '../types';

const API_BASE = '/api';

async function safeFetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const contentType = res.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`Server error (${res.status}): Gagal memuat data.`);
    }
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error(`Respon server tidak valid.`);
    }
  }

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || `Request error (${res.status})`);
  }
  return json as T;
}

export class ApiService {
  private static getHeaders(userId?: string | null): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (userId) {
      headers['x-user-id'] = userId;
    }
    return headers;
  }

  // --- Auth ---
  static async register(data: {
    email: string;
    name: string;
    password: string;
    confirmPassword: string;
    referralCode?: string;
  }): Promise<{ user: User; message: string }> {
    return safeFetchJson<{ user: User; message: string }>(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
  }

  static async login(
    dataOrEmail: { email: string; password: string } | string,
    passwordParam?: string
  ): Promise<{ user: User; message: string }> {
    const payload =
      typeof dataOrEmail === 'string'
        ? { email: dataOrEmail, password: passwordParam || '' }
        : dataOrEmail;

    return safeFetchJson<{ user: User; message: string }>(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
  }

  static async getMe(userId: string): Promise<User> {
    const json = await safeFetchJson<{ user: User }>(`${API_BASE}/auth/me`, {
      headers: this.getHeaders(userId),
    });
    return json.user;
  }

  static async getUser(userId: string): Promise<User> {
    return this.getMe(userId);
  }

  // --- Dashboard Stats ---
  static async getDashboardStats(userId?: string | null): Promise<DashboardStats> {
    return safeFetchJson<DashboardStats>(`${API_BASE}/dashboard/stats`, {
      headers: this.getHeaders(userId),
    });
  }

  // --- Bots / WhatsApp Connections ---
  static async getBots(userId: string, all: boolean = false): Promise<Bot[]> {
    const json = await safeFetchJson<{ bots: Bot[] }>(`${API_BASE}/bots${all ? '?all=true' : ''}`, {
      headers: this.getHeaders(userId),
    });
    return json.bots || [];
  }

  static async getUserBots(userId: string): Promise<Bot[]> {
    return this.getBots(userId, false);
  }

  static async connectBot(
    userId: string,
    data: {
      authMethod: 'qr' | 'pairing_code';
      phoneNumber?: string;
      phone?: string;
      name?: string;
    }
  ): Promise<{
    bot: Bot;
    authMethod: 'qr' | 'pairing_code';
    qrDataUrl?: string;
    pairingCode?: string;
    message: string;
  }> {
    return safeFetchJson<{
      bot: Bot;
      authMethod: 'qr' | 'pairing_code';
      qrDataUrl?: string;
      pairingCode?: string;
      message: string;
    }>(`${API_BASE}/bots/connect`, {
      method: 'POST',
      headers: this.getHeaders(userId),
      body: JSON.stringify({
        userId,
        ...data,
      }),
    });
  }

  static async connectQr(userId: string, data: { name?: string; phone?: string }): Promise<{ bot: Bot; qrDataUrl: string; message: string }> {
    return safeFetchJson<{ bot: Bot; qrDataUrl: string; message: string }>(`${API_BASE}/bots/connect-qr`, {
      method: 'POST',
      headers: this.getHeaders(userId),
      body: JSON.stringify(data),
    });
  }

  static async connectPairing(userId: string, data: { name?: string; phone: string }): Promise<{ bot: Bot; pairingCode: string; message: string }> {
    return safeFetchJson<{ bot: Bot; pairingCode: string; message: string }>(`${API_BASE}/bots/connect-pairing`, {
      method: 'POST',
      headers: this.getHeaders(userId),
      body: JSON.stringify(data),
    });
  }

  static async verifyConnect(botId: string): Promise<{ bot: Bot; message: string }> {
    return safeFetchJson<{ bot: Bot; message: string }>(`${API_BASE}/bots/${botId}/verify-connect`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({}),
    });
  }

  static async getBotStatus(botId: string): Promise<{
    bot: Bot;
    isOnline: boolean;
    status: string;
    qrCodeData?: string | null;
    pairingCode?: string | null;
    stepLogs?: Array<{ time: string; message: string; type: 'info' | 'success' | 'warning' | 'error' }>;
  }> {
    return safeFetchJson<{
      bot: Bot;
      isOnline: boolean;
      status: string;
      qrCodeData?: string | null;
      pairingCode?: string | null;
      stepLogs?: Array<{ time: string; message: string; type: 'info' | 'success' | 'warning' | 'error' }>;
    }>(`${API_BASE}/bots/${botId}/status`, {
      headers: this.getHeaders(),
    });
  }

  static async refreshBotQr(botId: string, userId?: string): Promise<{ bot: Bot; qrDataUrl?: string; message: string }> {
    return safeFetchJson<{ bot: Bot; qrDataUrl?: string; message: string }>(`${API_BASE}/bots/${botId}/refresh-qr`, {
      method: 'POST',
      headers: this.getHeaders(userId),
      body: JSON.stringify({ userId }),
    });
  }

  static async startBot(botId: string, speed: BotSpeed): Promise<Bot> {
    const json = await safeFetchJson<{ bot: Bot }>(`${API_BASE}/bots/${botId}/start`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ speed }),
    });
    return json.bot;
  }

  static async stopBot(botId: string): Promise<Bot> {
    const json = await safeFetchJson<{ bot: Bot }>(`${API_BASE}/bots/${botId}/stop`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({}),
    });
    return json.bot;
  }

  static async reconnectBot(botId: string): Promise<Bot> {
    const json = await safeFetchJson<{ bot: Bot }>(`${API_BASE}/bots/${botId}/reconnect`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({}),
    });
    return json.bot;
  }

  static async updateBotSpeed(userId: string, botId: string, speed: BotSpeed): Promise<Bot> {
    const json = await safeFetchJson<{ bot: Bot }>(`${API_BASE}/bots/${botId}/speed`, {
      method: 'PUT',
      headers: this.getHeaders(userId),
      body: JSON.stringify({ speed }),
    });
    return json.bot;
  }

  static async toggleBotStatus(botId: string, status: 'ONLINE' | 'OFFLINE'): Promise<Bot> {
    const json = await safeFetchJson<{ bot: Bot }>(`${API_BASE}/bots/${botId}/status`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ status }),
    });
    return json.bot;
  }

  static async deleteBot(userIdOrBotId: string, botIdParam?: string): Promise<boolean> {
    const targetBotId = botIdParam ? botIdParam : userIdOrBotId;
    const userId = botIdParam ? userIdOrBotId : undefined;
    const json = await safeFetchJson<{ success: boolean }>(`${API_BASE}/bots/${targetBotId}`, {
      method: 'DELETE',
      headers: this.getHeaders(userId),
    });
    return json.success;
  }

  // --- Contacts (Admin & Global) ---
  static async getContacts(params?: { page?: number; limit?: number; status?: string; search?: string }): Promise<{
    contacts: Contact[];
    total: number;
    page: number;
    totalPages: number;
    counts: { all: number; pending: number; sent: number; failed: number };
  }> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);

    return safeFetchJson(`${API_BASE}/contacts?${query.toString()}`, {
      headers: this.getHeaders(),
    });
  }

  static async uploadContacts(contacts: Array<{ phone: string; name?: string }>): Promise<{ added: number; skipped: number; message: string }> {
    return safeFetchJson<{ added: number; skipped: number; message: string }>(`${API_BASE}/contacts/upload`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ contacts }),
    });
  }

  static async addSingleContact(data: { phone: string; name?: string }): Promise<Contact> {
    const json = await safeFetchJson<{ contact: Contact }>(`${API_BASE}/contacts/add-single`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return json.contact;
  }

  static async clearAllContacts(): Promise<boolean> {
    const json = await safeFetchJson<{ success: boolean }>(`${API_BASE}/contacts/clear-all`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return json.success;
  }

  // --- Templates ---
  static async getTemplates(): Promise<{ templates: MessageTemplate[]; activeTemplateId?: string | null }> {
    return safeFetchJson<{ templates: MessageTemplate[]; activeTemplateId?: string | null }>(`${API_BASE}/templates`, {
      headers: this.getHeaders(),
    });
  }

  static async createTemplate(data: Partial<MessageTemplate>): Promise<MessageTemplate> {
    const json = await safeFetchJson<{ template: MessageTemplate }>(`${API_BASE}/templates`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return json.template;
  }

  static async updateTemplate(id: string, data: Partial<MessageTemplate>): Promise<MessageTemplate> {
    const json = await safeFetchJson<{ template: MessageTemplate }>(`${API_BASE}/templates/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return json.template;
  }

  static async deleteTemplate(id: string): Promise<boolean> {
    const json = await safeFetchJson<{ success: boolean }>(`${API_BASE}/templates/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return json.success;
  }

  static async setActiveTemplate(id: string): Promise<boolean> {
    const json = await safeFetchJson<{ success: boolean }>(`${API_BASE}/templates/${id}/set-active`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    return json.success;
  }

  // --- Withdraw ---
  static async getMyWithdraws(userId: string): Promise<WithdrawRequest[]> {
    const json = await safeFetchJson<{ requests: WithdrawRequest[] }>(`${API_BASE}/withdraw/my`, {
      headers: this.getHeaders(userId),
    });
    return json.requests || [];
  }

  static async getUserWithdraws(userId: string): Promise<WithdrawRequest[]> {
    return this.getMyWithdraws(userId);
  }

  static async requestWithdraw(
    userIdOrData: string | { userId?: string; amount: number; bankName: string; accountNumber: string; accountHolder: string },
    dataParam?: { amount: number; bankName: string; accountNumber: string; accountHolder: string }
  ): Promise<{ message: string; withdraw: WithdrawRequest }> {
    let targetUserId: string | undefined;
    let payload: { amount: number; bankName: string; accountNumber: string; accountHolder: string };

    if (typeof userIdOrData === 'string') {
      targetUserId = userIdOrData;
      payload = dataParam!;
    } else {
      targetUserId = userIdOrData.userId;
      payload = {
        amount: userIdOrData.amount,
        bankName: userIdOrData.bankName,
        accountNumber: userIdOrData.accountNumber,
        accountHolder: userIdOrData.accountHolder,
      };
    }

    return safeFetchJson<{ message: string; withdraw: WithdrawRequest }>(`${API_BASE}/withdraw/request`, {
      method: 'POST',
      headers: this.getHeaders(targetUserId),
      body: JSON.stringify(payload),
    });
  }

  static async getAllWithdrawsAdmin(): Promise<WithdrawRequest[]> {
    const json = await safeFetchJson<{ requests: WithdrawRequest[] }>(`${API_BASE}/withdraw/admin/all`, {
      headers: this.getHeaders(),
    });
    return json.requests || [];
  }

  static async approveWithdrawAdmin(id: string, note?: string): Promise<WithdrawRequest> {
    const json = await safeFetchJson<{ withdraw: WithdrawRequest }>(`${API_BASE}/withdraw/admin/${id}/approve`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ note }),
    });
    return json.withdraw;
  }

  static async rejectWithdrawAdmin(id: string, note?: string): Promise<WithdrawRequest> {
    const json = await safeFetchJson<{ withdraw: WithdrawRequest }>(`${API_BASE}/withdraw/admin/${id}/reject`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ note }),
    });
    return json.withdraw;
  }

  // --- Referrals ---
  static async getMyReferrals(userId: string): Promise<{
    referralCode: string;
    totalReferralEarned: number;
    rateReferralPerMessage: number;
    totalDownlines: number;
    downlines: Array<{ id: string; name: string; email: string; totalMessagesSent: number; joinedAt: string }>;
  }> {
    return safeFetchJson(`${API_BASE}/referrals/my`, {
      headers: this.getHeaders(userId),
    });
  }

  // --- Announcements ---
  static async getAnnouncements(): Promise<Announcement[]> {
    const json = await safeFetchJson<{ announcements: Announcement[] }>(`${API_BASE}/announcements`, {
      headers: this.getHeaders(),
    });
    return json.announcements || [];
  }

  static async getAllAnnouncementsAdmin(): Promise<Announcement[]> {
    const json = await safeFetchJson<{ announcements: Announcement[] }>(`${API_BASE}/announcements/admin/all`, {
      headers: this.getHeaders(),
    });
    return json.announcements || [];
  }

  static async createAnnouncement(data: Partial<Announcement>): Promise<Announcement> {
    const json = await safeFetchJson<{ announcement: Announcement }>(`${API_BASE}/announcements/admin`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return json.announcement;
  }

  static async updateAnnouncement(id: string, data: Partial<Announcement>): Promise<Announcement> {
    const json = await safeFetchJson<{ announcement: Announcement }>(`${API_BASE}/announcements/admin/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return json.announcement;
  }

  static async deleteAnnouncement(id: string): Promise<boolean> {
    const json = await safeFetchJson<{ success: boolean }>(`${API_BASE}/announcements/admin/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return json.success;
  }

  // --- Settings ---
  static async getSettings(): Promise<SystemSettings> {
    const json = await safeFetchJson<{ settings: SystemSettings }>(`${API_BASE}/settings`, {
      headers: this.getHeaders(),
    });
    return json.settings;
  }

  static async updateSettingsAdmin(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    const json = await safeFetchJson<{ settings: SystemSettings }>(`${API_BASE}/settings/admin`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(settings),
    });
    return json.settings;
  }

  // --- Logs ---
  static async getLogs(userId?: string, page: number = 1, limit: number = 30): Promise<{
    logs: SentLog[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    return safeFetchJson(`${API_BASE}/logs?page=${page}&limit=${limit}`, {
      headers: this.getHeaders(userId),
    });
  }

  static async getLiveLogs(limit: number = 30): Promise<SentLog[]> {
    const json = await safeFetchJson<{ logs: SentLog[] }>(`${API_BASE}/logs?limit=${limit}`, {
      headers: this.getHeaders(),
    });
    return json.logs || [];
  }

  // --- Admin Users ---
  static async getAdminUsers(): Promise<User[]> {
    const json = await safeFetchJson<{ users: User[] }>(`${API_BASE}/admin/users`, {
      headers: this.getHeaders(),
    });
    return json.users || [];
  }

  // --- Live Chat Support ---
  static async getMyChat(userId: string): Promise<ChatMessage[]> {
    const json = await safeFetchJson<{ messages: ChatMessage[] }>(`${API_BASE}/chat/my`, {
      headers: this.getHeaders(userId),
    });
    return json.messages || [];
  }

  static async sendChatMessage(userId: string, text: string): Promise<ChatMessage> {
    const json = await safeFetchJson<{ message: ChatMessage }>(`${API_BASE}/chat/send`, {
      method: 'POST',
      headers: this.getHeaders(userId),
      body: JSON.stringify({ text }),
    });
    return json.message;
  }

  static async getAdminChatThreads(): Promise<Array<{ user: User; messages: ChatMessage[]; unreadCount: number; lastMessage: ChatMessage | null }>> {
    const json = await safeFetchJson<{ threads: Array<{ user: User; messages: ChatMessage[]; unreadCount: number; lastMessage: ChatMessage | null }> }>(
      `${API_BASE}/chat/admin/all`,
      {
        headers: this.getHeaders(),
      }
    );
    return json.threads || [];
  }

  static async adminReplyChat(targetUserId: string, text: string): Promise<ChatMessage> {
    const json = await safeFetchJson<{ message: ChatMessage }>(`${API_BASE}/chat/admin/reply`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ targetUserId, text }),
    });
    return json.message;
  }

  // --- Admin Master Password Management ---
  static async verifyAdminGate(password: string): Promise<{ success: boolean; message: string }> {
    return safeFetchJson<{ success: boolean; message: string }>(`${API_BASE}/admin/verify-gate`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ password }),
    });
  }

  static async changeAdminPassword(oldPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return safeFetchJson<{ success: boolean; message: string }>(`${API_BASE}/admin/change-password`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ oldPassword, newPassword }),
    });
  }

  // --- Direct Database Management ---
  static async getRawDatabase(): Promise<{
    database: {
      users: User[];
      bots: Bot[];
      contacts: Contact[];
      templates: MessageTemplate[];
      sentLogs: SentLog[];
      withdrawRequests: WithdrawRequest[];
      announcements: Announcement[];
      settings: SystemSettings;
      chatMessages: ChatMessage[];
      stats: { sizeBytes: number; lastModified: string };
    };
    summary: {
      totalUsers: number;
      totalBots: number;
      totalContacts: number;
      totalTemplates: number;
      totalSentLogs: number;
      totalWithdrawRequests: number;
      totalAnnouncements: number;
      totalChatMessages: number;
      sizeBytes: number;
      lastModified: string;
    };
  }> {
    return safeFetchJson(`${API_BASE}/admin/database/raw`, {
      headers: this.getHeaders(),
    });
  }

  static async importRawDatabase(data: any): Promise<{ success: boolean; message: string; database: any }> {
    return safeFetchJson(`${API_BASE}/admin/database/import`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ data }),
    });
  }

  static async clearDatabaseTable(tableName: string): Promise<{ success: boolean; message: string; database: any }> {
    return safeFetchJson(`${API_BASE}/admin/database/clear-table`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ tableName }),
    });
  }

  static async resetDatabase(): Promise<{ success: boolean; message: string; database: any }> {
    return safeFetchJson(`${API_BASE}/admin/database/reset`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
  }
}
