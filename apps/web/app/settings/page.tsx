'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import { toast } from '@/store/toast-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  Lock,
  User,
  Shield,
  Smartphone,
  CheckCircle2,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [ticketSms, setTicketSms] = useState(false);
  const [marketingUpdates, setMarketingUpdates] = useState(false);

  const handleSavePreferences = () => {
    toast.success('Your communication preferences have been updated');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-navy-950 dark:text-white">Account Settings</h1>
        <p className="text-sm text-stone-500 dark:text-slate-400 mt-1">
          Manage your security settings, notification channels, and privacy controls.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Links Column */}
        <div className="space-y-3">
          <Card className="border-stone-200 dark:border-slate-800">
            <CardContent className="p-2 space-y-1">
              <Link
                href="/profile/edit"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-stone-50 dark:hover:bg-slate-800 text-xs font-semibold text-stone-800 dark:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <User className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  <span>Edit Profile</span>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400 dark:text-slate-500" />
              </Link>
              <Link
                href="/profile/change-password"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-stone-50 dark:hover:bg-slate-800 text-xs font-semibold text-stone-800 dark:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Lock className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  <span>Change Password</span>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400 dark:text-slate-500" />
              </Link>
              <Link
                href="/profile/organizer-access"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-stone-50 dark:hover:bg-slate-800 text-xs font-semibold text-stone-800 dark:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  <span>Organizer Access</span>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400 dark:text-slate-500" />
              </Link>
              <Link
                href="/notifications"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-stone-50 dark:hover:bg-slate-800 text-xs font-semibold text-stone-800 dark:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Bell className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  <span>Notifications Center</span>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400 dark:text-slate-500" />
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Settings Panels */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-stone-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="border-b border-stone-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                <CardTitle className="text-base text-stone-900 dark:text-white">Notification Preferences</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-stone-100 dark:border-slate-800">
                <div>
                  <span className="text-sm font-semibold text-stone-900 dark:text-white block">
                    Booking Confirmations & QR Passes
                  </span>
                  <span className="text-xs text-stone-500 dark:text-slate-400">
                    Receive email receipts and scannable tickets immediately after checkout.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between py-2 border-b border-stone-100 dark:border-slate-800">
                <div>
                  <span className="text-sm font-semibold text-stone-900 dark:text-white block">
                    SMS Event Day Reminders
                  </span>
                  <span className="text-xs text-stone-500 dark:text-slate-400">
                    Get gate check-in reminders and venue updates on your mobile phone.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={ticketSms}
                  onChange={(e) => setTicketSms(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <span className="text-sm font-semibold text-stone-900 dark:text-white block">
                    Curated Discovery Newsletter
                  </span>
                  <span className="text-xs text-stone-500 dark:text-slate-400">
                    Weekly highlights of upcoming concerts, conferences, and festivals in your city.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={marketingUpdates}
                  onChange={(e) => setMarketingUpdates(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer"
                />
              </div>

              <div className="pt-4 flex justify-end">
                <Button variant="primary" size="sm" onClick={handleSavePreferences}>
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-stone-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="border-b border-stone-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  <CardTitle className="text-base text-stone-900 dark:text-white">Active Account Tier</CardTitle>
                </div>
                <Badge variant="brand" className="uppercase font-bold text-xs">
                  {user?.role || 'ATTENDEE'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 text-xs text-stone-600 dark:text-slate-300 space-y-2">
              <p>
                Connected Email: <strong className="text-stone-900 dark:text-white">{user?.email}</strong>
              </p>
              <p>
                Account Status: <span className="text-emerald-700 dark:text-emerald-400 font-bold uppercase">{user?.status || 'ACTIVE'}</span>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
