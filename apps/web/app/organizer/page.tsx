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
  Briefcase,
  Plus,
  Calendar,
  Ticket,
  TrendingUp,
  CheckCircle2,
  Users,
  IndianRupee,
  ArrowRight,
  ShieldAlert,
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

export default function OrganizerDashboardPage() {
  const { data: dashData, isLoading } = useQuery({
    queryKey: ['organizer-dashboard'],
    queryFn: () => api.get<{ data: any }>('/organizer/dashboard'),
  });

  const dashboard = dashData?.data;
  const summary = dashboard?.summary || {
    totalEvents: 0,
    publishedEvents: 0,
    pendingEvents: 0,
    totalSoldTickets: 0,
    grossRevenue: 0,
    totalCheckedIn: 0,
    checkInRatePercentage: 0,
  };

  const eventPerformance = dashboard?.eventPerformance || [];
  const recentBookings = dashboard?.recentBookings || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold mb-2">
            <Briefcase className="w-3.5 h-3.5" />
            <span>Organizer Management Suite</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-navy-950">Organizer Dashboard</h1>
          <p className="text-sm text-stone-500 mt-1">
            Track real-time ticket sales, capacity fulfillment, and event admissions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/organizer/events/new">
            <Button variant="primary" size="md" className="gap-2">
              <Plus className="w-4 h-4" />
              <span>Create Event</span>
            </Button>
          </Link>
          <Link href="/organizer/events">
            <Button variant="outline" size="md">
              Manage Events
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="border-slate-200 border-t-4 border-t-emerald-500 bg-gradient-to-b from-emerald-50/30 to-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Gross Ticket Sales
              </span>
              <IndianRupee className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-3xl font-extrabold text-navy-950 block">
              {formatCurrency(summary.grossRevenue)}
            </span>
            <span className="text-xs text-stone-500 mt-1 block">Across confirmed bookings</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 border-t-4 border-t-brand-500 bg-gradient-to-b from-brand-50/30 to-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-800">
                Tickets Sold
              </span>
              <Ticket className="w-4 h-4 text-brand-600" />
            </div>
            <span className="text-3xl font-extrabold text-navy-950 block">
              {summary.totalSoldTickets}
            </span>
            <span className="text-xs text-stone-500 mt-1 block">Confirmed seats issued</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 border-t-4 border-t-sky-500 bg-gradient-to-b from-sky-50/30 to-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-800">
                Check-in Rate
              </span>
              <CheckCircle2 className="w-4 h-4 text-sky-600" />
            </div>
            <span className="text-3xl font-extrabold text-navy-950 block">
              {summary.checkInRatePercentage}%
            </span>
            <span className="text-xs text-stone-500 mt-1 block">
              {summary.totalCheckedIn} scanned admissions
            </span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 border-t-4 border-t-purple-500 bg-gradient-to-b from-purple-50/30 to-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-800">
                Active Events
              </span>
              <Calendar className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-3xl font-extrabold text-navy-950 block">
              {summary.publishedEvents}
            </span>
            <span className="text-xs text-stone-500 mt-1 block">
              {summary.pendingEvents} pending moderation
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Chart & Performance Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales by Event Chart */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-stone-200">
            <CardHeader className="bg-stone-50/50 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Revenue by Event (₹)</CardTitle>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Real-time performance from persistent PostgreSQL records.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {eventPerformance.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-sm text-stone-400">
                  No sales data recorded yet. Create an event to begin tracking performance.
                </div>
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={eventPerformance} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis
                        dataKey="title"
                        tick={{ fontSize: 11, fill: '#64748B' }}
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                      />
                      <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                      <Tooltip
                        formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Revenue']}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0' }}
                      />
                      <Bar dataKey="revenue" fill="#EA580C" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Attendees / Bookings feed */}
        <div className="space-y-4">
          <Card className="border-stone-200">
            <CardHeader className="bg-stone-50/50 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recent Bookings</CardTitle>
                <Link href="/organizer/events" className="text-xs text-brand-600 font-semibold hover:underline">
                  All
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {recentBookings.length === 0 ? (
                <p className="text-xs text-stone-500 text-center py-6">
                  No attendee bookings recorded yet.
                </p>
              ) : (
                recentBookings.slice(0, 5).map((b: any) => (
                  <div key={b.id} className="p-3 rounded-xl bg-stone-50 border border-stone-100 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-stone-900">{b.attendeeName}</span>
                      <span className="font-bold text-navy-950">{formatCurrency(b.totalAmount)}</span>
                    </div>
                    <div className="text-stone-500 truncate">{b.eventName}</div>
                    <div className="flex items-center justify-between text-[10px] text-stone-400 pt-1">
                      <span>{b.ticketsCount} seat(s)</span>
                      <span>{formatDate(b.createdAt, { month: 'short', day: 'numeric' })}</span>
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
