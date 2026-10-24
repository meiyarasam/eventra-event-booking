'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from '@/store/toast-store';
import { CategoryDTO, EventDTO } from '@eventra/shared';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save, Calendar, MapPin, Sparkles } from 'lucide-react';

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [venueName, setVenueName] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [city, setCity] = useState('');
  const [capacity, setCapacity] = useState(250);
  const [isOnline, setIsOnline] = useState(false);
  const [cancellationPolicy, setCancellationPolicy] = useState('');

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<{ data: CategoryDTO[] }>('/categories'),
  });
  const categories = categoriesData?.data || [];

  // Fetch event details
  const { data: eventData, isLoading } = useQuery({
    queryKey: ['organizer-event-edit', eventId],
    queryFn: async () => {
      const res = await api.get<{ data: EventDTO }>(`/events/${eventId}`);
      const ev = res.data;
      setTitle(ev.title || '');
      setDescription(ev.description || '');
      setCategoryId(ev.categoryId || '');
      setBannerUrl(ev.bannerUrl || '');
      setStartDate(ev.startDate ? new Date(ev.startDate).toISOString().slice(0, 16) : '');
      setEndDate(ev.endDate ? new Date(ev.endDate).toISOString().slice(0, 16) : '');
      setVenueName(ev.venueName || '');
      setVenueAddress(ev.venueAddress || '');
      setCity(ev.city || '');
      setCapacity(ev.capacity || 250);
      setIsOnline(ev.isOnline || false);
      setCancellationPolicy(ev.cancellationPolicy || '');
      return ev;
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: any) => api.patch(`/events/${eventId}`, payload),
    onSuccess: () => {
      toast.success('Event updated successfully');
      router.push('/organizer/events');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update event');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      title,
      description,
      categoryId,
      bannerUrl,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      venueName: isOnline ? null : venueName,
      venueAddress: isOnline ? null : venueAddress,
      city: isOnline ? null : city,
      capacity: Number(capacity),
      isOnline,
      cancellationPolicy,
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 animate-pulse space-y-6">
        <div className="h-10 w-1/3 bg-stone-200 rounded-xl" />
        <div className="h-96 bg-stone-200 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <Link
          href="/organizer/events"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 mb-2 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to My Events</span>
        </Link>
        <h1 className="font-serif text-3xl font-bold text-navy-950">Edit Event</h1>
        <p className="text-sm text-stone-500 mt-1">
          Update event schedule, venue location, capacity, or promotional description.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card className="border-stone-200 shadow-sm">
          <CardHeader className="border-b border-stone-100">
            <CardTitle className="text-lg">Event Overview</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            <Input
              label="Event Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Global AI & Tech Summit 2026"
              required
            />

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700 block">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
              >
                <option value="">Select a Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700 dark:text-slate-200 block">Full Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                required
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-200 dark:border-slate-700 bg-white dark:bg-[#1E293B] text-stone-900 dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
              />
            </div>

            <Input
              label="Banner Image URL"
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              required
            />
          </CardContent>
        </Card>

        <Card className="border-stone-200 shadow-sm">
          <CardHeader className="border-b border-stone-100">
            <CardTitle className="text-lg">Date & Venue</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="datetime-local"
                label="Start Date & Time"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
              <Input
                type="datetime-local"
                label="End Date & Time"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center gap-3 py-2">
              <input
                type="checkbox"
                id="isOnlineCheckbox"
                checked={isOnline}
                onChange={(e) => setIsOnline(e.target.checked)}
                className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer"
              />
              <label htmlFor="isOnlineCheckbox" className="text-sm font-medium text-stone-800 cursor-pointer">
                This is a virtual or online streaming event
              </label>
            </div>

            {!isOnline && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <Input
                  label="Venue Name"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  placeholder="e.g. Grand Convention Center"
                  required={!isOnline}
                />
                <Input
                  label="Address"
                  value={venueAddress}
                  onChange={(e) => setVenueAddress(e.target.value)}
                  placeholder="100 Main Street"
                />
                <Input
                  label="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="San Francisco"
                  required={!isOnline}
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="number"
                label="Maximum Total Capacity"
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                min={1}
                required
              />
              <Input
                label="Cancellation Policy"
                value={cancellationPolicy}
                onChange={(e) => setCancellationPolicy(e.target.value)}
                placeholder="Free cancellation up to 48 hours before..."
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
          <Link href="/organizer/events">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button
            variant="primary"
            type="submit"
            isLoading={updateMutation.isPending}
            className="gap-2 font-semibold"
          >
            <Save className="w-4 h-4" />
            <span>Save Event Changes</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
