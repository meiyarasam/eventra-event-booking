import React from 'react';
import Link from 'next/link';
import { Github, Twitter, Linkedin, Heart } from 'lucide-react';
import { BrandLogo } from '@/components/ui/brand-logo';

export function Footer() {
  return (
    <footer className="bg-[#070A12] text-slate-300 border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          {/* Brand info */}
          <div className="md:col-span-2 space-y-4">
            <BrandLogo size="md" theme="dark" />
            <p className="text-sm text-stone-400 max-w-sm leading-relaxed">
              The high-performance discovery, reservation, and ticketing platform for summits, concerts, conferences, and cultural exhibitions worldwide.
            </p>
            <div className="flex items-center gap-3 pt-2 text-stone-400">
              <span className="text-xs uppercase tracking-wider font-semibold text-stone-500">
                Evaluation Build v1.0
              </span>
            </div>
          </div>

          {/* Column 1: Discover */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">Discover</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/events" className="text-stone-400 hover:text-white transition-colors">
                  All Events
                </Link>
              </li>
              <li>
                <Link href="/categories" className="text-stone-400 hover:text-white transition-colors">
                  Event Categories
                </Link>
              </li>
              <li>
                <Link href="/events?city=New+York" className="text-stone-400 hover:text-white transition-colors">
                  New York Events
                </Link>
              </li>
              <li>
                <Link href="/events?city=San+Francisco" className="text-stone-400 hover:text-white transition-colors">
                  San Francisco
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Organizers */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">Organizers</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/organizer" className="text-stone-400 hover:text-white transition-colors">
                  Organizer Portal
                </Link>
              </li>
              <li>
                <Link href="/profile" className="text-stone-400 hover:text-white transition-colors">
                  Request Organizer Access
                </Link>
              </li>
              <li>
                <Link href="/organizer/events/new" className="text-stone-400 hover:text-white transition-colors">
                  Create an Event
                </Link>
              </li>
              <li>
                <Link href="/organizer/check-in" className="text-stone-400 hover:text-white transition-colors">
                  Gate Check-In Scanner
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Platform & Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-stone-400 hover:text-white transition-colors">
                  About EVENTRA
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-stone-400 hover:text-white transition-colors">
                  FAQ & Support
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-stone-400 hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-stone-400 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-stone-400 hover:text-white transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li className="pt-2 border-t border-stone-800">
                <Link href="/admin/login" className="text-amber-400 hover:text-amber-300 font-medium transition-colors flex items-center gap-1.5 text-xs">
                  <span>Admin Portal Login →</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <p>© {new Date().getFullYear()} EVENTRA Inc. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Engineered with modern Next.js 14, Express, and Neon PostgreSQL.
          </p>
        </div>
      </div>
    </footer>
  );
}
