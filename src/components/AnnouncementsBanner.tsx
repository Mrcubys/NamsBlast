import React, { useState } from 'react';
import { Megaphone, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { Announcement } from '../types';

interface AnnouncementsBannerProps {
  announcements: Announcement[];
}

export const AnnouncementsBanner: React.FC<AnnouncementsBannerProps> = ({ announcements }) => {
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const visible = announcements.filter((a) => a.isActive && !dismissedIds.includes(a.id));

  if (visible.length === 0) return null;

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => [...prev, id]);
  };

  return (
    <div className="space-y-2">
      {visible.map((ann) => {
        let badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
        let icon = <Info className="w-4 h-4 text-blue-600" />;
        let borderColor = 'border-blue-200';
        let bgColor = 'bg-blue-50/70';

        if (ann.type === 'IMPORTANT') {
          badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
          icon = <Megaphone className="w-4 h-4 text-rose-600" />;
          borderColor = 'border-rose-200';
          bgColor = 'bg-rose-50/70';
        } else if (ann.type === 'WARNING') {
          badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
          icon = <AlertTriangle className="w-4 h-4 text-amber-600" />;
          borderColor = 'border-amber-200';
          bgColor = 'bg-amber-50/70';
        }

        return (
          <div
            key={ann.id}
            id={`announcement-${ann.id}`}
            className={`relative flex items-start justify-between p-3.5 sm:p-4 rounded-2xl border ${borderColor} ${bgColor} text-sm transition shadow-xs`}
          >
            <div className="flex items-start space-x-3 pr-4 sm:pr-6">
              <div className="p-2 rounded-xl bg-white border border-slate-200 shrink-0 mt-0.5 shadow-xs">
                {icon}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${badgeColor}`}>
                    {ann.type}
                  </span>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{ann.title}</h4>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 mt-1 leading-relaxed">
                  {ann.content}
                </p>
                <div className="text-[10px] text-slate-400 mt-1">
                  {new Date(ann.createdAt).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                </div>
              </div>
            </div>

            <button
              onClick={() => handleDismiss(ann.id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white/80 transition shrink-0"
              title="Tutup pengumuman"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
