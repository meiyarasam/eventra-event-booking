'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { toast } from '@/store/toast-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Briefcase,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Globe,
  User,
  ExternalLink,
} from 'lucide-react';

export default function AdminOrganizerRequestsPage() {
  const [rejectModalReq, setRejectModalReq] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch organizer requests
  const { data: reqsData, isLoading, refetch } = useQuery({
    queryKey: ['admin-organizer-requests'],
    queryFn: () => api.get<{ data: any[] }>('/admin/organizer-requests'),
  });

  const requests = reqsData?.data || [];
  const pendingRequests = requests.filter((r) => r.status === 'PENDING');

  // Review Mutation
  const reviewMutation = useMutation({
    mutationFn: (payload: { requestId: string; status: 'APPROVED' | 'REJECTED'; rejectionReason?: string }) =>
      api.post(`/admin/organizer-requests/${payload.requestId}/review`, {
        status: payload.status,
        rejectionReason: payload.rejectionReason,
      }),
    onSuccess: (_, vars) => {
      toast.success(
        vars.status === 'APPROVED'
          ? 'Organizer privileges granted! User updated to ORGANIZER.'
          : 'Request rejected. Feedback sent to applicant.'
      );
      setRejectModalReq(null);
      setRejectionReason('');
      refetch();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Action failed');
    },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200 dark:border-slate-800">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Admin Overview</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-3xl font-bold text-slate-900 dark:text-white">
              Organizer Access Applications
            </h1>
            <Badge variant="warning" className="text-xs font-bold">
              {pendingRequests.length} Pending
            </Badge>
          </div>
          <p className="text-sm text-stone-500 dark:text-slate-400 mt-1">
            Review attendee requests for event hosting and ticket publishing privileges.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div key={n} className="h-36 bg-stone-200 dark:bg-slate-800 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : pendingRequests.length === 0 ? (
        <EmptyState
          icon={<CheckCircle className="w-12 h-12 text-emerald-500" />}
          title="No Pending Applications"
          description="There are currently no attendee requests for organizer access waiting for review."
        />
      ) : (
        <div className="space-y-4">
          {pendingRequests.map((req) => (
            <Card key={req.id} className="border-stone-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Left Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-serif text-xl font-bold text-stone-900 dark:text-white">
                        {req.organizationName}
                      </h3>
                      <Badge variant="warning" className="text-[10px] font-bold">
                        PENDING REVIEW
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-slate-400">
                      <span>Applicant: <strong className="text-stone-800 dark:text-slate-200">{req.user?.name}</strong></span>
                      <span>•</span>
                      <span>{req.user?.email}</span>
                      <span>•</span>
                      <span>Applied on {formatDate(req.createdAt, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>

                    <div className="p-3 bg-stone-50 dark:bg-slate-800/60 rounded-xl border border-stone-200 dark:border-slate-700 text-xs text-stone-700 dark:text-slate-300 mt-2">
                      <strong className="block text-stone-900 dark:text-white mb-1">Reason & Planned Events:</strong>
                      {req.reason}
                    </div>

                    {req.websiteUrl && (
                      <div className="pt-1">
                        <a
                          href={req.websiteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline font-medium"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span>{req.websiteUrl}</span>
                          <ExternalLink className="w-3 h-3 ml-0.5" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2.5 pt-4 lg:pt-0 border-t lg:border-t-0 border-stone-100">
                    <Button
                      variant="primary"
                      size="sm"
                      isLoading={reviewMutation.isPending}
                      onClick={() => reviewMutation.mutate({ requestId: req.id, status: 'APPROVED' })}
                      className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 font-semibold"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Approve Access</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRejectModalReq(req)}
                      className="gap-1.5 text-rose-600 border-rose-200 hover:bg-rose-50"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalReq && (
        <Dialog
          isOpen={!!rejectModalReq}
          onClose={() => setRejectModalReq(null)}
          title={`Reject Application for ${rejectModalReq.organizationName}?`}
          description="Provide feedback to the applicant regarding why their organizer request was declined."
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                Reason / Feedback (Optional)
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Please establish a verified event organization portfolio before applying..."
                rows={3}
                className="w-full p-3.5 text-sm rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-[#1E293B] text-stone-900 dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100 dark:border-slate-800">
              <Button variant="outline" onClick={() => setRejectModalReq(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                isLoading={reviewMutation.isPending}
                onClick={() =>
                  reviewMutation.mutate({
                    requestId: rejectModalReq.id,
                    status: 'REJECTED',
                    rejectionReason,
                  })
                }
              >
                Submit Rejection
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
