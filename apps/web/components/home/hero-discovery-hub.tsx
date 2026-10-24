'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Sparkles,
  ArrowRight,
  Flame,
  Radio,
  Tag,
} from 'lucide-react';
import { CategoryDTO } from '@eventra/shared';

interface HeroDiscoveryHubProps {
  categories?: CategoryDTO[];
  className?: string;
}

type VibeMode = 'all' | 'weekend' | 'trending' | 'virtual' | 'free';

const VIBES = [
  { id: 'all' as const, label: 'All Experiences', icon: Sparkles, color: 'text-brand-400' },
  { id: 'weekend' as const, label: 'This Weekend', icon: Calendar, color: 'text-amber-400' },
  { id: 'trending' as const, label: 'Hot & Trending', icon: Flame, color: 'text-rose-400' },
  { id: 'virtual' as const, label: 'Live Broadcasts', icon: Radio, color: 'text-indigo-400' },
  { id: 'free' as const, label: 'Free Entry', icon: Tag, color: 'text-emerald-400' },
];

const CURATED_CATEGORIES = [
  { label: 'Live Music', query: 'music', icon: '🎸' },
  { label: 'AI & Tech', query: 'ai', icon: '🤖' },
  { label: 'Startup Pitch', query: 'startup', icon: '🚀' },
  { label: 'Arts & Culture', query: 'design', icon: '🎨' },
  { label: 'Nightlife', query: 'party', icon: '✨' },
];

export function HeroDiscoveryHub({ categories = [], className = '' }: HeroDiscoveryHubProps) {
  const router = useRouter();
  const [activeVibe, setActiveVibe] = useState<VibeMode>('all');

  const handleVibeChange = (vibe: VibeMode) => {
    setActiveVibe(vibe);
    if (vibe === 'weekend') {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
      const saturday = new Date(now);
      saturday.setDate(now.getDate() + daysUntilSaturday);
      saturday.setHours(0, 0, 0, 0);
      router.push(`/events?startDate=${encodeURIComponent(saturday.toISOString())}`);
    } else if (vibe === 'virtual') {
      router.push('/events?isOnline=true');
    } else if (vibe === 'free') {
      router.push('/events?freeOnly=true');
    } else if (vibe === 'trending') {
      router.push('/events?sortBy=date_asc');
    } else {
      router.push('/events');
    }
  };

  const handleQuickTagClick = (query: string) => {
    router.push(`/events?search=${encodeURIComponent(query)}`);
  };

  return (
    <div className={`w-full max-w-4xl mx-auto ${className}`}>
      {/* Main Unified Discovery Console Glass Card */}
      <div className="relative rounded-2xl sm:rounded-3xl bg-slate-900/85 backdrop-blur-2xl border border-slate-700/60 p-4 sm:p-5 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.85)] ring-1 ring-white/10 hover:border-brand-500/40 transition-all duration-300 space-y-3">
        
        {/* Row 1: Vibe & Experience Filter Pills */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-800/80 overflow-x-auto no-scrollbar scrollbar-none flex-nowrap">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-nowrap shrink-0">
            {VIBES.map((vibe) => {
              const Icon = vibe.icon;
              const isActive = activeVibe === vibe.id;
              return (
                <button
                  key={vibe.id}
                  type="button"
                  onClick={() => handleVibeChange(vibe.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                    isActive
                      ? 'bg-gradient-to-r from-brand-500/30 to-amber-500/30 text-white border border-brand-400/60 shadow-[0_0_12px_rgba(249,115,22,0.3)] ring-1 ring-brand-400/40'
                      : 'bg-white/[0.05] hover:bg-white/[0.12] text-slate-300 hover:text-white border border-white/5 hover:border-white/20'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${vibe.color}`} />
                  <span>{vibe.label}</span>
                </button>
              );
            })}
          </div>

          <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 shrink-0 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>12+ Live Now</span>
          </div>
        </div>

        {/* Row 2: Genre Tags & Direct Explore Link */}
        <div className="flex items-center justify-between gap-3 overflow-x-auto no-scrollbar scrollbar-none flex-nowrap pt-1">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-nowrap shrink-0">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden sm:inline mr-1">
              Trending:
            </span>
            {CURATED_CATEGORIES.map((cat) => (
              <button
                key={cat.label}
                type="button"
                onClick={() => handleQuickTagClick(cat.query)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.12] border border-white/5 hover:border-brand-400/40 text-slate-300 hover:text-white transition-all duration-200 text-xs font-medium shrink-0 whitespace-nowrap"
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => router.push('/events')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-brand-500/15 to-amber-500/15 hover:from-brand-500/25 hover:to-amber-500/25 border border-brand-400/30 hover:border-brand-400/60 text-xs font-bold text-amber-300 hover:text-white transition-all duration-200 shrink-0 whitespace-nowrap shadow-sm group ml-auto"
          >
            <span>Explore All Events</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

      </div>
    </div>
  );
}

export default HeroDiscoveryHub;
