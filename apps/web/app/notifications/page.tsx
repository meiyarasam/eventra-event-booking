'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { NotificationDTO } from '@eventra/shared';
import { formatDate } from '@/lib/utils';
import { toast } from '@/store/toast-store';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Bell,
  CheckCheck,
  Calendar,
  Ticket,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

export default function NotificationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();

  const {
    data: notifData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () =>
      api.get<{ success?: boolean; data: NotificationDTO[]; unreadCount: number }>('/notifications'),
    enabled: !!user,
    refetchInterval: 15000,
  });

  const rawNotifications = notifData?.data || [];
  // Ensure unreadCount matches actual unread items
  const notifications = rawNotifications.map((n: any) => ({
    ...n,
    isRead: n.isRead !== undefined ? Boolean(n.isRead) : Boolean(n.read),
  }));

  const calculatedUnread = notifications.filter((n) => !n.isRead).length;
  const unreadCount = calculatedUnread;

  // Mark single as read with immediate optimistic UI update across all queries
  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });

      const previousNotifs = queryClient.getQueryData(['notifications', user?.id]);

      queryClient.setQueriesData({ queryKey: ['notifications'] }, (old: any) => {
        if (!old) return old;
        const rawList = Array.isArray(old.data) ? old.data : Array.isArray(old) ? old : [];
        const updatedList = rawList.map((n: any) =>
          n.id === id ? { ...n, isRead: true, read: true } : n
        );
        const newUnreadCount = updatedList.filter(
          (n: any) => !(n.isRead !== undefined ? n.isRead : n.read)
        ).length;

        return {
          ...old,
          data: updatedList,
          unreadCount: newUnreadCount,
        };
      });

      return { previousNotifs };
    },
    onError: (err, id, context: any) => {
      if (context?.previousNotifs) {
        queryClient.setQueryData(['notifications', user?.id], context.previousNotifs);
      }
      toast.error('Could not mark notification as read.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all as read with immediate optimistic UI update
  const markAllReadMutation = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const previousNotifs = queryClient.getQueryData(['notifications', user?.id]);

      queryClient.setQueriesData({ queryKey: ['notifications'] }, (old: any) => {
        if (!old) return old;
        const rawList = Array.isArray(old.data) ? old.data : Array.isArray(old) ? old : [];
        const updatedList = rawList.map((n: any) => ({ ...n, isRead: true, read: true }));
        return {
          ...old,
          data: updatedList,
          unreadCount: 0,
        };
      });

      return { previousNotifs };
    },
    onSuccess: () => {
      toast.success('All notifications marked as read.');
    },
    onError: (err, variables, context: any) => {
      if (context?.previousNotifs) {
        queryClient.setQueryData(['notifications', user?.id], context.previousNotifs);
      }
      toast.error('Could not mark all notifications as read.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleOpenNotification = (n: any) => {
    if (!n.isRead) {
      markReadMutation.mutate(n.id);
    }
    if (n.link) {
      router.push(n.link);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-3xl font-bold text-navy-950">Notification Center</h1>
            {unreadCount > 0 && (
              <Badge variant="brand" className="text-xs font-bold">
                {unreadCount} Unread
              </Badge>
            )}
          </div>
          <p className="text-sm text-stone-500 mt-1">
            Stay informed about booking confirmations, organizer approvals, and ticket updates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              isLoading={markAllReadMutation.isPending}
              onClick={() => markAllReadMutation.mutate()}
              className="gap-1.5"
            >
              <CheckCheck className="w-4 h-4 text-stone-500" />
              <span>Mark All as Read</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            className="text-stone-500 hover:text-stone-800"
            aria-label="Refresh notifications"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-20 bg-stone-200 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="p-8 text-center bg-rose-50/50 rounded-2xl border border-rose-200 space-y-3">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="text-base font-semibold text-rose-900">Failed to load notifications</h3>
          <p className="text-xs text-rose-600 max-w-md mx-auto">
            We encountered a problem loading your notification updates. Please check your connection and try again.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </Button>
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-12 h-12 text-stone-400" />}
          title="No Notifications"
          description="You are completely caught up! We will notify you when there are updates on your bookings or events."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleOpenNotification(n)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                !n.isRead
                  ? 'bg-brand-50/30 border-brand-200 shadow-sm'
                  : 'bg-white border-stone-200 hover:border-stone-300'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm text-stone-900">{n.title}</h3>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">{n.message}</p>
                  <span className="text-[10px] text-stone-400 block pt-1">
                    {formatDate(n.createdAt, {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0 mt-1">
                  {n.link && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenNotification(n);
                      }}
                      className="text-xs gap-1 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-300 transition-colors"
                    >
                      <span>View</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  {!n.isRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        markReadMutation.mutate(n.id);
                      }}
                      className="text-[11px] text-stone-500 hover:text-stone-800"
                    >
                      Mark read
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
