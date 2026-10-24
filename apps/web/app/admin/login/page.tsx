'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginSchema, LoginInput, UserRole } from '@eventra/shared';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { toast } from '@/store/toast-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BrandLogo } from '@/components/ui/brand-logo';
import {
  ShieldAlert,
  Lock,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { Suspense } from 'react';

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/admin';
  const { setUser, logout } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [accessDeniedMessage, setAccessDeniedMessage] = useState<string | null>(null);

  const {
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const performLogin = async (loginEmail: string, loginPass: string) => {
    try {
      setIsLoading(true);
      setAccessDeniedMessage(null);

      const res = await api.post<{ data: { user: any; accessToken?: string } }>('/auth/login', {
        email: loginEmail,
        password: loginPass,
      });
      const authenticatedUser = res.data.user;

      // STRICT ADMIN ENFORCEMENT
      if (authenticatedUser.role !== UserRole.ADMIN) {
        await logout();
        setAccessDeniedMessage(
          `Access Denied: Account '${authenticatedUser.email}' is registered as an ${authenticatedUser.role}. This portal is strictly restricted to Platform Administrators. Please sign in via the Attendee & Organizer Portal.`
        );
        toast.error('Access Denied: Administrator role required.');
        return;
      }

      if (res.data?.accessToken && typeof window !== 'undefined') {
        localStorage.setItem('eventra_access_token', res.data.accessToken);
      }

      setUser(authenticatedUser);
      toast.success(`Welcome to Admin Console, ${authenticatedUser.name}!`);
      window.location.href = redirect;
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutofill = (autoSubmit = false) => {
    const demoEmail = 'admin@eventra.com';
    const demoPass = 'AdminPassword123!';
    setEmail(demoEmail);
    setPassword(demoPass);
    setValue('email', demoEmail, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
    setValue('password', demoPass, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
    toast.success('Admin credentials autofilled!');

    if (autoSubmit) {
      performLogin(demoEmail, demoPass);
    }
  };

  const onSubmit = async () => {
    await performLogin(email, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-navy-950 text-white relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-dot-pattern opacity-10 pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[350px] bg-brand-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[300px] bg-amber-500/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Admin Brand Header */}
        <div className="text-center space-y-3 flex flex-col items-center">
          <BrandLogo size="lg" theme="dark" className="mb-1" />
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-semibold tracking-wider uppercase">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Platform Operations Console</span>
          </div>
          <h1 className="font-serif text-2xl font-bold text-white tracking-tight">
            Administrator Sign In
          </h1>
          <p className="text-xs text-stone-400 max-w-sm">
            Restricted access for EVENTRA operations staff, content moderators, and compliance engineers.
          </p>
        </div>

        {/* Access Denied Warning if an attendee tries to login here */}
        {accessDeniedMessage && (
          <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs space-y-2 animate-in fade-in">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <p>{accessDeniedMessage}</p>
            </div>
            <div className="pt-1">
              <Link
                href="/login"
                className="inline-flex items-center gap-1 text-xs font-bold text-rose-300 hover:text-white underline"
              >
                <span>Go to User / Attendee Sign In Portal</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}

        {/* Admin Demo Credentials Quick-Fill (Fast Evaluation) */}
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="text-left">
              <p className="text-xs font-bold text-amber-300">Admin Demo Credentials</p>
              <p className="text-[12px] text-stone-200 font-mono">admin@eventra.com • AdminPassword123!</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              id="admin-autofill-btn"
              onClick={() => handleAutofill(false)}
              className="px-3 py-1.5 rounded-xl bg-amber-500/25 hover:bg-amber-500/40 border border-amber-500/50 text-xs font-semibold text-amber-200 hover:text-white transition-all cursor-pointer"
            >
              Autofill
            </button>
            <button
              type="button"
              id="admin-oneclick-login-btn"
              onClick={() => handleAutofill(true)}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-brand-500 hover:from-amber-600 hover:to-brand-600 text-xs font-bold text-white shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              1-Click Sign In
            </button>
          </div>
        </div>

        {/* Admin Login Card */}
        <Card className="border-white/10 bg-white/10 backdrop-blur-md shadow-2xl text-stone-900">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-200 block">
                  Admin Email
                </label>
                <Input
                  type="email"
                  id="admin-email-field"
                  placeholder="e.g. admin@eventra.com"
                  error={errors.email?.message}
                  className="bg-white border-stone-300 text-stone-900 font-medium placeholder:text-stone-400 shadow-sm"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setValue('email', e.target.value, { shouldValidate: true, shouldDirty: true });
                  }}
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-stone-200 block">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-amber-400 hover:text-amber-300 underline"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  id="admin-password-field"
                  placeholder="Enter admin password"
                  error={errors.password?.message}
                  className="bg-white border-stone-300 text-stone-900 font-medium placeholder:text-stone-400 shadow-sm"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setValue('password', e.target.value, { shouldValidate: true, shouldDirty: true });
                  }}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-200/60 transition-colors focus:outline-none"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-stone-600" />
                      ) : (
                        <Eye className="w-4 h-4 text-stone-600" />
                      )}
                    </button>
                  }
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isLoading}
                  className="w-full text-base font-bold shadow-lg gap-2 bg-gradient-to-r from-amber-500 to-brand-500 hover:from-amber-600 hover:to-brand-600 text-white border-0 cursor-pointer"
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span>Authenticate as Admin</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Link back to User Login */}
        <div className="text-center pt-2 space-y-2">
          <p className="text-xs text-stone-400">
            Not an administrator?{' '}
            <Link href="/login" className="font-semibold text-brand-400 hover:text-brand-300 underline">
              Switch to Attendee & Organizer Sign In
            </Link>
          </p>
          <div className="text-[11px] text-stone-500 flex items-center justify-center gap-1.5 pt-2">
            <Lock className="w-3.5 h-3.5 text-stone-500" />
            <span>256-Bit Encrypted TLS Session • Role-Enforced Guard</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-navy-950 flex items-center justify-center text-stone-400">Loading admin console...</div>}>
      <AdminLoginForm />
    </Suspense>
  );
}
