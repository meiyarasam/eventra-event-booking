'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { toast } from '@/store/toast-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { UserRole } from '@eventra/shared';
import {
  User,
  Lock,
  Briefcase,
  CheckCircle,
  Clock,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

export default function ProfileSettingsPage() {
  const { user, setUser } = useAuthStore();
  const [organizerModalOpen, setOrganizerModalOpen] = useState(false);

  // Profile Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Organizer Request Form state
  const [orgName, setOrgName] = useState('');
  const [orgReason, setOrgReason] = useState('');
  const [orgWebsite, setOrgWebsite] = useState('');

  // Fetch full profile
  const { data: profileData, isLoading, refetch } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const res = await api.get<{ data: any }>('/users/me');
      const p = res.data;
      setName(p.name || '');
      setPhone(p.phone || '');
      setBio(p.bio || '');
      setAvatarUrl(p.avatarUrl || '');
      return p;
    },
  });

  const profile = profileData?.data;

  // Update Profile Mutation
  const updateProfileMutation = useMutation({
    mutationFn: (payload: any) => api.patch('/users/me', payload),
    onSuccess: (data: any) => {
      toast.success('Profile details updated successfully');
      setUser(data.data);
      refetch();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Profile update failed');
    },
  });

  // Change Password Mutation
  const changePasswordMutation = useMutation({
    mutationFn: (payload: any) => api.patch('/users/me/password', payload),
    onSuccess: (data: any) => {
      toast.success(data.message || 'Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Password change failed');
    },
  });

  // Organizer Request Mutation
  const organizerReqMutation = useMutation({
    mutationFn: (payload: any) => api.post('/users/organizer-requests', payload),
    onSuccess: (data: any) => {
      toast.success(data.message || 'Organizer application submitted for administrative review');
      setOrganizerModalOpen(false);
      refetch();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Request failed');
    },
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="pb-6 border-b border-stone-200">
        <h1 className="font-serif text-3xl font-bold text-navy-950">Account & Profile Settings</h1>
        <p className="text-sm text-stone-500 mt-1">
          Manage your personal information, security credentials, and organization privileges.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-stone-200">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-24 h-24 rounded-3xl bg-stone-900 text-white text-3xl font-bold flex items-center justify-center mx-auto overflow-hidden shadow-md">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                ) : (
                  (name || 'U').charAt(0).toUpperCase()
                )}
              </div>

              <div>
                <h3 className="font-serif text-lg font-bold text-stone-900">{name || user?.name}</h3>
                <p className="text-xs text-stone-500">{user?.email}</p>
                <div className="mt-2">
                  <Badge variant="outline" className="text-xs font-semibold uppercase tracking-wider">
                    {user?.role}
                  </Badge>
                </div>
              </div>

              {/* Organizer Access Callout */}
              {user?.role === UserRole.ATTENDEE && (
                <div className="pt-4 border-t border-stone-100 text-left space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-600 block">
                    Host Events on EVENTRA
                  </span>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Want to create events, configure ticket tiers, and scan passes?
                  </p>
                  {profile?.latestOrganizerRequest?.status === 'PENDING' ? (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Application under admin review</span>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOrganizerModalOpen(true)}
                      className="w-full text-xs font-semibold gap-1.5"
                    >
                      <Briefcase className="w-4 h-4 text-brand-600" />
                      <span>Request Organizer Access</span>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Forms */}
        <div className="lg:col-span-2 space-y-8">
          {/* Profile Edit Form */}
          <Card className="border-stone-200 shadow-sm">
            <CardHeader className="bg-stone-50/50 pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4 text-brand-600" />
                <span>Personal Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateProfileMutation.mutate({ name, phone, bio, avatarUrl });
                }}
                className="space-y-4"
              >
                <Input
                  label="Display Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <Input
                  label="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                />
                <Input
                  label="Avatar Image URL"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                />
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-slate-200 mb-1.5">
                    Bio / About Me
                  </label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Briefly introduce yourself..."
                    className="w-full p-3.5 text-sm rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-[#1E293B] text-stone-900 dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={updateProfileMutation.isPending}
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Change Password Form */}
          <Card className="border-stone-200 shadow-sm">
            <CardHeader className="bg-stone-50/50 pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="w-4 h-4 text-brand-600" />
                <span>Security & Password</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  changePasswordMutation.mutate({ currentPassword, newPassword });
                }}
                className="space-y-4"
              >
                <Input
                  label="Current Password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
                <Input
                  label="New Password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  hint="Min 8 characters, with 1 uppercase letter and 1 number."
                  required
                />
                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="outline"
                    isLoading={changePasswordMutation.isPending}
                  >
                    Update Password
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Organizer Request Dialog */}
      <Dialog
        isOpen={organizerModalOpen}
        onClose={() => setOrganizerModalOpen(false)}
        title="Apply for Organizer Privileges"
        description="Tell our platform moderators about your organization and the events you plan to host."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            organizerReqMutation.mutate({
              organizationName: orgName,
              reason: orgReason,
              websiteUrl: orgWebsite,
            });
          }}
          className="space-y-4"
        >
          <Input
            label="Organization / Company Name"
            placeholder="e.g. Apex Tech Conferences"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-slate-200 mb-1.5">
              Why do you want organizer access?
            </label>
            <textarea
              rows={4}
              required
              placeholder="Describe your event portfolio, expected attendance, and frequency..."
              value={orgReason}
              onChange={(e) => setOrgReason(e.target.value)}
              className="w-full p-3.5 text-sm rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-[#1E293B] text-stone-900 dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors"
            />
          </div>

          <Input
            label="Website or Portfolio URL (Optional)"
            placeholder="https://..."
            value={orgWebsite}
            onChange={(e) => setOrgWebsite(e.target.value)}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
            <Button type="button" variant="outline" onClick={() => setOrganizerModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={organizerReqMutation.isPending}
            >
              Submit Application
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
