'use client';

import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  baseAlpha: number;
  pulseSpeed: number;
  pulsePhase: number;
}

export function HeroBackgroundAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let isVisible = true;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Responsive canvas resizing
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

    // Refined warm golden embers & champagne star dust (eliminating harsh jarring colored spots)
    const particleColors = [
      '251, 191, 36',   // Warm Gold #FBBF24
      '249, 115, 22',   // Brand Orange #F97316
      '254, 215, 170',  // Soft Champagne #FED7AA
      '255, 255, 255',  // Pure Stardust
    ];

    const particleCount = prefersReducedMotion ? 12 : 36;
    const particles: Particle[] = [];

    const createParticle = (initialY?: number): Particle => {
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);
      const color = particleColors[Math.floor(Math.random() * particleColors.length)];
      // Delicate ambient opacity so particles never obscure text
      const baseAlpha = 0.12 + Math.random() * 0.25;
      return {
        x: Math.random() * w,
        y: initialY !== undefined ? initialY : Math.random() * h,
        radius: 0.6 + Math.random() * 1.3, // Tiny delicate micro-embers
        vx: (Math.random() - 0.5) * 0.25,
        vy: -0.2 - Math.random() * 0.35, // Slow, peaceful upwards drift
        color,
        alpha: baseAlpha,
        baseAlpha,
        pulseSpeed: 0.015 + Math.random() * 0.03,
        pulsePhase: Math.random() * Math.PI * 2,
      };
    };

    const containerW = canvas.width / (window.devicePixelRatio || 1);
    const containerH = canvas.height / (window.devicePixelRatio || 1);

    for (let i = 0; i < particleCount; i++) {
      particles.push(createParticle());
    }

    // Pointer interactivity (mouse attraction/repulsion radius)
    let mouse = { x: -1000, y: -1000, active: false };

    const handlePointerMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };

    const handlePointerLeave = () => {
      mouse.active = false;
    };

    const parentEl = containerRef.current?.parentElement;
    if (parentEl) {
      parentEl.addEventListener('mousemove', handlePointerMove, { passive: true });
      parentEl.addEventListener('mouseleave', handlePointerLeave, { passive: true });
    }

    // IntersectionObserver to pause rendering when scrolled out of view
    const observer = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0].isIntersecting;
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    let lastTime = performance.now();

    const render = (time: number) => {
      animationFrameId = requestAnimationFrame(render);
      if (!isVisible) return;

      const delta = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);

      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Animate pulse
        p.pulsePhase += p.pulseSpeed;
        p.alpha = Math.max(0.08, p.baseAlpha + Math.sin(p.pulsePhase) * 0.12);

        // Move upwards with subtle gentle sway
        p.y += p.vy;
        p.x += p.vx + Math.sin(p.pulsePhase * 0.6) * 0.15;

        // Pointer proximity gentle displacement
        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 100;
          if (dist < maxDist && dist > 0) {
            const force = (1 - dist / maxDist) * 1.2;
            p.x += (dx / dist) * force;
            p.y += (dy / dist) * force;
          }
        }

        // Respawn when particle exits top
        if (p.y < -10) {
          particles[i] = createParticle(h + 10);
        }
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;

        // Soft glow particle drawing
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
        ctx.shadowColor = `rgba(${p.color}, 0.5)`;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      if (parentEl) {
        parentEl.removeEventListener('mousemove', handlePointerMove);
        parentEl.removeEventListener('mouseleave', handlePointerLeave);
      }
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden z-[1]"
      aria-hidden="true"
    >
      {/* 1. Volumetric Concert Stage Spotlight Beam (Left) */}
      <div
        className="absolute -top-10 left-1/12 w-[340px] sm:w-[480px] h-[750px] animate-stage-beam-left mix-blend-screen opacity-45 pointer-events-none filter blur-2xl"
        style={{
          background:
            'conic-gradient(from 120deg at 0% 0%, rgba(249, 115, 22, 0.45) 0deg, rgba(251, 146, 60, 0.15) 25deg, transparent 45deg)',
        }}
      />

      {/* 2. Volumetric Concert Stage Spotlight Beam (Right) */}
      <div
        className="absolute -top-10 right-1/12 w-[340px] sm:w-[480px] h-[750px] animate-stage-beam-right mix-blend-screen opacity-45 pointer-events-none filter blur-2xl"
        style={{
          background:
            'conic-gradient(from 240deg at 100% 0%, rgba(99, 102, 241, 0.5) 0deg, rgba(168, 85, 247, 0.2) 25deg, transparent 45deg)',
        }}
      />

      {/* 3. Center Concert Laser/Focus Beam (Sweeping Vertical) */}
      <div
        className="absolute -top-20 left-1/2 -translate-x-1/2 w-[280px] sm:w-[380px] h-[800px] animate-stage-beam-center mix-blend-screen opacity-35 pointer-events-none filter blur-xl"
        style={{
          background:
            'conic-gradient(from 170deg at 50% 0%, rgba(244, 63, 94, 0.45) 0deg, rgba(249, 115, 22, 0.18) 18deg, transparent 35deg)',
        }}
      />

      {/* 4. Morphing Ambient Glow Nebulas */}
      <div className="absolute top-1/4 left-1/3 w-[520px] h-[280px] bg-gradient-to-r from-brand-500/25 via-rose-500/15 to-indigo-500/20 rounded-full blur-[110px] animate-aurora-float mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[460px] h-[260px] bg-gradient-to-l from-indigo-600/25 via-purple-500/15 to-brand-500/15 rounded-full blur-[100px] animate-aurora-float [animation-delay:4s] mix-blend-screen pointer-events-none" />

      {/* 5. Expanding Stage Bass Energy Rings (Pulsing soundwave effect at the stage center) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 sm:w-96 sm:h-96 rounded-full border border-brand-500/20 animate-bass-pulse-1 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 sm:w-96 sm:h-96 rounded-full border border-indigo-400/20 animate-bass-pulse-2 pointer-events-none" />

      {/* 6. High-Performance Particle Canvas (Concert embers & golden dust) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
    </div>
  );
}
