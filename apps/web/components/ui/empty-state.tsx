import React from 'react';
import { CalendarX } from 'lucide-react';
import { Button } from './button';
import Link from 'next/link';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = <CalendarX className="w-12 h-12 text-stone-400 stroke-[1.5]" />,
  title,
  description,
  actionText,
  actionHref,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-[#111827] border border-dashed border-stone-300 dark:border-slate-800 rounded-3xl my-6">
      <div className="p-4 bg-stone-50 dark:bg-slate-800/60 rounded-2xl mb-4 text-stone-500 dark:text-slate-400">{icon}</div>
      <h3 className="text-lg font-semibold text-stone-900 dark:text-white mb-1">{title}</h3>
      <p className="text-sm text-stone-500 dark:text-slate-400 max-w-sm mb-6 leading-relaxed">{description}</p>
      {actionText && (
        actionHref ? (
          <Link href={actionHref}>
            <Button variant="primary">{actionText}</Button>
          </Link>
        ) : (
          <Button variant="primary" onClick={onAction}>
            {actionText}
          </Button>
        )
      )}
    </div>
  );
}
