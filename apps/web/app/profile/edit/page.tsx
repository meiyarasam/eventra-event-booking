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
import { ArrowLeft, Save } from 'lucide-react';

export default function EditProfilePage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  useQuery({
    queryKey: ['user-profile-edit'],
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

  const updateProfileMutation = useMutation({
    mutationFn: (payload: any) => api.patch('/users/me', payload),
    onSuccess: (data: any) => {
      toast.success('Your profile has been successfully updated');
      setUser(data.data);
      router.push('/profile');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Profile update failed. Please try again.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      name,
      phone: phone || null,
      bio: bio || null,
      avatarUrl: avatarUrl || null,
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-xs font-semibold text-stone-500 hover:text-stone-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Profile Overview</span>
        </Link>
        <h1 className="font-serif text-3xl font-bold text-navy-950">Edit Profile</h1>
        <p className="text-sm text-stone-500 mt-1">
          Update your public attendee information, contact details, and display preferences.
        </p>
      </div>

      <Card className="border-stone-200 shadow-sm">
        <CardHeader className="border-b border-stone-100">
          <CardTitle className="text-lg">Account Details</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-6 pb-4 border-b border-stone-100">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-brand-500 to-amber-500 text-white font-serif text-2xl font-bold flex items-center justify-center overflow-hidden shadow-inner shrink-0">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                ) : (
                  name?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || 'U'
                )}
              </div>
              <div className="space-y-1">
                <span className="text-sm font-semibold text-stone-900 block">Profile Picture</span>
                <p className="text-xs text-stone-500">
                  Provide an image URL to customize your avatar across the platform.
                </p>
              </div>
            </div>

            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jane Doe"
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
              placeholder="https://images.unsplash.com/..."
            />

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700 dark:text-slate-200 block">Personal Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                placeholder="Tell organizers and fellow attendees a bit about yourself..."
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-200 dark:border-slate-700 bg-white dark:bg-[#1E293B] text-stone-900 dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
              />
              <span className="text-[11px] text-stone-400 dark:text-slate-400">Maximum 500 characters</span>
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
                isLoading={updateProfileMutation.isPending}
                className="gap-2 font-semibold"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
