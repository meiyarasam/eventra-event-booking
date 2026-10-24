'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck,
  Cpu,
  QrCode,
  Lock,
  ArrowRight,
  Mail,
  Phone,
  Building,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  HelpCircle,
  FileText,
  Clock,
  Layers,
} from 'lucide-react';
import { BrandLogo } from '@/components/ui/brand-logo';
import { PageAtmosphere } from '@/components/layout/page-atmosphere';

export default function AboutPage() {
  return (
    <PageAtmosphere variant="concert" className="pb-20">
      {/* Hero Header Section */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-12 sm:pt-16 sm:pb-16 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-bold uppercase tracking-widest backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Architected for Reliability & Real-Time Ticketing</span>
        </div>

        <h1 className="font-serif text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-4xl mx-auto">
          Modern Event Discovery &{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-400 via-rose-400 to-indigo-400">
            Guaranteed Pass Delivery
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          EVENTRA is a high-availability event platform engineered to eliminate oversold seats, ghost reservations, and ticketing fraud through concurrency-safe transactions and cryptographic QR verification.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link href="/events">
            <Button variant="primary" size="lg" className="font-bold gap-2 shadow-lg shadow-brand-500/25">
              <span>Explore Live Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/contact">
            <Button variant="outline" size="lg" className="border-slate-700 text-slate-200 hover:text-white hover:bg-slate-800">
              <span>Contact Platform Support</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Core Engineering Pillars */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-10">
          <h2 className="text-xs font-bold uppercase tracking-widest text-brand-400">
            Core Architecture Principles
          </h2>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1">
            Built from the ground up for zero-downtime flash sales
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-7 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md shadow-xl hover:border-brand-500/40 transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-xl text-white">
              Concurrency-Safe Locking
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Two-phase reservation architecture holds inventory in atomic database transactions with deterministic TTL cleanups, guaranteeing that simultaneous checkout rushes never oversell capacity.
            </p>
          </div>

          <div className="p-7 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md shadow-xl hover:border-emerald-500/40 transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-xl text-white">
              Cryptographic QR Passes
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Every confirmed seat receives an unforgeable, unguessable token rendered into a high-density QR code. Digital passes are automatically delivered via email and checked in atomically at venue doors.
            </p>
          </div>

          <div className="p-7 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md shadow-xl hover:border-purple-500/40 transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-xl text-white">
              Role-Based Governance
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Strict multi-tier RBAC separates Attendees, Verified Organizers, and Administrators. Administrative oversight queues monitor events, organizer credentials, and transactions with audit records.
            </p>
          </div>
        </div>
      </div>

      {/* Official Administrator Contact Section */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/80 p-8 sm:p-10 backdrop-blur-md shadow-2xl space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-800">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified Platform Administration</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white">
                Official Administration & Inquiries
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Reach out directly to the EVENTRA Core Operations and Administrative Governance team.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <a
                href="mailto:admin@eventra.com"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm shadow-md transition-all"
              >
                <Mail className="w-4 h-4" />
                <span>Email Official Admin</span>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Admin Name & Department */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center shrink-0">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">
                    Lead Administrator
                  </span>
                  <span className="font-bold text-base text-white block">
                    Admin Eventra
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-400 pl-13 leading-relaxed">
                Platform Governance & Core Operations Authority
              </p>
            </div>

            {/* Email Address */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">
                    Official Email
                  </span>
                  <a
                    href="mailto:admin@eventra.com"
                    className="font-mono font-bold text-sm text-sky-400 hover:underline block"
                  >
                    admin@eventra.com
                  </a>
                </div>
              </div>
              <p className="text-xs text-slate-400 pl-13 leading-relaxed">
                Response time: Under 24 business hours
              </p>
            </div>

            {/* Telephone Contact */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">
                    Operations Support
                  </span>
                  <a
                    href="tel:+919820192831"
                    className="font-mono font-bold text-sm text-purple-300 hover:underline block"
                  >
                    +91 98201 92831
                  </a>
                </div>
              </div>
              <p className="text-xs text-slate-400 pl-13 leading-relaxed">
                Monday through Friday, 09:30 - 18:30 IST
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Specifications Matrix */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="p-8 sm:p-10 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-2xl font-bold text-white flex items-center gap-2">
              <Layers className="w-6 h-6 text-brand-400" />
              <span>Technology & Infrastructure Stack</span>
            </h3>
            <Badge variant="outline" className="text-xs text-slate-400 border-slate-700">
              Verified Production Stack
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-1.5">
              <span className="font-bold text-brand-400 block uppercase tracking-wider text-[11px]">
                Frontend Application
              </span>
              <p className="text-slate-300 font-medium">
                Next.js 14 App Router, TypeScript, React 18, Tailwind CSS, TanStack Query, Zustand, Recharts.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-1.5">
              <span className="font-bold text-sky-400 block uppercase tracking-wider text-[11px]">
                Backend REST Services
              </span>
              <p className="text-slate-300 font-medium">
                Node.js, Express, TypeScript, Zod request schemas, JWT authentication, Nodemailer delivery.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-1.5">
              <span className="font-bold text-purple-400 block uppercase tracking-wider text-[11px]">
                Data & Storage Tier
              </span>
              <p className="text-slate-300 font-medium">
                Neon Serverless PostgreSQL, Prisma ORM with interactive transactions and atomic inventory counters.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-1.5">
              <span className="font-bold text-emerald-400 block uppercase tracking-wider text-[11px]">
                Pass Security
              </span>
              <p className="text-slate-300 font-medium">
                High-density QR code tokens, single-use check-in verification, instant void on cancellation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageAtmosphere>
  );
}
