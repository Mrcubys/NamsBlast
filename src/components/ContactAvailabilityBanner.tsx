import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ContactAvailabilityBannerProps {
  contactsAvailable: number;
  contactsTotal: number;
  contactsSent: number;
  emptyContactMessage: string;
  onRefresh?: () => void;
}

export const ContactAvailabilityBanner: React.FC<ContactAvailabilityBannerProps> = ({
  contactsAvailable,
  contactsTotal,
  contactsSent,
  emptyContactMessage,
  onRefresh,
}) => {
  const isOutOfContacts = contactsAvailable <= 0;

  if (isOutOfContacts) {
    return (
      <div
        id="banner-empty-contacts"
        className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border border-amber-200 dark:border-amber-800/80 bg-amber-50/90 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs shadow-2xs transition-colors"
      >
        <div className="flex items-center space-x-2.5 min-w-0">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="truncate font-medium">
            <strong className="font-bold text-amber-950 dark:text-amber-100">Antrian Kontak Habis:</strong>{' '}
            {emptyContactMessage || 'Mohon tunggu admin mengisi ulang kontak antrian.'}
          </p>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-amber-200/80 hover:bg-amber-300 dark:bg-amber-900/60 dark:hover:bg-amber-800 text-amber-900 dark:text-amber-200 text-[11px] font-bold transition shrink-0"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Perbarui</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      id="banner-available-contacts"
      className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-2.5 rounded-xl border border-emerald-200/90 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/30 text-slate-800 dark:text-slate-200 text-xs shadow-2xs transition-colors"
    >
      <div className="flex items-center space-x-2.5 min-w-0">
        <span className="flex h-2 w-2 relative shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600 dark:bg-emerald-400" />
        </span>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 font-medium">
          <span className="font-bold text-emerald-900 dark:text-emerald-300">Sisa Antrian Nomor:</span>
          <span className="font-black text-emerald-700 dark:text-emerald-400 font-mono">
            {contactsAvailable.toLocaleString('id-ID')}
          </span>
          <span className="text-slate-500 dark:text-slate-400 text-[11px]">
            (Total {contactsTotal.toLocaleString('id-ID')} • Terkirim {contactsSent.toLocaleString('id-ID')})
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-2 shrink-0">
        {onRefresh && (
          <button
            onClick={onRefresh}
            title="Muat ulang status kontak"
            className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-emerald-100/80 hover:bg-emerald-200/80 dark:bg-emerald-900/50 dark:hover:bg-emerald-800 text-emerald-800 dark:text-emerald-200 text-[11px] font-bold transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Cek Status</span>
          </button>
        )}
      </div>
    </div>
  );
};
