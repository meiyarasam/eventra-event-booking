'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RegisterSchema, RegisterInput } from '@eventra/shared';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { toast } from '@/store/toast-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Ticket, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { BrandLogo } from '@/components/ui/brand-logo';

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      phone: '',
    },
  });

  const onSubmit = async (data: RegisterInput) => {
    try {
      setIsLoading(true);
      const res = await api.post<{ data: { user: any; accessToken?: string } }>('/auth/register', data);
      if (res.data?.accessToken && typeof window !== 'undefined') {
        localStorage.setItem('eventra_access_token', res.data.accessToken);
      }
      setUser(res.data.user);
      toast.success('Account created! A verification code has been sent to your email.');
      router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative overflow-hidden bg-gradient-to-b from-slate-50/80 via-[#FAF9F6] to-slate-100">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-brand-500/10 blur-[100px] rounded-full pointer-events-none -z-0" />
      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2 flex flex-col items-center">
          <BrandLogo size="lg" className="mb-2" />
          <h1 className="font-serif text-2xl font-bold text-navy-950">Create Attendee Account</h1>
          <p className="text-xs text-stone-500">
            Join thousands discovering and booking premiere events worldwide.
          </p>
        </div>

        {/* Register Card */}
        <Card className="border-stone-200 shadow-md">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Full Name"
                placeholder="e.g. Alex Chen"
                error={errors.name?.message}
                {...register('name')}
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                error={errors.email?.message}
                {...register('email')}
              />

              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min 8 characters (1 uppercase, 1 number)"
                hint="Must contain at least 8 characters, 1 uppercase, and 1 number."
                error={errors.password?.message}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-stone-500" />
                    ) : (
                      <Eye className="w-4 h-4 text-stone-500" />
                    )}
                  </button>
                }
                {...register('password')}
              />

              <Input
                label="Phone Number (Optional)"
                placeholder="+1 (555) 000-0000"
                error={errors.phone?.message}
                {...register('phone')}
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isLoading}
                  className="w-full text-base font-bold shadow-sm"
                >
                  Create Account
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Sign In Link */}
        <p className="text-center text-xs text-stone-500">
          Already registered?{' '}
          <Link href="/login" className="font-semibold text-brand-600 hover:underline">
            Sign In to your account
          </Link>
        </p>
      </div>
    </div>
  );
}
