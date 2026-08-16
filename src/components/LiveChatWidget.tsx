import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, User, Check, CheckCheck, Headphones, ShieldCheck, Sparkles } from 'lucide-react';
import { User as UserType, ChatMessage } from '../types';
import { ApiService } from '../services/api';

interface LiveChatWidgetProps {
  currentUser: UserType | null;
  onOpenAuth: () => void;
}

export const LiveChatWidget: React.FC<LiveChatWidgetProps> = ({ currentUser, onOpenAuth }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchChat = async () => {
    if (!currentUser) return;
    try {
      const data = await ApiService.getMyChat(currentUser.id);
      setMessages(data);
      if (!isOpen) {
        const unreadAdminMsgs = data.filter((m) => m.sender === 'ADMIN' && !m.read).length;
        setUnreadCount(unreadAdminMsgs);
      } else {
        setUnreadCount(0);
      }
    } catch {
      // Ignore polling blips
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchChat();
      const timer = setInterval(fetchChat, 4000);
      return () => clearInterval(timer);
    }
  }, [currentUser, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (!inputText.trim() || loading) return;

    const textToSend = inputText.trim();
    setInputText('');
    setLoading(true);

    try {
      const newMsg = await ApiService.sendChatMessage(currentUser.id, textToSend);
      setMessages((prev) => [...prev, newMsg]);
    } catch (err: any) {
      alert(err.message || 'Gagal mengirim pesan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Chat Trigger Button */}
      <button
        id="btn-open-live-chat"
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-40 flex items-center space-x-2.5 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-xl shadow-emerald-700/30 transition transform hover:scale-105 active:scale-95 group"
      >
        <div className="relative">
          <Headphones className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-[11px] font-black rounded-full flex items-center justify-center animate-bounce border-2 border-white">
              {unreadCount}
            </span>
          )}
        </div>
        <span className="text-xs font-bold tracking-wide hidden sm:inline">Live Chat Admin</span>
      </button>

      {/* Chat Window Box */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[520px] max-h-[80vh] animate-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-emerald-600 text-white px-4 py-3.5 flex items-center justify-between shadow-xs">
            <div className="flex items-center space-x-2.5">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-emerald-700/80 flex items-center justify-center border border-emerald-400/40">
                  <Headphones className="w-5 h-5 text-emerald-100" />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-300 rounded-full border-2 border-emerald-700" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold tracking-tight flex items-center gap-1.5">
                  Admin NamsBlast Support
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                </h4>
                <p className="text-[11px] text-emerald-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-pulse" />
                  Online &bull; Siap Membantu Anda
                </p>
              </div>
            </div>
            <button
              id="btn-close-live-chat"
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-emerald-100 hover:text-white hover:bg-emerald-700/60 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto bg-slate-50 space-y-3">
            {!currentUser ? (
              <div className="text-center py-12 px-4 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <User className="w-6 h-6" />
                </div>
                <h5 className="text-sm font-bold text-slate-800">Masuk untuk Memulai Chat</h5>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Silakan login atau daftar akun terlebih dahulu untuk berkonsultasi langsung dengan tim support admin.
                </p>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onOpenAuth();
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition shadow-sm"
                >
                  Login / Daftar Sekarang
                </button>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 px-4 space-y-2 text-slate-500">
                <Sparkles className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-xs font-bold text-slate-700">Mulai Percakapan dengan Admin</p>
                <p className="text-[11px] text-slate-400">
                  Tanyakan kendala koneksi WhatsApp, bantuan withdraw, atau info referral.
                </p>
              </div>
            ) : (
              messages.map((m) => {
                const isAdmin = m.sender === 'ADMIN';
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}
                  >
                    <div className="text-[10px] text-slate-400 font-medium mb-1 px-1">
                      {isAdmin ? 'Admin Support' : 'Anda'}
                    </div>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-2xs ${
                        isAdmin
                          ? 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs'
                          : 'bg-emerald-600 text-white rounded-tr-xs font-medium'
                      }`}
                    >
                      <p className="whitespace-pre-line">{m.text}</p>
                      <div
                        className={`text-[9px] mt-1 text-right flex items-center justify-end gap-1 ${
                          isAdmin ? 'text-slate-400' : 'text-emerald-200'
                        }`}
                      >
                        <span>
                          {new Date(m.createdAt).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {!isAdmin && <CheckCheck className="w-3 h-3" />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          {currentUser && (
            <form
              onSubmit={handleSendMessage}
              className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2"
            >
              <input
                id="input-live-chat-message"
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Tulis pesan ke admin..."
                className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              />
              <button
                id="btn-send-live-chat"
                type="submit"
                disabled={!inputText.trim() || loading}
                className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl transition shadow-xs"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
};
