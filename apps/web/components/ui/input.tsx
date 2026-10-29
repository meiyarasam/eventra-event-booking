import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, rightElement, id, type = 'text', ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const hasExplicitLightBg = className && (className.includes('bg-white') || className.includes('bg-stone-50') || className.includes('bg-stone-100'));

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-slate-300 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            id={inputId}
            type={type}
            ref={ref}
            className={cn(
              'flex h-11 w-full rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-[#1E293B] px-3.5 py-2 text-sm text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:bg-stone-100 dark:disabled:bg-slate-800 disabled:text-stone-400 dark:disabled:text-slate-400 disabled:opacity-60 transition-colors',
              rightElement && 'pr-11',
              error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20',
              className
            )}
            {...props}
          />
          {rightElement && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-auto">
              {rightElement}
            </div>
          )}
        </div>
        {hint && !error && <p className="mt-1.5 text-xs text-stone-500 dark:text-slate-400">{hint}</p>}
        {error && <p className="mt-1.5 text-xs text-rose-500 font-medium">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
