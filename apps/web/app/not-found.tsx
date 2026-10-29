import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Compass, ArrowRight } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto shadow-sm">
          <Compass className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">
            Error 404
          </span>
          <h1 className="font-serif text-3xl font-bold text-navy-950 dark:text-white">Page Not Found</h1>
          <p className="text-sm text-stone-500 dark:text-slate-400 leading-relaxed">
            The page or event resource you are looking for does not exist or may have been moved.
          </p>
        </div>
        <div className="pt-2">
          <Link href="/">
            <Button variant="primary" size="md" className="gap-2">
              <span>Return to Discovery</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
