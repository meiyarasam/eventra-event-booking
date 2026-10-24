'use client';

import React from 'react';
import Link from 'next/link';
import { Music, Cpu, Briefcase, Palette, GraduationCap, Sparkles } from 'lucide-react';
import { CategoryDTO } from '@eventra/shared';

interface CategoryNavProps {
  categories?: CategoryDTO[];
  selectedCategory?: string;
  onSelectCategory?: (slug: string) => void;
  className?: string;
}

const defaultCategoryMeta: Record<string, { icon: React.ReactNode; label: string }> = {
  music: {
    icon: <Music className="w-4 h-4 text-rose-400" />,
    label: 'Music & Concerts',
  },
  technology: {
    icon: <Cpu className="w-4 h-4 text-indigo-400" />,
    label: 'Technology & AI',
  },
  business: {
    icon: <Briefcase className="w-4 h-4 text-emerald-400" />,
    label: 'Business & Finance',
  },
  'arts-culture': {
    icon: <Palette className="w-4 h-4 text-amber-400" />,
    label: 'Arts & Culture',
  },
  education: {
    icon: <GraduationCap className="w-4 h-4 text-purple-400" />,
    label: 'Workshops & Learning',
  },
};

export function CategoryNav({
  categories = [],
  selectedCategory,
  onSelectCategory,
  className = '',
}: CategoryNavProps) {
  // Fallback items if categories haven't loaded yet
  const items =
    categories.length > 0
      ? categories
      : [
          { id: '1', slug: 'music', name: 'Music' },
          { id: '2', slug: 'technology', name: 'Technology' },
          { id: '3', slug: 'business', name: 'Business' },
          { id: '4', slug: 'arts-culture', name: 'Arts & Culture' },
          { id: '5', slug: 'education', name: 'Workshops' },
        ];

  return (
    <nav
      aria-label="Event Categories"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      className={`w-full overflow-x-auto no-scrollbar scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] py-2 ${className}`}
    >
      <div className="flex items-center justify-center gap-2.5 min-w-max px-4">
        {/* All Events pill */}
        <Link
          href="/events"
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold backdrop-blur-md border transition-all duration-200 ${
            !selectedCategory
              ? 'bg-white/20 border-white/40 text-white shadow-sm ring-1 ring-white/20'
              : 'bg-white/[0.07] hover:bg-white/[0.14] border-white/10 hover:border-brand-400/40 text-slate-300 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          <span>All Experiences</span>
        </Link>

        {items.map((cat) => {
          const meta = defaultCategoryMeta[cat.slug] || {
            icon: <Sparkles className="w-4 h-4 text-brand-400" />,
            label: cat.name,
          };

          const isActive = selectedCategory === cat.slug;

          if (onSelectCategory) {
            return (
              <button
                key={cat.slug}
                type="button"
                onClick={() => onSelectCategory(cat.slug)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium backdrop-blur-md border transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-500/25 border-brand-400 text-white shadow-sm ring-1 ring-brand-400/40 font-semibold'
                    : 'bg-white/[0.07] hover:bg-white/[0.14] border-white/10 hover:border-brand-400/40 text-slate-300 hover:text-white'
                }`}
              >
                {meta.icon}
                <span>{cat.name}</span>
              </button>
            );
          }

          return (
            <Link
              key={cat.slug}
              href={`/events?category=${cat.slug}`}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium backdrop-blur-md border transition-all duration-200 ${
                isActive
                  ? 'bg-brand-500/25 border-brand-400 text-white shadow-sm ring-1 ring-brand-400/40 font-semibold'
                  : 'bg-white/[0.07] hover:bg-white/[0.14] border-white/10 hover:border-brand-400/40 text-slate-300 hover:text-white'
              }`}
            >
              {meta.icon}
              <span>{cat.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default CategoryNav;
