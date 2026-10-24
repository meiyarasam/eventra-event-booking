'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ShieldAlert,
  Users,
  Calendar,
  CheckCircle,
  Clock,
  IndianRupee,
  Briefcase,
  ArrowRight,
  TrendingUp,
  Ticket,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

export default function AdminOverviewPage() {
  const { data: overviewData, isLoading } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => api.get<{ data: any }>('/admin/overview'),
  });

  const overview = overviewData?.data;
  const summary = overview?.summary || {
    totalUsers: 0,
    totalEvents: 0,
    pendingEventsCount: 0,
    pendingOrganizersCount: 0,
    confirmedBookingsCount: 0,
    grossVolume: 0,
  };

  const categoryDistribution = overview?.categoryDistribution || [];
  const recentUsers = overview?.recentUsers || [];
  const recentBookings = overview?.recentBookings || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Platform Operations & Administration</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-navy-950 dark:text-white">Administrative Control Panel</h1>
          <p className="text-sm text-stone-500 dark:text-slate-400 mt-1">
            Platform governance, event moderation queues, and user account management.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/admin/bookings">
            <Button variant="outline" size="md" className="gap-2 border-stone-300 dark:border-slate-700 text-stone-700 dark:text-slate-200 hover:border-emerald-500 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-emerald-50/10 shadow-sm transition-all">
              <Ticket className="w-4 h-4 text-emerald-500" />
              <span>Bookings & Passes</span>
            </Button>
          </Link>
          <Link href="/admin/users">
            <Button variant="outline" size="md" className="gap-2 border-stone-300 dark:border-slate-700 text-stone-700 dark:text-slate-200 hover:border-sky-500 hover:text-sky-500 dark:hover:text-sky-400 hover:bg-sky-50/10 shadow-sm transition-all">
              <Users className="w-4 h-4 text-sky-500" />
              <span>Users ({summary.totalUsers})</span>
            </Button>
          </Link>
          <Link href="/admin/events">
            <Button variant="primary" size="md" className="gap-2 bg-gradient-to-r from-amber-500 to-brand-500 hover:from-amber-600 hover:to-brand-600 text-white font-bold shadow-sm">
              <Calendar className="w-4 h-4" />
              <span>Events ({summary.totalEvents})</span>
            </Button>
          </Link>
          <Link href="/admin/organizers">
            <Button variant="outline" size="md" className="gap-2 border-stone-300 dark:border-slate-700 text-stone-700 dark:text-slate-200 hover:border-purple-500 hover:text-purple-400 hover:bg-purple-50/10 transition-all">
              <Briefcase className="w-4 h-4 text-purple-400" />
              <span>Requests ({summary.pendingOrganizersCount})</span>
            </Button>
          </Link>
          <Link href="/admin/notifications">
            <Button variant="outline" size="md" className="gap-2 border-stone-300 dark:border-slate-700 text-stone-700 dark:text-slate-200 hover:border-brand-500 hover:text-brand-500 dark:hover:text-brand-400 hover:bg-brand-50/10 shadow-sm transition-all">
              <TrendingUp className="w-4 h-4 text-brand-500" />
              <span>Broadcasts</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <Link href="/admin/events" className="group block focus:outline-none focus:ring-2 focus:ring-amber-500/20 rounded-2xl">
          <Card className="h-full cursor-pointer border-slate-200 dark:border-slate-800 border-t-4 border-t-amber-500 bg-white dark:bg-[#111827] shadow-sm group-hover:shadow-md group-hover:border-amber-400 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between text-stone-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  Platform Events
                </span>
                <Calendar className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-3xl font-extrabold text-navy-950 dark:text-white block">
                {summary.totalEvents}
              </span>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 group-hover:underline mt-1 flex items-center gap-1">
                Manage Events ({summary.pendingEventsCount} Pending) →
              </span>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/organizers" className="group block focus:outline-none focus:ring-2 focus:ring-purple-500/20 rounded-2xl">
          <Card className="h-full cursor-pointer border-slate-200 dark:border-slate-800 border-t-4 border-t-purple-500 bg-white dark:bg-[#111827] shadow-sm group-hover:shadow-md group-hover:border-purple-400 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between text-stone-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                  Organizer Applications
                </span>
                <Briefcase className="w-4 h-4 text-purple-500 group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-3xl font-extrabold text-navy-950 dark:text-white block">
                {summary.pendingOrganizersCount}
              </span>
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400 group-hover:underline mt-1 flex items-center gap-1">
                Review Applicants →
              </span>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/bookings" className="group block focus:outline-none focus:ring-2 focus:ring-emerald-500/20 rounded-2xl">
          <Card className="h-full cursor-pointer border-slate-200 dark:border-slate-800 border-t-4 border-t-emerald-500 bg-white dark:bg-[#111827] shadow-sm group-hover:shadow-md group-hover:border-emerald-400 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between text-stone-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Total Platform GMV
                </span>
                <IndianRupee className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-3xl font-extrabold text-navy-950 dark:text-white block">
                {formatCurrency(summary.grossVolume)}
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:underline mt-1 flex items-center gap-1">
                Audit Bookings ({summary.confirmedBookingsCount} Confirmed) →
              </span>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/users" className="group block focus:outline-none focus:ring-2 focus:ring-sky-500/20 rounded-2xl">
          <Card className="h-full cursor-pointer border-slate-200 dark:border-slate-800 border-t-4 border-t-sky-500 bg-white dark:bg-[#111827] shadow-sm group-hover:shadow-md group-hover:border-sky-400 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between text-stone-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400">
                  Registered Users
                </span>
                <Users className="w-4 h-4 text-sky-500 group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-3xl font-extrabold text-navy-950 dark:text-white block">
                {summary.totalUsers}
              </span>
              <span className="text-xs font-bold text-sky-600 dark:text-sky-400 group-hover:underline mt-1 flex items-center gap-1">
                Manage Registered Users →
              </span>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Two Column Section: Category Distribution & Recent Users */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Category Breakdown Chart */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-stone-200 dark:border-slate-800 bg-white dark:bg-[#111827]">
            <CardHeader className="bg-stone-50/50 dark:bg-slate-800/40 pb-4 border-b border-stone-100 dark:border-slate-800">
              <CardTitle className="text-base text-stone-900 dark:text-white">Event Distribution by Category</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryDistribution} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#94A3B8' }}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} />
                    <Tooltip
                      formatter={(val: any) => [`${val} Events`, 'Count']}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #334155', backgroundColor: '#0F172A', color: '#F8FAFC' }}
                    />
                    <Bar dataKey="count" fill="#F97316" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Registrations Feed */}
        <div className="space-y-4">
          <Card className="border-stone-200 dark:border-slate-800 bg-white dark:bg-[#111827]">
            <CardHeader className="bg-stone-50/50 dark:bg-slate-800/40 pb-3 border-b border-stone-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base text-stone-900 dark:text-white">Recent Registrations</CardTitle>
                <Link href="/admin/users" className="text-xs text-brand-500 font-semibold hover:underline">
                  All
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {recentUsers.length === 0 ? (
                <p className="text-xs text-stone-500 dark:text-slate-400 text-center py-6">No users found.</p>
              ) : (
                recentUsers.map((u: any) => (
                  <div key={u.id} className="p-3 rounded-xl bg-stone-50 dark:bg-slate-800/60 border border-stone-100 dark:border-slate-700/60 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-stone-900 dark:text-slate-100">{u.name}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {u.role}
                      </Badge>
                    </div>
                    <div className="text-stone-500 dark:text-slate-400 truncate">{u.email}</div>
                    <div className="text-[10px] text-stone-400 dark:text-slate-500 pt-0.5">
                      Joined {formatDate(u.createdAt, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
