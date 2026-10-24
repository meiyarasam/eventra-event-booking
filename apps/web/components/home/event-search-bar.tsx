'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Calendar, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function EventSearchBar({ className = '' }: { className?: string }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams();
    if (searchTerm.trim()) {
      params.set('search', searchTerm.trim());
    }
    if (selectedCity.trim()) {
      params.set('city', selectedCity.trim());
    }

    // Map timeframe selection to concrete ISO date filter for backend API
    if (dateFilter) {
      const now = new Date();
      if (dateFilter === 'today') {
        const todayStr = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        params.set('startDate', todayStr);
      } else if (dateFilter === 'this-weekend') {
        // Calculate upcoming Saturday
        const dayOfWeek = now.getDay();
        const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
        const saturday = new Date(now);
        saturday.setDate(now.getDate() + daysUntilSaturday);
        saturday.setHours(0, 0, 0, 0);
        params.set('startDate', saturday.toISOString());
      } else if (dateFilter === 'this-month') {
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        params.set('startDate', now.toISOString());
        params.set('endDate', endOfMonth.toISOString());
      }
    }

    router.push(`/events?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`w-full max-w-4xl mx-auto bg-slate-900/90 backdrop-blur-xl rounded-2xl sm:rounded-full border border-slate-700/80 shadow-2xl shadow-black/50 p-2 sm:p-2.5 flex flex-col sm:flex-row items-center gap-2 transition-all duration-300 focus-within:border-brand-500/60 focus-within:ring-2 focus-within:ring-brand-500/20 ${className}`}
      role="search"
      aria-label="Find events"
    >
      {/* 1. Keyword search */}
      <div className="flex items-center gap-2.5 px-4 w-full sm:flex-1 py-2 sm:py-0 border-b sm:border-b-0 sm:border-r border-slate-800">
        <Search className="w-4 h-4 text-brand-400 shrink-0" aria-hidden="true" />
        <div className="flex flex-col flex-1 text-left">
          <label htmlFor="search-keyword" className="sr-only">
            Event, artist or topic
          </label>
          <input
            id="search-keyword"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Event, artist, or topic..."
            className="w-full text-sm text-white placeholder:text-slate-400 bg-transparent focus:outline-none font-medium"
          />
        </div>
      </div>

      {/* 2. City / Location */}
      <div className="flex items-center gap-2.5 px-4 w-full sm:w-52 py-2 sm:py-0 border-b sm:border-b-0 sm:border-r border-slate-800">
        <MapPin className="w-4 h-4 text-brand-400 shrink-0" aria-hidden="true" />
        <div className="flex flex-col flex-1 text-left">
          <label htmlFor="search-city" className="sr-only">
            City or venue
          </label>
          <input
            id="search-city"
            type="text"
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            placeholder="City or location"
            className="w-full text-sm text-white placeholder:text-slate-400 bg-transparent focus:outline-none font-medium"
          />
        </div>
      </div>

      {/* 3. Date Selection */}
      <div className="flex items-center gap-2 px-3 w-full sm:w-44 py-2 sm:py-0">
        <Calendar className="w-4 h-4 text-brand-400 shrink-0" aria-hidden="true" />
        <div className="flex flex-col flex-1 text-left">
          <label htmlFor="search-date" className="sr-only">
            Date range
          </label>
          <select
            id="search-date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full text-sm text-white bg-transparent focus:outline-none font-medium cursor-pointer appearance-none [&>option]:bg-slate-900 [&>option]:text-white"
          >
            <option value="">All Dates</option>
            <option value="today">Today</option>
            <option value="this-weekend">This Weekend</option>
            <option value="this-month">This Month</option>
          </select>
        </div>
      </div>

      {/* 4. Submit CTA */}
      <Button
        type="submit"
        variant="primary"
        size="md"
        className="w-full sm:w-auto rounded-xl sm:rounded-full px-6 py-2.5 bg-gradient-to-r from-brand-500 to-coral-500 hover:from-brand-600 hover:to-coral-600 text-white font-bold shadow-lg shadow-brand-500/30 hover:scale-105 active:scale-95 transition-all duration-200 shrink-0 flex items-center justify-center gap-2"
      >
        <span>Explore Events</span>
        <ArrowRight className="w-4 h-4" />
      </Button>
    </form>
  );
}

export default EventSearchBar;
