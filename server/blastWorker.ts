import { db } from './db';
import { Bot, Contact, MessageTemplate, SentLog } from '../src/types';
import { whatsappManager } from './whatsappManager';

class BlastWorker {
  private isRunning: boolean = false;
  private timer: NodeJS.Timeout | null = null;
  private activeBotTasks: Map<string, boolean> = new Map(); // botId -> isBusy

  constructor() {
    this.start();
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('[BlastWorker] Auto-blast engine initialized & running.');
    this.loop();
  }

  public stop() {
    this.isRunning = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    console.log('[BlastWorker] Auto-blast engine stopped.');
  }

  private loop = async () => {
    if (!this.isRunning) return;

    try {
      await this.processQueueStep();
    } catch (err) {
      console.error('[BlastWorker] Error in loop:', err);
    }

    // Loop interval tick every 1.5 seconds
    this.timer = setTimeout(this.loop, 1500);
  };

  private async processQueueStep() {
    const settings = db.getSettings();
    if (!settings.autoBlastEnabled) {
      return;
    }

    // Only process bots that are ONLINE, user has started (isRunning === true), and not busy
    const onlineRunningBots = db
      .getBots()
      .filter((b) => b.status === 'ONLINE' && b.isRunning === true && !this.activeBotTasks.get(b.id));

    if (onlineRunningBots.length === 0) {
      return;
    }

    const pendingContacts = db.getPendingContacts();
    if (pendingContacts.length === 0) {
      return;
    }

    const activeTemplate = db.getActiveTemplate();
    if (!activeTemplate) {
      return;
    }

    // For each idle running bot, dispatch one task if contacts exist
    for (const bot of onlineRunningBots) {
      const nextContact = pendingContacts.find((c) => c.status === 'pending');
      if (!nextContact) break;

      // Claim contact immediately
      db.updateContact(nextContact.id, {
        status: 'processing',
        assignedBotId: bot.id,
      });

      this.activeBotTasks.set(bot.id, true);
      db.updateBot(bot.id, { currentTask: 'Aktif Mengirim' });

      // Run asynchronous dispatch with bot speed delay
      this.dispatchSingleMessage(bot, nextContact, activeTemplate);
    }
  }

  private async dispatchSingleMessage(bot: Bot, contact: Contact, template: MessageTemplate) {
    const settings = db.getSettings();

    // Determine delay based on bot's chosen speed
    let delaySeconds = settings.delayFast;
    if (bot.speed === 'SUPER_FAST') delaySeconds = settings.delaySuperFast;
    else if (bot.speed === 'FAST') delaySeconds = settings.delayFast;
    else if (bot.speed === 'SLOW') delaySeconds = settings.delaySlow;
    else if (bot.speed === 'SUPER_SLOW') delaySeconds = settings.delaySuperSlow;

    const delayMs = Math.max(1000, delaySeconds * 1000);

    setTimeout(async () => {
      try {
        // Double-check if bot is still online & running
        const currentBotState = db.getBotById(bot.id);
        if (!currentBotState || currentBotState.status !== 'ONLINE' || !currentBotState.isRunning) {
          // Bot disconnected or paused mid-blast -> fallback contact to pending
          db.updateContact(contact.id, {
            status: 'pending',
            assignedBotId: null,
            errorMessage: 'Bot dijeda atau terputus saat proses kirim, dialihkan ke antrian.',
          });
          this.activeBotTasks.delete(bot.id);
          return;
        }

        // Anti Double-Send Check
        if (db.isPhoneAlreadySent(contact.phone)) {
          db.updateContact(contact.id, {
            status: 'sent',
            errorMessage: 'Dilewati: Nomor sudah pernah terkirim sebelumnya (Anti Double-Send).',
          });
          this.activeBotTasks.delete(bot.id);
          db.updateBot(bot.id, { currentTask: null });
          return;
        }

        // Format message body
        const personalizedText = (template.text || '')
          .replace(/{nama}/gi, contact.name || 'Kak')
          .replace(/{name}/gi, contact.name || 'Kak')
          .replace(/{nomor}/gi, contact.phone || '');

        // Send via WhatsApp Socket Engine
        const sendResult = await whatsappManager.sendMessage(
          bot.id,
          contact.phone,
          personalizedText
        );

        const isSuccess = sendResult.success;

        const botOwner = db.getUserById(bot.userId);
        const ratePerMessage = settings.ratePerMessage;
        const rateReferral = settings.rateReferralPerMessage;

        if (isSuccess) {
          // 1. Update contact
          db.updateContact(contact.id, {
            status: 'sent',
            sentAt: new Date().toISOString(),
            errorMessage: null,
          });

          // 2. Increment Bot Stats
          db.updateBot(bot.id, {
            totalSent: (bot.totalSent || 0) + 1,
            lastActive: new Date().toISOString(),
            currentTask: null,
          });

          // 3. Earning to Bot Owner
          let refEarningGiven = 0;
          if (botOwner) {
            db.updateUser(botOwner.id, {
              balance: (botOwner.balance || 0) + ratePerMessage,
              totalEarned: (botOwner.totalEarned || 0) + ratePerMessage,
              totalMessagesSent: (botOwner.totalMessagesSent || 0) + 1,
            });

            // 4. Earning to Referrer if exists
            if (botOwner.referredByUserId) {
              const referrer = db.getUserById(botOwner.referredByUserId);
              if (referrer) {
                refEarningGiven = rateReferral;
                db.updateUser(referrer.id, {
                  balance: (referrer.balance || 0) + rateReferral,
                  totalEarned: (referrer.totalEarned || 0) + rateReferral,
                  totalReferralEarned: (referrer.totalReferralEarned || 0) + rateReferral,
                });
              }
            }
          }

          // 5. Append Sent Log
          const log: SentLog = {
            id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            contactId: contact.id,
            phone: contact.phone,
            contactName: contact.name || 'Pelanggan WhatsApp',
            botId: bot.id,
            botPhone: bot.phone,
            userId: bot.userId,
            userEmail: botOwner?.email || '',
            templateId: template.id,
            templateTitle: template.title,
            status: 'SUCCESS',
            earningAdded: ratePerMessage,
            referralEarningAdded: refEarningGiven,
            timestamp: new Date().toISOString(),
            detail: `Terkirim via WhatsApp Web Socket (${sendResult.messageId || 'Msg-OK'})`,
          };
          db.addSentLog(log);
        } else {
          // Failed delivery
          db.updateContact(contact.id, {
            status: 'failed',
            errorMessage: sendResult.error || 'Nomor tidak terdaftar di WhatsApp atau koneksi timeout.',
          });

          db.updateBot(bot.id, {
            totalFailed: (bot.totalFailed || 0) + 1,
            lastActive: new Date().toISOString(),
            currentTask: null,
          });

          const log: SentLog = {
            id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            contactId: contact.id,
            phone: contact.phone,
            contactName: contact.name || 'Kontak',
            botId: bot.id,
            botPhone: bot.phone,
            userId: bot.userId,
            userEmail: botOwner?.email || '',
            templateId: template.id,
            templateTitle: template.title,
            status: 'FAILED',
            earningAdded: 0,
            referralEarningAdded: 0,
            timestamp: new Date().toISOString(),
            detail: `Gagal: ${sendResult.error || 'Nomor tidak aktif'}`,
          };
          db.addSentLog(log);
        }
      } catch (err) {
        console.error('[BlastWorker] Error in dispatchSingleMessage execution:', err);
      } finally {
        this.activeBotTasks.delete(bot.id);
      }
    }, delayMs);
  }
}

export const blastWorker = new BlastWorker();
