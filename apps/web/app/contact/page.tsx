'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { toast } from '@/store/toast-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  MessageSquare,
  Clock,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export default function ContactUsPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    toast.success('Your message has been received! Our support team will respond within 4 hours.');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400 block">
          Get in Touch
        </span>
        <h1 className="font-serif text-4xl font-bold text-navy-950 dark:text-white">
          We&apos;re Here to Help You Show Up
        </h1>
        <p className="text-sm text-stone-600 dark:text-slate-300 leading-relaxed">
          Have questions about your booking, organizer onboarding, custom enterprise ticketing, or platform security? Reach out to our 24/7 dedicated support team.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact Info Cards */}
        <div className="space-y-4">
          <Card className="border-stone-200 dark:border-slate-800">
            <CardContent className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-stone-900 dark:text-white">Email Support</h3>
                <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">Direct ticketing and payment support</p>
                <a href="mailto:support@eventra.com" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline block mt-2">
                  support@eventra.com
                </a>
              </div>
            </CardContent>
          </Card>

          <Card className="border-stone-200 dark:border-slate-800">
            <CardContent className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-stone-900 dark:text-white">Organizer Partnerships</h3>
                <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">Festival organizers and corporate hosts</p>
                <a href="mailto:organizers@eventra.com" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline block mt-2">
                  organizers@eventra.com
                </a>
              </div>
            </CardContent>
          </Card>

          <Card className="border-stone-200 dark:border-slate-800">
            <CardContent className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-stone-900 dark:text-white">Live Support Hours</h3>
                <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                  Monday – Sunday: 24/7 Global Ticketing Desk
                </p>
                <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold block mt-2">
                  Average response time: &lt; 15 minutes
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2">
          <Card className="border-stone-200 dark:border-slate-800 shadow-md">
            <CardHeader className="border-b border-stone-100 dark:border-slate-800">
              <CardTitle className="text-xl text-stone-900 dark:text-white">Send Us a Direct Message</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {isSubmitted ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-stone-900 dark:text-white">Inquiry Dispatched!</h3>
                  <p className="text-sm text-stone-600 dark:text-slate-300 max-w-md mx-auto">
                    Thank you for reaching out, <strong>{name}</strong>. A member of our support team has received your ticket and will follow up at <strong>{email}</strong> shortly.
                  </p>
                  <Button variant="outline" size="sm" onClick={() => setIsSubmitted(false)}>
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Your Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      required
                    />
                    <Input
                      label="Email Address"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane@example.com"
                      required
                    />
                  </div>

                  <Input
                    label="Subject / Topic"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Question regarding booking reference #BK-..."
                    required
                  />

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-700 dark:text-slate-200 block">Your Message</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={5}
                      placeholder="Please provide details about your inquiry or ticket issue..."
                      required
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-200 dark:border-slate-700 bg-white dark:bg-[#1E293B] text-stone-900 dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button variant="primary" type="submit" className="gap-2 font-semibold shadow-md">
                      <Send className="w-4 h-4" />
                      <span>Send Message</span>
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
