import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, User, CheckCheck, RefreshCw, Search, ShieldCheck, Mail } from 'lucide-react';
import { User as UserType, ChatMessage } from '../../types';
import { ApiService } from '../../services/api';

interface AdminChatPanelProps {
  onRefreshStats?: () => void;
}

interface ChatThread {
  user: UserType;
  messages: ChatMessage[];
  unreadCount: number;
  lastMessage: ChatMessage | null;
}

export const AdminChatPanel: React.FC<AdminChatPanelProps> = () => {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchThreads = async () => {
    try {
      const data = await ApiService.getAdminChatThreads();
      setThreads(data);
      if (!selectedUserId && data.length > 0) {
        setSelectedUserId(data[0].user.id);
      }
    } catch (e) {
      console.error('Error fetching admin chat threads:', e);
    }
  };

  useEffect(() => {
    fetchThreads();
    const interval = setInterval(fetchThreads, 3000);
    return () => clearInterval(interval);
  }, []);

  const activeThread = threads.find((t) => t.user.id === selectedUserId) || threads[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread?.messages]);

  const handleSendReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedUserId || !replyText.trim() || loading) return;

    const textToSend = replyText.trim();
    setReplyText('');
    setLoading(true);

    try {
      await ApiService.adminReplyChat(selectedUserId, textToSend);
      await fetchThreads();
    } catch (err: any) {
      alert(err.message || 'Gagal membalas pesan');
    } finally {
      setLoading(false);
    }
  };

  const filteredThreads = threads.filter(
    (t) =>
      t.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            Live Chat Support User
          </h3>
          <p className="text-xs text-slate-500">Balas pertanyaan dan bantuan pengguna secara langsung</p>
        </div>
        <button
          onClick={fetchThreads}
          className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-slate-200/60 rounded-xl transition"
          title="Refresh Percakapan"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 min-h-[550px] divide-y md:divide-y-0 md:divide-x divide-slate-200">
        {/* Left: User Chat List */}
        <div className="flex flex-col bg-slate-50/50">
          <div className="p-3 border-b border-slate-200">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari user atau email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[480px]">
            {filteredThreads.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Belum ada percakapan dari user
              </div>
            ) : (
              filteredThreads.map((thread) => {
                const isSelected = selectedUserId === thread.user.id;
                return (
                  <button
                    key={thread.user.id}
                    onClick={() => setSelectedUserId(thread.user.id)}
                    className={`w-full text-left p-3.5 flex items-start space-x-3 transition ${
                      isSelected
                        ? 'bg-emerald-50/90 border-l-4 border-emerald-600'
                        : 'hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-sm">
                      {thread.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-slate-900 truncate">
                          {thread.user.name}
                        </span>
                        {thread.lastMessage && (
                          <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                            {new Date(thread.lastMessage.createdAt).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-400" />
                        {thread.user.email}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-[11px] text-slate-600 truncate max-w-[150px]">
                          {thread.lastMessage?.text || 'Mulai chat'}
                        </p>
                        {thread.unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-black rounded-full">
                            {thread.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Active Chat Conversation */}
        <div className="col-span-2 flex flex-col bg-white">
          {activeThread ? (
            <>
              {/* Active User Header */}
              <div className="p-3.5 border-b border-slate-200 bg-white flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm">
                    {activeThread.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900">{activeThread.user.name}</h4>
                    <p className="text-[11px] text-slate-500">{activeThread.user.email} &bull; Saldo: Rp {(activeThread.user.balance || 0).toLocaleString('id-ID')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-[11px] font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  ID: {activeThread.user.id}
                </div>
              </div>

              {/* Messages Container */}
              <div className="flex-1 p-4 overflow-y-auto bg-slate-50/60 space-y-3 max-h-[380px]">
                {activeThread.messages.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    Belum ada pesan dalam percakapan ini
                  </div>
                ) : (
                  activeThread.messages.map((m) => {
                    const isAdmin = m.sender === 'ADMIN';
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                      >
                        <div className="text-[10px] text-slate-400 font-medium mb-1 px-1">
                          {isAdmin ? 'Admin (Anda)' : activeThread.user.name}
                        </div>
                        <div
                          className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-2xs ${
                            isAdmin
                              ? 'bg-emerald-600 text-white rounded-tr-xs'
                              : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs'
                          }`}
                        >
                          <p className="whitespace-pre-line">{m.text}</p>
                          <div
                            className={`text-[9px] mt-1 text-right flex items-center justify-end gap-1 ${
                              isAdmin ? 'text-emerald-200' : 'text-slate-400'
                            }`}
                          >
                            <span>
                              {new Date(m.createdAt).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {isAdmin && <CheckCheck className="w-3 h-3" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Admin Reply Input Form */}
              <form onSubmit={handleSendReply} className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Ketik balasan untuk ${activeThread.user.name}...`}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-hidden"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || loading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
              Pilih pengguna di sebelah kiri untuk melihat pesan
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
