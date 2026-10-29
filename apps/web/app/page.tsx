'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { EventDTO, CategoryDTO } from '@eventra/shared';
import { HeroSection } from '@/components/home/hero-section';
import { FeaturedEventsSection } from '@/components/home/featured-events-section';
import { Button } from '@/components/ui/button';
import {
  Lock,
  QrCode,
  CreditCard,
  BarChart3,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export default function HomePage() {
  // Fetch published events from API
  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ['events', 'homepage'],
    queryFn: () => api.get<{ data: EventDTO[] }>('/events', { limit: 12 }),
  });

  // Fetch categories from API
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<{ data: CategoryDTO[] }>('/categories'),
  });

  const events = eventsData?.data || [];
  const categories = categoriesData?.data || [];

  return (
    <div className="flex flex-col min-h-screen bg-stone-50 dark:bg-[#0B0F19] transition-colors">
      {/* 1. HERO SECTION (Atmospheric live event photograph, pointer parallax, search & category navigation) */}
      <HeroSection categories={categories} />

      {/* 2. FEATURED EVENTS SECTION (Atmospheric section with functional tabs, heading, and accessible dark event cards) */}
      <FeaturedEventsSection events={events} isLoading={eventsLoading} />

      {/* Luminous subtle separator between sections */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-brand-500/25 to-transparent relative z-20" />

      {/* 3. PLATFORM ARCHITECTURE & TRUST PILLARS */}
      <section className="py-20 sm:py-24 bg-stone-100 dark:bg-gradient-to-b dark:from-[#0A0F1D] dark:via-[#0D1526] dark:to-[#0A0F1D] border-t border-b border-stone-200 dark:border-slate-800/80 relative overflow-hidden">
        {/* Ambient lighting glows */}
        <div className="absolute top-0 right-1/4 w-[600px] h-[400px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[400px] bg-brand-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#33415512_1px,transparent_1px),linear-gradient(to_bottom,#33415512_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_75%_50%_at_50%_50%,#000_50%,transparent_100%)] pointer-events-none" />
        <div className="absolute inset-0 bg-dot-pattern-dark opacity-15 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400 block mb-2">
              Enterprise Ticketing Infrastructure
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-navy-950 dark:text-white tracking-tight mb-3">
              Built for Absolute Reliability
            </h2>
            <p className="text-sm sm:text-base text-stone-600 dark:text-slate-400 font-normal leading-relaxed">
              Every reservation on EVENTRA is protected by deterministic database locks, preventing oversold seats, ghost reservations, and duplicate passes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pillar 1 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-stone-200 dark:border-slate-800 hover:border-brand-500/50 hover:bg-stone-50 dark:hover:bg-[#162032] hover:shadow-xl hover:shadow-brand-500/5 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-500 dark:text-brand-400 flex items-center justify-center mb-5">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-navy-950 dark:text-white mb-2">
                10-Minute Concurrency Holds
              </h3>
              <p className="text-xs text-stone-600 dark:text-slate-400 leading-relaxed font-normal">
                Atomic database row locking reserves seats during checkout, guaranteeing tickets cannot be double-booked during flash sales.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-stone-200 dark:border-slate-800 hover:border-indigo-500/50 hover:bg-stone-50 dark:hover:bg-[#162032] hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 dark:text-indigo-400 flex items-center justify-center mb-5">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-navy-950 dark:text-white mb-2">
                Cryptographic QR Passes
              </h3>
              <p className="text-xs text-stone-600 dark:text-slate-400 leading-relaxed font-normal">
                Single-use dynamic digital passes verifiable in milliseconds with instant duplicate check-in rejection at venue turnstiles.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-stone-200 dark:border-slate-800 hover:border-emerald-500/50 hover:bg-stone-50 dark:hover:bg-[#162032] hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400 flex items-center justify-center mb-5">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-navy-950 dark:text-white mb-2">
                Deterministic Mock Checkout
              </h3>
              <p className="text-xs text-stone-600 dark:text-slate-400 leading-relaxed font-normal">
                Realistic sandbox settlement environment supporting Card and UPI simulation without storing sensitive banking credentials.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-stone-200 dark:border-slate-800 hover:border-amber-500/50 hover:bg-stone-50 dark:hover:bg-[#162032] hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-400 flex items-center justify-center mb-5">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-navy-950 dark:text-white mb-2">
                Live Revenue Telemetry
              </h3>
              <p className="text-xs text-stone-600 dark:text-slate-400 leading-relaxed font-normal">
                Real-time gross merchandise volume, seat inventory tracking, and attendance rate telemetry for event creators.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ORGANIZER CALL TO ACTION BANNER */}
      <section className="py-20 sm:py-24 bg-stone-50 dark:bg-[#0A0F1D] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-dot-pattern-dark opacity-20 pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="p-8 sm:p-14 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-slate-800 shadow-2xl text-center max-w-4xl mx-auto space-y-6">
            <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-brand-300 bg-brand-500/20 border border-brand-500/30 inline-block shadow-sm">
              Event Management Suite
            </span>

            <h2 className="font-serif text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Host Your Next Summit or Showcase with EVENTRA
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto font-normal">
              Configure tiered ticket types, monitor gross merchandise volume, manage guest lists, and scan attendee passes via our camera-based check-in scanner.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link href="/register">
                <Button
                  variant="primary"
                  size="lg"
                  className="rounded-full px-8 bg-gradient-to-r from-brand-500 to-coral-500 hover:from-brand-600 hover:to-coral-600 text-white font-bold shadow-lg shadow-brand-500/30 hover:scale-105 active:scale-95 transition-all"
                >
                  <span>Get Started as an Organizer</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>

              <Link href="/about">
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full px-8 border-slate-700 bg-white/5 hover:bg-white/10 text-white font-semibold backdrop-blur-md transition-all"
                >
                  <span>Platform Overview</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
