'use client';

import React from 'react';
import { useToastStore } from '@/store/toast-store';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export function Toaster() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Notifications"
      className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full px-4 sm:px-0 pointer-events-none transition-all"
    >
      {toasts.map((t) => {
        const typeStyles = {
          success: {
            container: 'bg-[#0B151E]/95 border-emerald-500/40 shadow-emerald-950/50',
            badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
            title: 'text-emerald-300',
            icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />,
          },
          error: {
            container: 'bg-[#1A0F16]/95 border-rose-500/40 shadow-rose-950/50',
            badge: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
            title: 'text-rose-300',
            icon: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />,
          },
          warning: {
            container: 'bg-[#1B150A]/95 border-amber-500/40 shadow-amber-950/50',
            badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
            title: 'text-amber-300',
            icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />,
          },
          info: {
            container: 'bg-[#0F172A]/95 border-sky-500/40 shadow-sky-950/50',
            badge: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
            title: 'text-sky-300',
            icon: <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />,
          },
        };

        const current = typeStyles[t.type] || typeStyles.info;

        return (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3.5 p-4 rounded-xl border backdrop-blur-md shadow-2xl transition-all animate-in fade-in slide-in-from-top-3 duration-200 ${current.container}`}
          >
            {current.icon}
            <div className="flex-1 min-w-0">
              {t.title && (
                <div className={`font-semibold text-sm mb-0.5 tracking-wide ${current.title}`}>
                  {t.title}
                </div>
              )}
              <div className="text-slate-200 text-xs sm:text-sm leading-relaxed break-words font-medium">
                {t.message}
              </div>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              aria-label="Dismiss notification"
              className="text-slate-400 hover:text-white hover:bg-white/10 p-1.5 -mr-1 -mt-1 rounded-lg transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
