'use client';

import React, { useEffect, useRef } from 'react';

export interface PageAtmosphereProps {
  variant?: 'concert' | 'stage' | 'mesh' | 'admin' | 'auth';
  intensity?: 'subtle' | 'medium' | 'vibrant';
  showParticles?: boolean;
  showBeams?: boolean;
  className?: string;
  children?: React.ReactNode;
}

interface Particle {
  x: number;
  y: number;
  radius: number;
  vy: number;
  vx: number;
  color: string;
  alpha: number;
  baseAlpha: number;
  pulseSpeed: number;
  pulsePhase: number;
}

export function PageAtmosphere({
  variant = 'concert',
  intensity = 'medium',
  showParticles = true,
  showBeams = false,
  className = '',
  children,
}: PageAtmosphereProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Background image mapping
  const bgImageMap = {
    concert: '/images/concert_crowd_bg.jpg',
    stage: '/images/stage_ambient_glow.jpg',
    mesh: '/images/ambient_mesh_bg.jpg',
    admin: '/images/stage_ambient_glow.jpg',
    auth: '/images/concert_crowd_bg.jpg',
  };

  // Opacity by intensity
  const imageOpacityClass = {
    subtle: 'opacity-15',
    medium: 'opacity-25 sm:opacity-30',
    vibrant: 'opacity-35 sm:opacity-40',
  }[intensity];

  // Particle animation
  useEffect(() => {
    if (!showParticles) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let isVisible = true;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const resizeCanvas = () => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Warm golden embers & stardust
    const colors = [
      '251, 191, 36',  // Warm Gold
      '249, 115, 22',  // Brand Orange
      '255, 61, 142',  // Accent Pink
      '139, 92, 246',  // Accent Purple
      '254, 215, 170', // Champagne
    ];

    const count = intensity === 'subtle' ? 12 : 24;
    const particles: Particle[] = [];

    const createParticle = (initialY?: number): Particle => {
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);
      const color = colors[Math.floor(Math.random() * colors.length)];
      const baseAlpha = 0.10 + Math.random() * 0.20;
      return {
        x: Math.random() * w,
        y: initialY !== undefined ? initialY : Math.random() * h,
        radius: 0.6 + Math.random() * 1.2,
        vx: (Math.random() - 0.5) * 0.2,
        vy: -0.15 - Math.random() * 0.3,
        color,
        alpha: baseAlpha,
        baseAlpha,
        pulseSpeed: 0.015 + Math.random() * 0.025,
        pulsePhase: Math.random() * Math.PI * 2,
      };
    };

    for (let i = 0; i < count; i++) {
      particles.push(createParticle());
    }

    const observer = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0.05 }
    );
    if (containerRef.current) observer.observe(containerRef.current);

    const render = () => {
      if (isVisible) {
        const w = canvas.width / (window.devicePixelRatio || 1);
        const h = canvas.height / (window.devicePixelRatio || 1);
        ctx.clearRect(0, 0, w, h);

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.pulsePhase += p.pulseSpeed;
          p.alpha = p.baseAlpha + Math.sin(p.pulsePhase) * 0.1;

          if (p.y < -10) {
            p.y = h + 10;
            p.x = Math.random() * w;
          }
          if (p.x < -10) p.x = w + 10;
          if (p.x > w + 10) p.x = -10;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.color}, ${Math.max(0, p.alpha)})`;
          ctx.fill();
        }
      }
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
    };
  }, [showParticles, intensity]);

  return (
    <div ref={containerRef} className={`relative min-h-[calc(100vh-4rem)] bg-[#0A0F1D] text-slate-100 overflow-hidden ${className}`}>
      {/* 1. Underlying Cinematic Photography Layer */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={bgImageMap[variant] || bgImageMap.concert}
          alt="Concert stage atmospheric background"
          className={`w-full h-full object-cover object-center ${imageOpacityClass} filter brightness-105 contrast-115`}
        />

        {/* 2. Seamless Deep Navy Gradients & Atmosphere Darkening */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0F1D]/85 via-[#0D1527]/80 to-[#0A0F1D]" />
        
        {/* Variant-specific lighting overlays */}
        {variant === 'admin' ? (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-purple-950/20 to-transparent" />
        ) : variant === 'auth' ? (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-600/25 via-rose-900/20 to-transparent" />
        ) : variant === 'stage' ? (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/25 via-brand-900/15 to-transparent" />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-600/20 via-indigo-950/30 to-transparent" />
        )}
      </div>

      {/* 3. Luminous Radial Glow Orbs (Orange, Pink, Purple, Blue) */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-brand-500/15 rounded-full blur-[120px] pointer-events-none z-0 animate-pulse-glow" />
      <div className="absolute top-1/3 right-10 w-96 h-96 bg-purple-600/15 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* 4. Optional Sweeping Stage Spotlights */}
      {showBeams && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div
            className="absolute top-0 left-1/4 w-40 sm:w-64 h-[800px] bg-gradient-to-b from-brand-500/25 via-amber-400/10 to-transparent blur-2xl animate-stage-beam-left"
            style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}
          />
          <div
            className="absolute top-0 right-1/4 w-40 sm:w-64 h-[800px] bg-gradient-to-b from-purple-500/25 via-pink-400/10 to-transparent blur-2xl animate-stage-beam-right"
            style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}
          />
        </div>
      )}

      {/* 5. Delicate Floating Embers Canvas */}
      {showParticles && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none z-0 w-full h-full"
        />
      )}

      {/* 6. Dot Grid Pattern */}
      <div className="absolute inset-0 bg-dot-pattern-dark opacity-15 pointer-events-none z-0" />

      {/* 7. Foreground Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export default PageAtmosphere;
