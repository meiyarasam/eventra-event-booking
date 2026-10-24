'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EventSchema, EventInput, CategoryDTO } from '@eventra/shared';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from '@/store/toast-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Calendar,
  MapPin,
  Globe,
  Plus,
  Trash2,
  Image as ImageIcon,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

export default function CreateEventPage() {
  const router = useRouter();
  const [isOnlineState, setIsOnlineState] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<{ data: CategoryDTO[] }>('/categories'),
  });
  const categories = categoriesData?.data || [];

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EventInput>({
    resolver: zodResolver(EventSchema),
    defaultValues: {
      title: '',
      description: '',
      categoryId: '',
      bannerUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1600&q=80',
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString().slice(0, 16),
      timeZone: 'UTC',
      isOnline: false,
      venueName: '',
      venueAddress: '',
      city: '',
      capacity: 250,
      cancellationPolicy: 'Free cancellation up to 48 hours before the event start time.',
      ticketTypes: [
        {
          name: 'General Admission',
          description: 'Full single-day access to all keynote sessions and exhibition hall.',
          price: 49.0,
          totalQuantity: 200,
          maxPerUser: 10,
        },
        {
          name: 'VIP Priority Pass',
          description: 'Reserved front-row seating, speaker lounge access, and exclusive networking.',
          price: 149.0,
          totalQuantity: 50,
          maxPerUser: 10,
        },
      ],
    },
  });

  const handleAiGenerateDescription = async () => {
    const currentTitle = watch('title');
    if (!currentTitle || !currentTitle.trim()) {
      toast.error('Please enter an Event Title before generating description.');
      return;
    }
    const catId = watch('categoryId');
    const matchedCategory = categories.find((c) => c.id === catId);

    setIsAiGenerating(true);
    try {
      const res = await api.post<{ success: boolean; data: { description: string } }>(
        '/ai/generate-description',
        {
          title: currentTitle.trim(),
          categoryName: matchedCategory?.name,
          venueName: watch('venueName'),
          city: watch('city'),
          isOnline: watch('isOnline'),
        }
      );
      if (res.data?.description) {
        setValue('description', res.data.description, { shouldValidate: true });
        toast.success('AI description generated successfully!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate description with AI.');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'ticketTypes',
  });

  const bannerUrlValue = watch('bannerUrl');

  // Event Creation Mutation
  const createMutation = useMutation({
    mutationFn: (data: EventInput) => api.post('/events', data),
    onSuccess: () => {
      toast.success('Event draft created successfully!');
      router.push('/organizer/events');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create event. Please verify all fields.');
    },
  });

  const onSubmit = (data: EventInput) => {
    // Total ticket capacity validation
    const totalTicketQuantity = data.ticketTypes.reduce((acc, t) => acc + t.totalQuantity, 0);
    if (totalTicketQuantity > data.capacity) {
      toast.error(`Total ticket quantity (${totalTicketQuantity}) cannot exceed event capacity (${data.capacity}).`);
      return;
    }

    createMutation.mutate(data);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-stone-200">
        <div>
          <button
            onClick={() => router.push('/organizer/events')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to My Events</span>
          </button>
          <h1 className="font-serif text-3xl font-bold text-navy-950">Create New Event</h1>
          <p className="text-sm text-stone-500 mt-1">
            Configure event details, dates, venue logistics, and customizable ticket tiers.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Section 1: Core Details */}
        <Card className="border-stone-200">
          <CardHeader className="bg-stone-50/50 pb-4">
            <CardTitle className="text-base">1. Event Overview & Branding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <Input
              label="Event Title"
              placeholder="e.g. Pacific Distributed Systems Summit 2026"
              error={errors.title?.message}
              {...register('title')}
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                Category
              </label>
              <select
                {...register('categoryId')}
                className="w-full h-11 px-3.5 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 focus:border-brand-500 focus:outline-none"
              >
                <option value="">Select a category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.categoryId?.message && (
                <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.categoryId.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-slate-200">
                  Description
                </label>
                <button
                  type="button"
                  onClick={handleAiGenerateDescription}
                  disabled={isAiGenerating}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-400 hover:text-brand-300 bg-brand-500/10 hover:bg-brand-500/20 px-2.5 py-1 rounded-lg border border-brand-500/30 transition-all disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 text-brand-400 ${isAiGenerating ? 'animate-spin' : ''}`} />
                  <span>{isAiGenerating ? 'Generating...' : '✨ Generate with AI'}</span>
                </button>
              </div>
              <textarea
                rows={5}
                placeholder="Provide a comprehensive agenda, speaker lineup, and learning outcomes..."
                className="w-full p-3.5 text-sm border border-stone-300 dark:border-slate-700 bg-white dark:bg-[#1E293B] text-stone-900 dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-slate-500 rounded-xl focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors"
                {...register('description')}
              />
              {errors.description?.message && (
                <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.description.message}</p>
              )}
            </div>

            {/* Banner URL & Live Preview */}
            <div>
              <Input
                label="Banner Image URL"
                placeholder="https://images.unsplash.com/..."
                hint="Use a high-resolution 16:9 event photograph (Unsplash or Cloudinary)."
                error={errors.bannerUrl?.message}
                {...register('bannerUrl')}
              />
              {bannerUrlValue && (
                <div className="mt-3 relative h-40 w-full rounded-2xl overflow-hidden bg-stone-100 border border-stone-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={bannerUrlValue} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Date, Time & Logistics */}
        <Card className="border-stone-200">
          <CardHeader className="bg-stone-50/50 pb-4">
            <CardTitle className="text-base">2. Date, Time & Venue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Start Date & Time"
                type="datetime-local"
                error={errors.startDate?.message}
                {...register('startDate')}
              />
              <Input
                label="End Date & Time"
                type="datetime-local"
                error={errors.endDate?.message}
                {...register('endDate')}
              />
            </div>

            <div className="flex items-center gap-2 p-3 bg-stone-50 rounded-xl border border-stone-200">
              <input
                type="checkbox"
                id="isOnlineCheck"
                checked={isOnlineState}
                onChange={(e) => {
                  setIsOnlineState(e.target.checked);
                  setValue('isOnline', e.target.checked);
                }}
                className="w-4 h-4 text-brand-600 rounded border-stone-300"
              />
              <label htmlFor="isOnlineCheck" className="text-sm font-medium text-stone-800 cursor-pointer">
                This is a 100% Virtual / Online Interactive Event
              </label>
            </div>

            {!isOnlineState && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in">
                <div className="sm:col-span-2">
                  <Input
                    label="Venue Name"
                    placeholder="e.g. Grand Convention Center"
                    {...register('venueName')}
                  />
                </div>
                <div>
                  <Input
                    label="City"
                    placeholder="e.g. San Francisco"
                    {...register('city')}
                  />
                </div>
                <div className="sm:col-span-3">
                  <Input
                    label="Address"
                    placeholder="e.g. 747 Howard St"
                    {...register('venueAddress')}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <Input
                label="Total Event Capacity"
                type="number"
                min="1"
                error={errors.capacity?.message}
                {...register('capacity', { valueAsNumber: true })}
              />
              <Input
                label="Cancellation Policy"
                {...register('cancellationPolicy')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Customizable Ticket Types Builder */}
        <Card className="border-stone-200">
          <CardHeader className="bg-stone-50/50 pb-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">3. Ticket Types & Pricing Tiers</CardTitle>
              <p className="text-xs text-stone-500 mt-0.5">
                Configure tiered ticket categories (General Admission, VIP, Early Bird, etc.).
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  name: 'Standard Pass',
                  description: 'Access pass.',
                  price: 79.0,
                  totalQuantity: 50,
                  maxPerUser: 10,
                })
              }
              className="gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Tier</span>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 space-y-3 relative"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-600">
                    Tier #{index + 1}
                  </span>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-stone-400 hover:text-rose-600 p-1"
                      aria-label="Remove tier"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <Input
                      label="Tier Name"
                      placeholder="e.g. VIP All-Access"
                      {...register(`ticketTypes.${index}.name` as const)}
                    />
                  </div>
                  <div>
                    <Input
                      label="Price (INR ₹)"
                      type="number"
                      step="1"
                      min="0"
                      {...register(`ticketTypes.${index}.price` as const, { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <Input
                      label="Total Seats"
                      type="number"
                      min="1"
                      {...register(`ticketTypes.${index}.totalQuantity` as const, { valueAsNumber: true })}
                    />
                  </div>
                </div>

                <Input
                  label="Tier Description / Perks (Optional)"
                  placeholder="e.g. Includes exclusive Q&A session and gift pack"
                  {...register(`ticketTypes.${index}.description` as const)}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
          <Button type="button" variant="outline" onClick={() => router.push('/organizer/events')}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={createMutation.isPending}
            className="px-8 shadow-md"
          >
            Create Event Draft
          </Button>
        </div>
      </form>
    </div>
  );
}
