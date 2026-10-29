'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { EventDTO } from '@eventra/shared';
import { EventCard } from '@/components/events/event-card';
import { EventCardSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import {
  ArrowRight,
  Calendar,
  Sparkles,
  Tag,
  Compass,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface FeaturedEventsSectionProps {
  events: EventDTO[];
  isLoading: boolean;
}

type FilterTab = 'all' | 'this-week' | 'free';

export function FeaturedEventsSection({
  events = [],
  isLoading = false,
}: FeaturedEventsSectionProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  // Filter events based on selected tab without fabricating data
  const filteredEvents = events.filter((evt) => {
    if (activeTab === 'free') {
      const ticketPrices = evt.ticketTypes?.map((t) => Number(t.price)) || [];
      const minPrice = ticketPrices.length > 0 ? Math.min(...ticketPrices) : 0;
      return minPrice === 0;
    }

    if (activeTab === 'this-week') {
      const now = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(now.getDate() + 7);
      const evtDate = new Date(evt.startDate);
      return evtDate >= now && evtDate <= nextWeek;
    }

    return true; // 'all' displays curated selection
  });

  return (
    <section className="relative py-20 sm:py-28 bg-stone-50 dark:bg-gradient-to-b dark:from-[#0A0F1D] dark:via-[#0E1528] dark:to-[#0A0F1D] text-stone-900 dark:text-white border-b border-stone-200 dark:border-slate-800/80 overflow-hidden transition-colors">
      {/* 1. Luminous Ambient Glow Orbs (Soft, elegant lighting eliminating flat black spots) */}
      <div className="absolute top-10 -left-24 w-[600px] h-[600px] bg-gradient-to-tr from-brand-500/12 via-orange-500/6 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 -right-24 w-[680px] h-[680px] bg-gradient-to-bl from-indigo-500/15 via-purple-600/8 to-transparent rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute -bottom-24 left-1/3 w-[550px] h-[400px] bg-gradient-to-t from-brand-500/8 via-indigo-600/6 to-transparent rounded-full blur-[130px] pointer-events-none" />

      {/* 2. Precision Architectural Grid with Radial Mask */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#33415514_1px,transparent_1px),linear-gradient(to_bottom,#33415514_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_50%,#000_50%,transparent_100%)] pointer-events-none" />

      {/* 3. Subtle Acoustic Soundwave Contour Lines */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F97316" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#6366F1" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#EC4899" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <path
          d="M-100,200 C300,100 800,400 1400,250 C1800,150 2100,320 2500,200"
          fill="none"
          stroke="url(#waveGrad)"
          strokeWidth="1.5"
          strokeDasharray="6 6"
        />
        <path
          d="M-100,500 C400,600 900,350 1500,550 C1900,650 2200,450 2600,520"
          fill="none"
          stroke="url(#waveGrad)"
          strokeWidth="1.2"
        />
      </svg>

      {/* 4. Ambient Dot Matrix */}
      <div className="absolute inset-0 bg-dot-pattern-dark opacity-15 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header & Controls Row */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          {/* Section Title & Description */}
          <div className="space-y-2 max-w-xl">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400 block">
              Curated Selection
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-navy-950 dark:text-white tracking-tight leading-tight">
              Events worth making plans for
            </h2>
            <p className="text-sm sm:text-base text-stone-600 dark:text-slate-400 font-normal leading-relaxed">
              Explore live music, industry summits, workshops and experiences worth your time.
            </p>
          </div>

          {/* Functional Filter Tabs & View All Button */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center p-1 bg-stone-200/80 dark:bg-slate-900/90 rounded-full border border-stone-300 dark:border-slate-800 backdrop-blur-md shadow-sm dark:shadow-lg">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                  activeTab === 'all'
                    ? 'bg-gradient-to-r from-brand-500 to-orange-500 text-white shadow-sm'
                    : 'text-stone-600 dark:text-slate-400 hover:text-navy-950 dark:hover:text-white'
                }`}
              >
                Featured
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('this-week')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                  activeTab === 'this-week'
                    ? 'bg-gradient-to-r from-brand-500 to-orange-500 text-white shadow-sm'
                    : 'text-stone-600 dark:text-slate-400 hover:text-navy-950 dark:hover:text-white'
                }`}
              >
                This Week
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('free')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                  activeTab === 'free'
                    ? 'bg-gradient-to-r from-brand-500 to-orange-500 text-white shadow-sm'
                    : 'text-stone-600 dark:text-slate-400 hover:text-navy-950 dark:hover:text-white'
                }`}
              >
                Free Events
              </button>
            </div>

            <Link
              href="/events"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-500 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 transition-all hover:translate-x-0.5 ml-1"
            >
              <span>View All Events</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Event Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <EventCardSkeleton />
            <EventCardSkeleton />
            <EventCardSkeleton />
            <EventCardSkeleton />
            <EventCardSkeleton />
            <EventCardSkeleton />
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}

            {/* Slot 5: Curated Discovery Highlight Card (Fills empty grid slot elegantly) */}
            {filteredEvents.length === 4 && (
              <div className="group relative rounded-2xl bg-gradient-to-br from-[#111827]/90 via-[#151f35]/80 to-[#111827]/90 border border-slate-800 hover:border-brand-500/50 p-6 sm:p-7 flex flex-col justify-between shadow-xl transition-all duration-300 hover:shadow-2xl hover:shadow-brand-500/10 hover:-translate-y-1 overflow-hidden min-h-[380px]">
                {/* Luminous glow */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/10 rounded-full blur-2xl group-hover:bg-brand-500/20 transition-all pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all pointer-events-none" />

                <div className="relative z-10 space-y-3.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/15 border border-brand-500/30 text-[11px] font-bold text-brand-300 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                    <span>Curated Discovery</span>
                  </div>

                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-white group-hover:text-brand-300 transition-colors leading-snug">
                    Looking for More Live Experiences?
                  </h3>

                  <p className="text-xs text-slate-300 font-normal leading-relaxed">
                    Filter across 10+ categories. Discover live acoustic concerts, founder pitch nights, and tech conferences worldwide.
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <Link
                      href="/events?category=technology"
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
                    >
                      #Technology
                    </Link>
                    <Link
                      href="/events?category=business"
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
                    >
                      #Business
                    </Link>
                    <Link
                      href="/events?category=music"
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
                    >
                      #LiveMusic
                    </Link>
                  </div>
                </div>

                <div className="relative z-10 pt-5 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Verified catalog</span>
                  <Link
                    href="/events"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-brand-500 to-orange-500 hover:from-brand-600 hover:to-orange-600 text-white shadow-md shadow-brand-500/25 group-hover:scale-105 active:scale-95 transition-all"
                  >
                    <span>Browse All</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            )}

            {/* Slot 6: Host on EVENTRA Highlight Card (Completely balances 3-column grid) */}
            {filteredEvents.length === 4 && (
              <div className="group relative rounded-2xl bg-gradient-to-br from-[#111827]/90 via-[#141d30]/80 to-[#111827]/90 border border-slate-800 hover:border-indigo-500/50 p-6 sm:p-7 flex flex-col justify-between shadow-xl transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 overflow-hidden min-h-[380px]">
                {/* Luminous glow */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all pointer-events-none" />

                <div className="relative z-10 space-y-3.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
                    <Zap className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Host With Us</span>
                  </div>

                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-white group-hover:text-indigo-300 transition-colors leading-snug">
                    Publish Your Next Summit or Showcase
                  </h3>

                  <p className="text-xs text-slate-300 font-normal leading-relaxed">
                    Configure tiered admissions, monitor gross merchandise volume, and scan attendee QR passes via mobile camera.
                  </p>

                  <div className="space-y-2 pt-1 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Zero platform listing fee</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Real-time seat concurrency lock</span>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 pt-5 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Organizer suite</span>
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-indigo-500/40 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-200 hover:text-white transition-all group-hover:scale-105 active:scale-95"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-16 text-center">
            <EmptyState
              title={
                activeTab === 'free'
                  ? 'No Free Events Currently Scheduled'
                  : activeTab === 'this-week'
                  ? 'No Events Scheduled for This Week'
                  : 'No Events Found'
              }
              description="Browse our complete catalog to discover upcoming summits, live concerts, and workshops."
              actionText="Explore All Events"
              actionHref="/events"
            />
          </div>
        )}
      </div>
    </section>
  );
}

export default FeaturedEventsSection;
