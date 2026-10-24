'use client';

import React, { useState, useEffect, useRef } from 'react';
import { HeroDiscoveryHub } from '@/components/home/hero-discovery-hub';
import { HeroBackgroundAnimation } from '@/components/home/hero-background-animation';
import { CategoryDTO } from '@eventra/shared';
import { Sparkles } from 'lucide-react';

interface HeroSectionProps {
  categories?: CategoryDTO[];
}

export function HeroSection({ categories = [] }: HeroSectionProps) {
  // Parallax offset state for subtle pointer responsiveness
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check for reduced motion and touch devices
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

    if (prefersReducedMotion || isTouchDevice) {
      return;
    }

    let animationFrameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      // Calculate normalized offset from center (-1 to 1)
      const mouseX = (e.clientX - rect.left) / rect.width - 0.5;
      const mouseY = (e.clientY - rect.top) / rect.height - 0.5;

      // Restrained movement (max ±8px horizontal, ±6px vertical)
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(() => {
        setOffset({
          x: Math.round(mouseX * 16),
          y: Math.round(mouseY * 12),
        });
      });
    };

    const currentHero = heroRef.current;
    if (currentHero) {
      currentHero.addEventListener('mousemove', handleMouseMove, { passive: true });
    }

    return () => {
      if (currentHero) {
        currentHero.removeEventListener('mousemove', handleMouseMove);
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative pt-24 pb-28 sm:pt-32 sm:pb-36 overflow-hidden bg-[#0A0F1D] text-white border-b border-slate-800"
    >
      {/* Background Photograph with subtle parallax and deep navy overlay */}
      <div
        className="absolute inset-0 z-0 overflow-hidden pointer-events-none transition-transform duration-300 ease-out will-change-transform"
        style={{
          transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(1.05)`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/hero_event_bg.jpg"
          alt="Concert stage with atmospheric lighting and audience"
          className="w-full h-full object-cover object-center opacity-35 filter brightness-105 contrast-115"
        />
        {/* Controlled darkening & smooth transition into the following section */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0F1D]/80 via-[#0D1527]/75 to-[#0A0F1D]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/30 via-transparent to-transparent" />
      </div>

      {/* Dynamic Concert Stage Background Animation (Sweeping spotlight beams, floating embers canvas, bass ripples) */}
      <HeroBackgroundAnimation />

      {/* Subtle grid */}
      <div className="absolute inset-0 bg-dot-pattern-dark opacity-20 pointer-events-none z-0" />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
        <div className="text-center max-w-4xl mx-auto space-y-6">
          {/* Eyebrow Label */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/85 border border-brand-500/30 backdrop-blur-md text-xs font-bold uppercase tracking-widest text-brand-300 shadow-[0_0_20px_rgba(249,115,22,0.2)] animate-in fade-in duration-500">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>DISCOVER · BOOK · EXPERIENCE</span>
          </div>

          {/* Main Headline */}
          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.12] drop-shadow-sm">
            Find Your Next{' '}
            <span className="bg-gradient-to-r from-amber-300 via-brand-500 to-rose-400 text-transparent bg-clip-text animate-gradient-x inline-block drop-shadow-[0_8px_30px_rgba(249,115,22,0.35)]">
              Unforgettable Experience
            </span>
          </h1>

          {/* Short Supporting Description */}
          <p className="text-base sm:text-lg text-slate-300/90 leading-relaxed max-w-2xl mx-auto font-normal">
            Discover concerts, conferences, workshops and experiences worth showing up for.
          </p>

          {/* Unified Hero Discovery Hub (Smart Search, Vibe Selector, Trending Tags & Live Telemetry) */}
          <div className="pt-6">
            <HeroDiscoveryHub categories={categories} />
          </div>
        </div>
      </div>

      {/* Seamless bottom fade into following section */}
      <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-[#0A0F1D] to-transparent pointer-events-none z-10" />
    </section>
  );
}

export default HeroSection;
