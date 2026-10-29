'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled Client Exception:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-sm">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400">
            System Alert
          </span>
          <h1 className="font-serif text-3xl font-bold text-navy-950 dark:text-white">Something went wrong</h1>
          <p className="text-sm text-stone-500 dark:text-slate-400 leading-relaxed">
            An unexpected error occurred while rendering this view. Our client state has safely trapped the exception.
          </p>
        </div>
        <div className="pt-2">
          <Button variant="primary" size="md" onClick={() => reset()} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            <span>Try Again</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
