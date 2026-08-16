import React from 'react';
import { Bell, X, Info, AlertTriangle, AlertCircle, Calendar, CheckCircle2 } from 'lucide-react';
import { Announcement } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcements: Announcement[];
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  announcements,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">Pusat Notifikasi &amp; Pengumuman</h3>
              <p className="text-xs text-slate-500">Info pembaruan sistem dan operasional server</p>
            </div>
          </div>
          <button
            id="btn-close-notifications-modal"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 divide-y divide-slate-100">
          {announcements.length === 0 ? (
            <div className="text-center py-10 text-slate-400 space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-600">Tidak ada pengumuman baru</p>
              <p className="text-xs text-slate-400">Semua sistem NamsBlast beroperasi normal.</p>
            </div>
          ) : (
            announcements.map((ann, idx) => {
              const isImportant = ann.type === 'IMPORTANT';
              const isWarning = ann.type === 'WARNING';

              return (
                <div
                  key={ann.id}
                  className={`pt-4 first:pt-0 rounded-xl p-3.5 transition ${
                    isImportant
                      ? 'bg-amber-50/60 border border-amber-200/80'
                      : isWarning
                      ? 'bg-red-50/60 border border-red-200/80'
                      : 'bg-slate-50/70 border border-slate-200/70'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="mt-0.5 shrink-0">
                      {isImportant ? (
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                      ) : isWarning ? (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      ) : (
                        <Info className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-bold text-slate-900 leading-snug">{ann.title}</h4>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 shrink-0 font-medium">
                          <Calendar className="w-3 h-3" />
                          {new Date(ann.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed whitespace-pre-line">
                        {ann.content}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition shadow-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
