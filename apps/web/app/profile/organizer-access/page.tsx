'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { toast } from '@/store/toast-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { UserRole } from '@eventra/shared';
import { ArrowLeft, Briefcase, CheckCircle2, Clock, ShieldAlert, Sparkles } from 'lucide-react';

export default function OrganizerAccessRequestPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [orgName, setOrgName] = useState('');
  const [orgReason, setOrgReason] = useState('');
  const [orgWebsite, setOrgWebsite] = useState('');

  // Check current profile and request status
  const { data: profileData, isLoading, refetch } = useQuery({
    queryKey: ['user-profile-org-req'],
    queryFn: async () => {
      const res = await api.get<{ data: any }>('/users/me');
      return res.data;
    },
  });

  const profile = profileData?.data;
  const isAlreadyOrganizer = user?.role === UserRole.ORGANIZER || user?.role === UserRole.ADMIN;
  const pendingRequest = profile?.organizerRequest;

  const organizerReqMutation = useMutation({
    mutationFn: (payload: any) => api.post('/users/organizer-requests', payload),
    onSuccess: (data: any) => {
      toast.success(data.message || 'Organizer application submitted for administrative review');
      refetch();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Application submission failed. Please try again.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    organizerReqMutation.mutate({
      organizationName: orgName,
      reason: orgReason,
      websiteUrl: orgWebsite || undefined,
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-xs font-semibold text-stone-500 hover:text-stone-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Profile Overview</span>
        </Link>
        <h1 className="font-serif text-3xl font-bold text-navy-950">Organizer Access Request</h1>
        <p className="text-sm text-stone-500 mt-1">
          Apply to host, publish, and sell tickets for your live events, conferences, and festivals.
        </p>
      </div>

      {isAlreadyOrganizer ? (
        <Card className="border-emerald-200 bg-emerald-50/20">
          <CardContent className="pt-6 space-y-4 text-center py-10">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-stone-900">You Are an Authorized Organizer</h2>
            <p className="text-sm text-stone-600 max-w-md mx-auto">
              Your account currently holds {user?.role} privileges. You have complete access to create events, configure ticket tiers, and view real-time attendee analytics.
            </p>
            <div className="pt-2">
              <Link href="/organizer">
                <Button variant="primary">Go to Organizer Workspace</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : pendingRequest ? (
        <Card className="border-stone-200">
          <CardHeader className="border-b border-stone-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Current Application Status</CardTitle>
              <Badge
                variant={
                  pendingRequest.status === 'APPROVED'
                    ? 'success'
                    : pendingRequest.status === 'REJECTED'
                    ? 'danger'
                    : 'warning'
                }
              >
                {pendingRequest.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="text-xs text-amber-900 space-y-1">
                <span className="font-bold block">Application Under Administrator Review</span>
                <p>
                  Your organizer application for <strong>{pendingRequest.organizationName}</strong> was submitted on{' '}
                  {new Date(pendingRequest.createdAt).toLocaleDateString()}. Our compliance team evaluates requests within 24 hours.
                </p>
              </div>
            </div>

            <div className="text-xs text-stone-500 space-y-1 pt-2">
              <p><strong>Reason provided:</strong> {pendingRequest.reason}</p>
              {pendingRequest.websiteUrl && (
                <p><strong>Website:</strong> {pendingRequest.websiteUrl}</p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-stone-200 shadow-sm">
          <CardHeader className="border-b border-stone-100">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-600" />
              <CardTitle className="text-lg">Organizer Application</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Organization or Brand Name"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="e.g. Acme Tech Summits or Blue Note Productions"
                required
              />

              <Input
                label="Official Website or Portfolio URL"
                value={orgWebsite}
                onChange={(e) => setOrgWebsite(e.target.value)}
                placeholder="https://example.com"
              />

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-700 dark:text-slate-200 block">
                  Why would you like organizer privileges on EVENTRA?
                </label>
                <textarea
                  value={orgReason}
                  onChange={(e) => setOrgReason(e.target.value)}
                  rows={4}
                  placeholder="Describe the upcoming events you plan to host, expected audience size, and ticketing format..."
                  required
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-200 dark:border-slate-700 bg-white dark:bg-[#1E293B] text-stone-900 dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                />
                <span className="text-[11px] text-stone-400 dark:text-slate-400">
                  Minimum 10 characters explaining your event hosting plans.
                </span>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-100">
                <Link href="/profile">
                  <Button variant="outline" type="button">
                    Cancel
                  </Button>
                </Link>
                <Button
                  variant="primary"
                  type="submit"
                  isLoading={organizerReqMutation.isPending}
                  className="gap-2 font-semibold"
                >
                  <Briefcase className="w-4 h-4" />
                  <span>Submit Application</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
