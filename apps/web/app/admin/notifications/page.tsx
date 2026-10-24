'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from '@/store/toast-store';
import { formatDate } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  Send,
  ArrowLeft,
  Users,
  Megaphone,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Radio,
} from 'lucide-react';

export default function AdminNotificationsPage() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetRole, setTargetRole] = useState('ALL');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: () => api.get<{ data: any[]; total: number }>('/admin/notifications'),
  });

  const notifications = data?.data || [];

  const broadcastMutation = useMutation({
    mutationFn: (payload: { title: string; message: string; targetRole: string }) =>
      api.post<{ success: boolean; message: string; deliveredCount: number }>(
        '/admin/notifications/broadcast',
        payload
      ),
    onSuccess: (res) => {
      toast.success(res.message || 'Announcement broadcast dispatched successfully.');
      setTitle('');
      setMessage('');
      refetch();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to dispatch broadcast announcement.');
    },
  });

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error('Please enter both a title and an announcement message.');
      return;
    }
    broadcastMutation.mutate({
      title: title.trim(),
      message: message.trim(),
      targetRole,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 dark:text-brand-400 mb-2">
            <Link href="/admin" className="hover:underline flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Admin Control Panel</span>
            </Link>
            <span>/</span>
            <span>Notifications</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-navy-950 dark:text-slate-100 flex items-center gap-3">
            <span>Platform Announcement Broadcasts</span>
            <Badge variant="outline" className="text-xs px-2.5 py-0.5 border-brand-500/30 text-brand-500">
              Operations Center
            </Badge>
          </h1>
          <p className="text-sm text-stone-500 dark:text-slate-400 mt-1">
            Dispatch urgent bulletins, terms updates, platform alerts, and push notices to registered attendees and organizers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-2 border-stone-300 dark:border-slate-700 text-stone-700 dark:text-slate-200"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>
          <Link href="/admin">
            <Button variant="secondary" size="sm" className="gap-2">
              <span>Overview Dashboard</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Broadcast Form */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <CardHeader className="p-6 border-b border-stone-100 dark:border-slate-800 bg-gradient-to-r from-brand-50/50 to-transparent dark:from-brand-950/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-navy-950 dark:text-slate-100">
                    New Broadcast Announcement
                  </CardTitle>
                  <p className="text-xs text-stone-500 dark:text-slate-400">
                    Will appear in notification centers immediately.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleBroadcast} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-stone-700 dark:text-slate-200 block mb-1.5 uppercase tracking-wider">
                    Announcement Headline
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Scheduled Platform Maintenance Tonight"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50/50 dark:bg-slate-800 text-stone-900 dark:text-slate-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 dark:text-slate-200 block mb-1.5 uppercase tracking-wider">
                    Target User Audience
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'ALL', label: 'All Users' },
                      { id: 'ATTENDEE', label: 'Attendees' },
                      { id: 'ORGANIZER', label: 'Organizers' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTargetRole(t.id)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                          targetRole === t.id
                            ? 'border-brand-500 bg-brand-500/10 text-brand-500 dark:text-brand-400 shadow-sm'
                            : 'border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-400 hover:bg-stone-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 dark:text-slate-200 block mb-1.5 uppercase tracking-wider">
                    Message Body
                  </label>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Detail the announcement details, timing, policy impacts, or guidelines clearly..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50/50 dark:bg-slate-800 text-stone-900 dark:text-slate-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm transition-all resize-none"
                    required
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full font-bold shadow-md gap-2"
                    isLoading={broadcastMutation.isPending}
                  >
                    <Send className="w-4 h-4" />
                    <span>Send Broadcast Notification</span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Broadcast Audit History */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-navy-950 dark:text-slate-100 flex items-center gap-2">
              <Radio className="w-4 h-4 text-brand-500" />
              <span>Recent Dispatched Announcements</span>
            </h2>
            <span className="text-xs text-stone-400 dark:text-slate-500 font-medium">
              {notifications.length} recent messages
            </span>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <div className="p-12 text-center text-stone-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-stone-200 dark:border-slate-800">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
                <span>Loading recent broadcasts...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center text-stone-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-stone-200 dark:border-slate-800">
                <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-semibold text-base text-stone-700 dark:text-slate-300">
                  No broadcasts yet
                </p>
                <p className="text-xs text-stone-400 mt-1">
                  Use the form on the left to broadcast an announcement to your community.
                </p>
              </div>
            ) : (
              notifications.map((n: any) => (
                <Card
                  key={n.id}
                  className="border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
                >
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0 mt-0.5">
                          <Bell className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-stone-900 dark:text-slate-100">
                            {n.title}
                          </h4>
                          <p className="text-xs text-stone-600 dark:text-slate-300 mt-1 leading-relaxed">
                            {n.message}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0 font-medium">
                        {n.type || 'SYSTEM'}
                      </Badge>
                    </div>
                    <div className="mt-3 pt-3 border-t border-stone-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-stone-400">
                      <span>Recipient ID: {n.userId?.slice(0, 10)}...</span>
                      <span>{formatDate(n.createdAt)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
