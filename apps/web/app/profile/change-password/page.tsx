'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from '@/store/toast-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Lock, ShieldCheck } from 'lucide-react';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const changePasswordMutation = useMutation({
    mutationFn: (payload: any) => api.patch('/users/me/password', payload),
    onSuccess: (data: any) => {
      toast.success(data.message || 'Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      router.push('/profile');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Password change failed. Please verify your current password.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation password do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    changePasswordMutation.mutate({
      currentPassword,
      newPassword,
    });
  };

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-xs font-semibold text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Profile Overview</span>
        </Link>
        <h1 className="font-serif text-3xl font-bold text-navy-950 dark:text-white">Change Password</h1>
        <p className="text-sm text-stone-500 dark:text-slate-400 mt-1">
          Keep your EVENTRA account secure by using a strong, unique password.
        </p>
      </div>

      <Card className="border-stone-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="border-b border-stone-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <CardTitle className="text-lg">Security Credentials</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              type="password"
              label="Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Input
              type="password"
              label="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              hint="Must be at least 8 characters with 1 uppercase letter and 1 number."
              required
            />

            <Input
              type="password"
              label="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-100 dark:border-slate-800">
              <Link href="/profile">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button
                variant="primary"
                type="submit"
                isLoading={changePasswordMutation.isPending}
                className="gap-2 font-semibold"
              >
                <Lock className="w-4 h-4" />
                <span>Update Password</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
