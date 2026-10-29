'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import { toast } from '@/store/toast-store';
import { useAuthStore } from '@/store/auth-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Users,
  Search,
  ArrowLeft,
  ShieldAlert,
  UserCheck,
  UserX,
  Trash2,
  Eye,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Filter,
  RotateCcw,
  Calendar,
  Ticket,
  Mail,
  Phone,
  Briefcase,
  Globe,
  CheckCircle2,
  Shield,
  X,
  ExternalLink,
} from 'lucide-react';

interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'ORGANIZER' | 'ATTENDEE';
  status: 'ACTIVE' | 'SUSPENDED';
  phone?: string | null;
  organizationName?: string | null;
  eventsCount: number;
  bookingsCount: number;
  createdAt: string;
}

export default function AdminUsersManagementPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user: currentAdmin, isAuthenticated, isLoading: authLoading } = useAuthStore();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Modals state
  const [inspectUserId, setInspectUserId] = useState<string | null>(null);
  const [confirmStatusModal, setConfirmStatusModal] = useState<{
    user: ManagedUser;
    newStatus: 'ACTIVE' | 'SUSPENDED';
  } | null>(null);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<ManagedUser | null>(null);

  // Route security check: Only authorized Admins can access
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || currentAdmin?.role !== 'ADMIN')) {
      router.replace('/admin/login');
    }
  }, [authLoading, isAuthenticated, currentAdmin, router]);

  // Fetch users list
  const {
    data: usersData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['admin-users', { page, search, roleFilter, statusFilter }],
    queryFn: () =>
      api.get<{ data: ManagedUser[]; meta: { page: number; total: number; totalPages: number } }>(
        '/admin/users',
        {
          page,
          search: search || undefined,
          role: roleFilter || undefined,
          status: statusFilter || undefined,
          limit: 15,
        }
      ),
    enabled: isAuthenticated && currentAdmin?.role === 'ADMIN',
  });

  // Fetch single user details for inspection
  const { data: userDetailsData, isLoading: isDetailsLoading } = useQuery({
    queryKey: ['admin-user-details', inspectUserId],
    queryFn: () => api.get<{ data: any }>(`/admin/users/${inspectUserId}`),
    enabled: !!inspectUserId,
  });

  const users: ManagedUser[] = usersData?.data || [];
  const meta = usersData?.meta || { page: 1, total: 0, totalPages: 1 };
  const userDetails = userDetailsData?.data;

  // Toggle Account Status Mutation (Suspend / Reactivate)
  const statusMutation = useMutation({
    mutationFn: (payload: { userId: string; status: 'ACTIVE' | 'SUSPENDED' }) =>
      api.patch(`/admin/users/${payload.userId}/status`, { status: payload.status }),
    onSuccess: (_, vars) => {
      toast.success(`User account status updated to ${vars.status}`);
      setConfirmStatusModal(null);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
      if (inspectUserId === vars.userId) {
        queryClient.invalidateQueries({ queryKey: ['admin-user-details', inspectUserId] });
      }
    },
    onError: (err: any) => {
      toast.error(err.message || 'Status update failed');
    },
  });

  // Delete User Mutation (supports 'deactivate' or 'permanent')
  const deleteMutation = useMutation({
    mutationFn: (payload: { userId: string; action: 'deactivate' | 'permanent' }) =>
      api.delete(`/admin/users/${payload.userId}?action=${payload.action}`),
    onSuccess: (res: any) => {
      if (res?.action === 'deactivated') {
        toast.success(res.message || 'Account deactivated to preserve transaction records.');
      } else {
        toast.success(res?.message || 'User account permanently removed.');
      }
      setConfirmDeleteModal(null);
      if (inspectUserId === confirmDeleteModal?.id) {
        setInspectUserId(null);
      }
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to remove user account.');
    },
  });

  const resetFilters = () => {
    setSearch('');
    setRoleFilter('');
    setStatusFilter('');
    setPage(1);
  };

  const hasActiveFilters = Boolean(search || roleFilter || statusFilter);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-in fade-in duration-200">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200 dark:border-slate-800">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 dark:text-slate-400 hover:text-brand-500 dark:hover:text-white mb-2 transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Admin Overview</span>
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-serif text-3xl font-bold text-navy-950 dark:text-white">
              User Accounts & Governance
            </h1>
            <Badge variant="outline" className="text-xs font-bold px-2.5 py-0.5 bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800/60">
              {meta.total} Registered Accounts
            </Badge>
          </div>
          <p className="text-sm text-stone-500 dark:text-slate-400 mt-1">
            Audit registered attendees, organizers, inspect profile history, and manage platform account privileges safely.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-2 border-stone-300 dark:border-slate-700 text-stone-700 dark:text-slate-200 hover:bg-stone-50 dark:hover:bg-slate-800 text-xs"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-stone-500 dark:text-slate-400 ${isFetching ? 'animate-spin text-brand-600' : ''}`} />
            <span>Refresh</span>
          </Button>
          <Link href="/admin">
            <Button variant="outline" size="sm" className="text-xs border-stone-300 dark:border-slate-700 text-stone-700 dark:text-slate-200 hover:bg-stone-50 dark:hover:bg-slate-800">
              Admin Overview
            </Button>
          </Link>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white dark:bg-[#111827] p-4 rounded-2xl border border-stone-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by full name or email address..."
            className="w-full pl-10 pr-9 py-2.5 bg-stone-50/80 dark:bg-slate-800/80 hover:bg-stone-50 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-stone-300 dark:border-slate-700 rounded-xl text-sm text-stone-900 dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-slate-500 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 focus:outline-none transition-all"
          />
          {search && (
            <button
              onClick={() => {
                setSearch('');
                setPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 dark:hover:text-slate-200 rounded-md"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-44 px-3.5 py-2.5 bg-stone-50 dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-xl text-xs font-medium text-stone-700 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:border-brand-500 focus:outline-none"
          >
            <option value="" className="bg-white dark:bg-slate-900">All Roles</option>
            <option value="ATTENDEE" className="bg-white dark:bg-slate-900">Attendees</option>
            <option value="ORGANIZER" className="bg-white dark:bg-slate-900">Organizers</option>
            <option value="ADMIN" className="bg-white dark:bg-slate-900">Administrators</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-40 px-3.5 py-2.5 bg-stone-50 dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-xl text-xs font-medium text-stone-700 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:border-brand-500 focus:outline-none"
          >
            <option value="" className="bg-white dark:bg-slate-900">All Statuses</option>
            <option value="ACTIVE" className="bg-white dark:bg-slate-900">Active</option>
            <option value="SUSPENDED" className="bg-white dark:bg-slate-900">Suspended</option>
          </select>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="gap-1.5 text-xs text-stone-600 dark:text-slate-300 border-stone-300 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-800 whitespace-nowrap"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear</span>
            </Button>
          )}
        </div>
      </div>

      {/* Users Table Card */}
      <Card className="border-stone-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-stone-300 dark:border-slate-700 border-t-brand-500 rounded-full animate-spin mx-auto" />
              <p className="text-sm font-medium text-stone-500 dark:text-slate-400">Loading registered user accounts...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-stone-400 dark:text-slate-500">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-stone-900 dark:text-white">No registered users found</h3>
                <p className="text-xs text-stone-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  {hasActiveFilters
                    ? 'No accounts match the current search query or active filter selections.'
                    : 'There are currently no registered users stored in the platform database.'}
                </p>
              </div>
              {hasActiveFilters && (
                <Button size="sm" variant="outline" onClick={resetFilters} className="text-xs gap-1.5 border-stone-300 dark:border-slate-700 text-stone-700 dark:text-slate-200">
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Filters</span>
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50/90 dark:bg-slate-800/70 border-b border-stone-200 dark:border-slate-800 text-stone-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-5">User Account</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Account Status</th>
                    <th className="py-3.5 px-4 text-center">Events</th>
                    <th className="py-3.5 px-4 text-center">Bookings</th>
                    <th className="py-3.5 px-4">Joined Date</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-slate-800/70">
                  {users.map((u) => {
                    const isSelf = currentAdmin?.id === u.id;
                    return (
                      <tr key={u.id} className="hover:bg-stone-50/80 dark:hover:bg-slate-800/40 transition-colors group">
                        {/* User Identity */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-stone-800 to-navy-950 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs border border-slate-700">
                              {u.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-stone-900 dark:text-slate-100 truncate block">
                                  {u.name}
                                </span>
                                {isSelf && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                                    You
                                  </span>
                                )}
                              </div>
                              <span className="text-stone-500 dark:text-slate-400 text-[11px] truncate block">
                                {u.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Role Badge */}
                        <td className="py-3.5 px-4">
                          <Badge
                            variant={
                              u.role === 'ADMIN'
                                ? 'danger'
                                : u.role === 'ORGANIZER'
                                ? 'brand'
                                : 'default'
                            }
                            className="text-[10px] font-bold px-2 py-0.5 capitalize flex items-center gap-1 w-fit"
                          >
                            {u.role === 'ADMIN' ? (
                              <Shield className="w-3 h-3 text-red-600" />
                            ) : u.role === 'ORGANIZER' ? (
                              <Briefcase className="w-3 h-3 text-brand-600" />
                            ) : (
                              <Users className="w-3 h-3 text-stone-500" />
                            )}
                            <span>{u.role.toLowerCase()}</span>
                          </Badge>
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-4">
                          <Badge
                            variant={u.status === 'ACTIVE' ? 'success' : 'danger'}
                            className="text-[10px] font-bold px-2 py-0.5 capitalize flex items-center gap-1 w-fit"
                          >
                            {u.status === 'ACTIVE' ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                            )}
                            <span>{u.status.toLowerCase()}</span>
                          </Badge>
                        </td>

                        {/* Hosted Events Count */}
                        <td className="py-3.5 px-4 text-center font-semibold text-stone-700 dark:text-slate-300">
                          {u.eventsCount > 0 ? (
                            <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-slate-800 text-stone-800 dark:text-slate-200 text-[11px]">
                              {u.eventsCount}
                            </span>
                          ) : (
                            <span className="text-stone-400 dark:text-slate-600">—</span>
                          )}
                        </td>

                        {/* Bookings Count */}
                        <td className="py-3.5 px-4 text-center font-semibold text-stone-700 dark:text-slate-300">
                          {u.bookingsCount > 0 ? (
                            <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-slate-800 text-stone-800 dark:text-slate-200 text-[11px]">
                              {u.bookingsCount}
                            </span>
                          ) : (
                            <span className="text-stone-400 dark:text-slate-600">—</span>
                          )}
                        </td>

                        {/* Joined Date */}
                        <td className="py-3.5 px-4 text-stone-500 dark:text-slate-400 text-xs whitespace-nowrap">
                          {formatDate(u.createdAt, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>

                        {/* Management Actions */}
                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Inspect Details */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setInspectUserId(u.id)}
                              className="text-xs px-2.5 py-1 text-stone-700 dark:text-slate-200 border-stone-200 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-800 hover:text-stone-900 dark:hover:text-white"
                              title="Inspect User Details"
                            >
                              <Eye className="w-3.5 h-3.5 text-stone-500 dark:text-slate-400" />
                              <span className="hidden sm:inline ml-1">Details</span>
                            </Button>

                            {/* Suspend / Reactivate (Disabled for current user) */}
                            {!isSelf && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setConfirmStatusModal({
                                    user: u,
                                    newStatus: u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE',
                                  })
                                }
                                className={`text-xs px-2.5 py-1 ${
                                  u.status === 'ACTIVE'
                                    ? 'text-amber-700 border-amber-200 hover:bg-amber-50'
                                    : 'text-emerald-700 border-emerald-300 hover:bg-emerald-50'
                                }`}
                                title={u.status === 'ACTIVE' ? 'Suspend Account' : 'Reactivate Account'}
                              >
                                {u.status === 'ACTIVE' ? (
                                  <>
                                    <UserX className="w-3.5 h-3.5" />
                                    <span className="hidden md:inline ml-1">Suspend</span>
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="w-3.5 h-3.5" />
                                    <span className="hidden md:inline ml-1">Reactivate</span>
                                  </>
                                )}
                              </Button>
                            )}

                            {/* Delete User */}
                            {isSelf ? (
                              <span className="text-[10px] text-stone-400 italic px-2 py-1 bg-stone-100 rounded-md border border-stone-200">
                                Protected
                              </span>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setConfirmDeleteModal(u)}
                                className="text-xs px-2.5 py-1 text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300"
                                title="Delete or remove user account"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span className="hidden md:inline ml-1">Delete</span>
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination Controls */}
      {meta.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-stone-200 pt-5">
          <span className="text-xs text-stone-500">
            Showing Page <span className="font-semibold text-stone-900">{meta.page}</span> of{' '}
            <span className="font-semibold text-stone-900">{meta.totalPages}</span> ({meta.total} registered users)
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="gap-1 text-xs"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </Button>
            <div className="text-xs font-semibold px-2 py-1 bg-stone-100 rounded-md text-stone-700">
              {meta.page} / {meta.totalPages}
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((prev) => Math.min(meta.totalPages, prev + 1))}
              className="gap-1 text-xs"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* INSPECT USER DETAILS DIALOG */}
      <Dialog
        isOpen={!!inspectUserId}
        onClose={() => setInspectUserId(null)}
        title={userDetails ? `User Account: ${userDetails.name}` : 'Loading User Details...'}
        description="Comprehensive audit of profile information, role status, and platform activity history."
        className="max-w-xl"
      >
        {isDetailsLoading || !userDetails ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-6 h-6 border-2 border-stone-300 border-t-brand-500 rounded-full animate-spin mx-auto" />
            <p className="text-xs text-stone-500">Retrieving user profile and activity records...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* User Profile Summary Card */}
            <div className="p-4 rounded-xl bg-stone-50 dark:bg-slate-800/80 border border-stone-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-navy-950 text-white font-bold text-sm flex items-center justify-center shrink-0 border border-slate-700">
                    {userDetails.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h4 className="font-semibold text-stone-900 dark:text-slate-100 text-sm">{userDetails.name}</h4>
                    <p className="text-xs text-stone-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <Mail className="w-3 h-3 text-stone-400 dark:text-slate-500" />
                      <span>{userDetails.email}</span>
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge
                    variant={userDetails.role === 'ADMIN' ? 'danger' : userDetails.role === 'ORGANIZER' ? 'brand' : 'default'}
                    className="text-[10px] font-bold"
                  >
                    {userDetails.role}
                  </Badge>
                  <Badge
                    variant={userDetails.status === 'ACTIVE' ? 'success' : 'danger'}
                    className="text-[10px] font-bold"
                  >
                    {userDetails.status}
                  </Badge>
                </div>
              </div>

              {/* Extended Profile Details */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-200 dark:border-slate-700 text-xs">
                {userDetails.profile?.phone && (
                  <div className="flex items-center gap-1.5 text-stone-600 dark:text-slate-300">
                    <Phone className="w-3.5 h-3.5 text-stone-400 dark:text-slate-500 shrink-0" />
                    <span className="truncate">{userDetails.profile.phone}</span>
                  </div>
                )}
                {userDetails.profile?.organizationName && (
                  <div className="flex items-center gap-1.5 text-stone-600 dark:text-slate-300">
                    <Briefcase className="w-3.5 h-3.5 text-stone-400 dark:text-slate-500 shrink-0" />
                    <span className="truncate">{userDetails.profile.organizationName}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-stone-600 dark:text-slate-300">
                  <Calendar className="w-3.5 h-3.5 text-stone-400 dark:text-slate-500 shrink-0" />
                  <span>
                    Joined {formatDate(userDetails.createdAt, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                {userDetails.profile?.websiteUrl && (
                  <div className="flex items-center gap-1.5 text-brand-600">
                    <Globe className="w-3.5 h-3.5 shrink-0" />
                    <a
                      href={userDetails.profile.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate hover:underline flex items-center gap-0.5"
                    >
                      Website <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                )}
              </div>

              {userDetails.profile?.bio && (
                <div className="text-xs text-stone-600 italic bg-white p-2.5 rounded-lg border border-stone-200">
                  &ldquo;{userDetails.profile.bio}&rdquo;
                </div>
              )}
            </div>

            {/* Activity Statistics Metrics */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 mb-2">Platform Metrics</h5>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-stone-50 dark:bg-slate-800/80 rounded-xl border border-stone-200 dark:border-slate-700 text-center">
                  <span className="text-lg font-bold text-slate-900 dark:text-white block">
                    {userDetails.stats?.bookingsCount || 0}
                  </span>
                  <span className="text-[11px] text-stone-500 dark:text-slate-400 font-medium">Bookings Made</span>
                </div>
                <div className="p-3 bg-stone-50 dark:bg-slate-800/80 rounded-xl border border-stone-200 dark:border-slate-700 text-center">
                  <span className="text-lg font-bold text-slate-900 dark:text-white block">
                    {userDetails.stats?.eventsCount || 0}
                  </span>
                  <span className="text-[11px] text-stone-500 dark:text-slate-400 font-medium">Events Hosted</span>
                </div>
                <div className="p-3 bg-stone-50 dark:bg-slate-800/80 rounded-xl border border-stone-200 dark:border-slate-700 text-center">
                  <span className="text-lg font-bold text-slate-900 dark:text-white block">
                    {formatCurrency(userDetails.stats?.totalSpent || 0)}
                  </span>
                  <span className="text-[11px] text-stone-500 dark:text-slate-400 font-medium">Total Volume</span>
                </div>
              </div>
            </div>

            {/* Recent Bookings List */}
            {userDetails.recentBookings?.length > 0 && (
              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                  Recent Orders & Bookings
                </h5>
                <div className="space-y-2">
                  {userDetails.recentBookings.map((b: any) => (
                    <div
                      key={b.id}
                      className="p-2.5 bg-white rounded-lg border border-stone-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-stone-900 block">{b.eventTitle}</span>
                        <span className="text-[10px] text-stone-400 font-mono">Ref: {b.bookingReference}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-stone-900 block">{formatCurrency(b.totalAmount)}</span>
                        <span className="text-[10px] font-semibold text-emerald-700">{b.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Inspector Modal Footer Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-stone-100">
              <Button variant="outline" size="sm" onClick={() => setInspectUserId(null)} className="text-xs">
                Close Inspector
              </Button>
              {currentAdmin?.id !== userDetails.id && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const u = users.find((usr) => usr.id === userDetails.id) || userDetails;
                    setConfirmDeleteModal(u);
                  }}
                  className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  <span>Remove User</span>
                </Button>
              )}
            </div>
          </div>
        )}
      </Dialog>

      {/* CONFIRM STATUS CHANGE MODAL */}
      {confirmStatusModal && (
        <Dialog
          isOpen={!!confirmStatusModal}
          onClose={() => setConfirmStatusModal(null)}
          title={`${confirmStatusModal.newStatus === 'SUSPENDED' ? 'Suspend' : 'Reactivate'} Account: ${confirmStatusModal.user.name}?`}
          description={
            confirmStatusModal.newStatus === 'SUSPENDED'
              ? 'Suspended users will be immediately blocked from logging in, booking tickets, or hosting events.'
              : 'Reactivating this account restores standard platform login and booking privileges immediately.'
          }
        >
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs mb-4 space-y-1">
            <div className="font-semibold text-stone-900">{confirmStatusModal.user.name}</div>
            <div className="text-stone-500">{confirmStatusModal.user.email}</div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
            <Button variant="outline" size="sm" onClick={() => setConfirmStatusModal(null)}>
              Cancel
            </Button>
            <Button
              variant={confirmStatusModal.newStatus === 'SUSPENDED' ? 'danger' : 'primary'}
              size="sm"
              isLoading={statusMutation.isPending}
              onClick={() =>
                statusMutation.mutate({
                  userId: confirmStatusModal.user.id,
                  status: confirmStatusModal.newStatus,
                })
              }
            >
              Confirm {confirmStatusModal.newStatus === 'SUSPENDED' ? 'Suspension' : 'Reactivation'}
            </Button>
          </div>
        </Dialog>
      )}

      {/* DELETE / SAFE REMOVAL CONFIRMATION DIALOG */}
      {confirmDeleteModal && (
        <Dialog
          isOpen={!!confirmDeleteModal}
          onClose={() => setConfirmDeleteModal(null)}
          title={`Remove User Account: ${confirmDeleteModal.name}`}
          description="Review account records and choose how to safely handle this user account."
        >
          <div className="space-y-4">
            {/* Selected User Overview Card */}
            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-stone-900 text-sm">{confirmDeleteModal.name}</span>
                <Badge variant="outline" className="text-[10px] font-bold">
                  {confirmDeleteModal.role}
                </Badge>
              </div>
              <div className="text-stone-500">{confirmDeleteModal.email}</div>
              <div className="text-stone-400 text-[11px]">
                Registered:{' '}
                {formatDate(confirmDeleteModal.createdAt, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
            </div>

            {/* Check for Associated Records */}
            {confirmDeleteModal.bookingsCount > 0 || confirmDeleteModal.eventsCount > 0 ? (
              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Account Has Important Activity Records</span>
                    <span className="text-amber-800 text-[11px] block mt-0.5">
                      This user has <strong>{confirmDeleteModal.bookingsCount} booking(s)</strong> and{' '}
                      <strong>{confirmDeleteModal.eventsCount} event(s)</strong>.
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed border-t border-amber-200/60 pt-2">
                  <strong>Recommended Action:</strong> Deactivating the account disables user login immediately while
                  safely preserving all existing ticket passes, QR codes, and financial audit trails.
                </p>
              </div>
            ) : (
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600">
                <p>
                  This account has no active bookings or events. You can permanently delete this account from the platform
                  database.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-4 border-t border-stone-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmDeleteModal(null)}
                disabled={deleteMutation.isPending}
                className="text-xs"
              >
                Cancel
              </Button>

              {confirmDeleteModal.bookingsCount > 0 || confirmDeleteModal.eventsCount > 0 ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    isLoading={deleteMutation.isPending}
                    onClick={() =>
                      deleteMutation.mutate({
                        userId: confirmDeleteModal.id,
                        action: 'permanent',
                      })
                    }
                    className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                  >
                    Permanently Delete
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={deleteMutation.isPending}
                    onClick={() =>
                      deleteMutation.mutate({
                        userId: confirmDeleteModal.id,
                        action: 'deactivate',
                      })
                    }
                    className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                  >
                    Deactivate Account (Recommended)
                  </Button>
                </>
              ) : (
                <Button
                  variant="danger"
                  size="sm"
                  isLoading={deleteMutation.isPending}
                  onClick={() =>
                    deleteMutation.mutate({
                      userId: confirmDeleteModal.id,
                      action: 'permanent',
                    })
                  }
                  className="text-xs font-semibold"
                >
                  Confirm Permanent Deletion
                </Button>
              )}
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
