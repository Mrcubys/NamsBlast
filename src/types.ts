export type UserRole = 'ADMIN' | 'USER';

export type BotSpeed = 'SUPER_FAST' | 'FAST' | 'SLOW' | 'SUPER_SLOW';
export type SpeedOption = BotSpeed;

export type BotStatus = 'ONLINE' | 'OFFLINE' | 'CONNECTING' | 'PAIRING';

export type ContactStatus = 'pending' | 'sent' | 'failed' | 'processing';

export type TemplateType = 'TEXT' | 'TEXT_IMAGE' | 'IMAGE_ONLY';

export type WithdrawStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'REJECTED';

export type AnnouncementType = 'INFO' | 'WARNING' | 'IMPORTANT';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  referralCode: string;
  referredByUserId?: string | null;
  balance: number;
  totalEarned: number;
  totalReferralEarned: number;
  totalMessagesSent: number;
  createdAt: string;
}

export interface Bot {
  id: string;
  userId: string;
  phone: string;
  name: string;
  status: BotStatus;
  speed: BotSpeed;
  isRunning?: boolean; // User must click "Mulai" to start blasting
  qrCodeData?: string | null;
  pairingCode?: string | null;
  lastActive: string;
  totalSent: number;
  totalFailed: number;
  batteryLevel?: number;
  pushName?: string;
  createdAt: string;
  currentTask?: string | null;
}

export interface Contact {
  id: string;
  phone: string;
  name: string;
  status: ContactStatus;
  assignedBotId?: string | null;
  sentAt?: string | null;
  errorMessage?: string | null;
  batchId: string;
  createdAt: string;
}

export interface MessageTemplate {
  id: string;
  title: string;
  text: string;
  imageUrl?: string | null;
  type: TemplateType;
  isActive: boolean;
  createdAt: string;
}

export interface SentLog {
  id: string;
  contactId: string;
  phone: string;
  contactName: string;
  botId: string;
  botPhone: string;
  userId: string;
  userEmail: string;
  templateId: string;
  templateTitle: string;
  status: 'SUCCESS' | 'FAILED';
  earningAdded: number;
  referralEarningAdded: number;
  timestamp: string;
  detail?: string;
}

export interface WithdrawRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  bankName: string; // e.g. BCA, DANA, GoPay, Mandiri, BRI, OVO, ShopeePay
  accountNumber: string;
  accountHolder: string;
  status: WithdrawStatus;
  adminNote?: string | null;
  requestedAt: string;
  processedAt?: string | null;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  isActive: boolean;
  createdAt: string;
}

export interface SystemSettings {
  ratePerMessage: number; // IDR per success message (flat across speeds)
  rateReferralPerMessage: number; // IDR per success message for referrer
  delaySuperFast: number; // in seconds
  delayFast: number; // in seconds
  delaySlow: number; // in seconds
  delaySuperSlow: number; // in seconds
  minWithdraw: number; // IDR
  maxWithdraw: number; // IDR
  emptyContactMessage: string;
  autoBlastEnabled: boolean;
  selectedTemplateId?: string | null;
}

export interface DashboardStats {
  globalContactsAvailable: number;
  globalContactsTotal: number;
  globalContactsSent: number;
  globalContactsFailed: number;
  globalOnlineBots: number;
  globalTotalBots: number;
  globalSentToday: number;
  emptyContactMessage: string;
  
  // User-specific stats (if logged in)
  userBalance: number;
  userTotalEarned: number;
  userTotalReferralEarned: number;
  userMessagesSentToday: number;
  userMessagesSentTotal: number;
  userBotsCount: number;
  userOnlineBotsCount: number;
  userReferralCount: number;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  sender: 'USER' | 'ADMIN';
  text: string;
  createdAt: string;
  read: boolean;
}
