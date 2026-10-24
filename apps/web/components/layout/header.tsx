'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { UserRole } from '@eventra/shared';
import {
  Compass,
  Calendar,
  Ticket,
  Bell,
  User,
  LogOut,
  ShieldAlert,
  Briefcase,
  Menu,
  X,
  ChevronDown,
  Bookmark,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { BrandLogo } from '@/components/ui/brand-logo';
import { useThemeStore } from '@/store/theme-store';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { initTheme } = useThemeStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 15);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Keyboard navigation & accessibility (Escape key to close open menus)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setProfileDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close profile dropdown on outside click or touch
  useEffect(() => {
    if (!profileDropdownOpen) return;

    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick, { passive: true });

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [profileDropdownOpen]);

  // Close menus on route change
  useEffect(() => {
    setProfileDropdownOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  // Unread notifications query
  const { data: notificationsData } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () =>
      api.get<{ success?: boolean; data?: any[]; unreadCount: number }>('/notifications'),
    enabled: !!user,
    refetchInterval: 15000,
  });

  const unreadCount = useMemo(() => {
    if (!notificationsData) return 0;
    if (Array.isArray(notificationsData.data)) {
      return notificationsData.data.filter(
        (n: any) => !(n.isRead !== undefined ? n.isRead : n.read)
      ).length;
    }
    return notificationsData.unreadCount || 0;
  }, [notificationsData]);

  const handleLogout = async () => {
    await logout();
    setProfileDropdownOpen(false);
    router.push('/');
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        hasScrolled
          ? 'bg-[#0B0F19]/95 backdrop-blur-md shadow-md border-b border-slate-800'
          : 'bg-[#0B0F19]/90 backdrop-blur-md border-b border-slate-800/60'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-8">
            <BrandLogo size="md" theme="dark" />

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/events"
                className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isActive('/events')
                    ? 'text-brand-400 bg-brand-500/10 font-semibold border border-brand-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                Explore Events
              </Link>
              <Link
                href="/categories"
                className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isActive('/categories')
                    ? 'text-brand-400 bg-brand-500/10 font-semibold border border-brand-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                Categories
              </Link>
              <Link
                href="/about"
                className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isActive('/about')
                    ? 'text-brand-400 bg-brand-500/10 font-semibold border border-brand-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                About
              </Link>
            </nav>
          </div>

          {/* Right Section: Auth & Role Shortcuts */}
          <div className="hidden md:flex items-center gap-3">

            {isAuthenticated && user ? (
              <>
                {/* Role Specific Shortcuts */}
                {user.role === UserRole.ADMIN && (
                  <Link href="/admin">
                    <Button variant="outline" size="sm" className="gap-1.5 border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20">
                      <ShieldAlert className="w-4 h-4 text-amber-400" />
                      Admin Panel
                    </Button>
                  </Link>
                )}

                {user.role === UserRole.ORGANIZER && (
                  <Link href="/organizer">
                    <Button variant="outline" size="sm" className="gap-1.5 border-brand-500/40 bg-brand-500/10 text-brand-300 hover:bg-brand-500/20">
                      <Briefcase className="w-4 h-4 text-brand-400" />
                      Organizer Portal
                    </Button>
                  </Link>
                )}

                {/* Notifications Bell */}
                <Link
                  href="/notifications"
                  className="relative p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors border border-slate-800/60"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-brand-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* Profile Dropdown */}
                <div ref={profileDropdownRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setProfileDropdownOpen((prev) => !prev)}
                    aria-expanded={profileDropdownOpen}
                    aria-haspopup="true"
                    aria-label="User profile menu"
                    className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 hover:border-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-200"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-orange-600 text-white flex items-center justify-center font-semibold text-xs overflow-hidden">
                      {user.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        user.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="text-sm font-medium text-slate-200 max-w-[120px] truncate">
                      {user.name}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                        profileDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {profileDropdownOpen && (
                    <div
                      role="menu"
                      aria-orientation="vertical"
                      className="absolute right-0 mt-2 w-56 bg-[#111827] rounded-2xl border border-slate-800 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-slate-200"
                    >
                      <div className="px-4 py-2 border-b border-slate-800">
                        <div className="text-sm font-semibold text-white">{user.name}</div>
                        <div className="text-xs text-slate-400 truncate">{user.email}</div>
                        <div className="mt-1">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-brand-300 uppercase tracking-wider border border-slate-700">
                            {user.role}
                          </span>
                        </div>
                      </div>

                      <div className="py-1">
                        {user.role === UserRole.ADMIN && (
                          <Link
                            href="/admin"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-sm font-medium text-amber-400 hover:bg-slate-800 transition-colors"
                          >
                            <ShieldAlert className="w-4 h-4 text-amber-400" />
                            Admin Console
                          </Link>
                        )}
                        {user.role === UserRole.ORGANIZER && (
                          <Link
                            href="/organizer"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-sm font-medium text-brand-400 hover:bg-slate-800 transition-colors"
                          >
                            <Briefcase className="w-4 h-4 text-brand-400" />
                            Organizer Portal
                          </Link>
                        )}
                        <Link
                          href="/attendee"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                        >
                          <Compass className="w-4 h-4 text-slate-400" />
                          Attendee Dashboard
                        </Link>
                        <Link
                          href="/bookings"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                        >
                          <Calendar className="w-4 h-4 text-slate-400" />
                          My Bookings
                        </Link>
                        <Link
                          href="/tickets"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                        >
                          <Ticket className="w-4 h-4 text-slate-400" />
                          My Tickets & Passes
                        </Link>
                        <Link
                          href="/saved"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                        >
                          <Bookmark className="w-4 h-4 text-slate-400" />
                          Saved Events
                        </Link>
                        <Link
                          href="/profile"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                        >
                          <User className="w-4 h-4 text-slate-400" />
                          Profile Settings
                        </Link>
                      </div>

                      <div className="border-t border-slate-800 pt-1">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="flex items-center gap-2.5 w-full text-left px-4 py-2 text-sm text-rose-400 hover:bg-slate-800 transition-colors"
                        >
                          <LogOut className="w-4 h-4 text-rose-400" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="font-semibold text-slate-300 hover:text-white hover:bg-slate-800">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm" className="font-bold bg-gradient-to-r from-brand-500 to-coral-500 hover:from-brand-600 hover:to-coral-600 text-white shadow-md shadow-brand-500/25">
                    Create Account
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            {isAuthenticated && (
              <Link href="/notifications" className="relative p-2 text-slate-300">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-brand-500" />
                )}
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-300 hover:text-white rounded-lg"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-800 space-y-2 bg-[#0B0F19]">
            <Link
              href="/events"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              Explore Events
            </Link>
            <Link
              href="/categories"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              Categories
            </Link>
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              About
            </Link>

            {isAuthenticated && user ? (
              <div className="pt-4 border-t border-slate-800 space-y-2">
                <div className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Signed in as {user.name} ({user.role})
                </div>
                <Link
                  href="/attendee"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  Attendee Dashboard
                </Link>
                <Link
                  href="/bookings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  My Bookings
                </Link>
                <Link
                  href="/tickets"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  My Tickets
                </Link>
                <Link
                  href="/saved"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  Saved Events
                </Link>
                {user.role === UserRole.ORGANIZER && (
                  <Link
                    href="/organizer"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-sm text-brand-400 font-medium hover:bg-slate-800"
                  >
                    Organizer Portal
                  </Link>
                )}
                {user.role === UserRole.ADMIN && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-sm text-amber-400 font-medium hover:bg-slate-800"
                  >
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-sm text-rose-400 hover:bg-slate-800"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="pt-4 border-t border-stone-200 flex flex-col gap-2">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" className="w-full">
                    Create Account
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
