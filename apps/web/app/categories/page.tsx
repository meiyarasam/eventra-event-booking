'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { CategoryDTO } from '@eventra/shared';
import { Card, CardContent } from '@/components/ui/card';
import { Cpu, Music, Briefcase, GraduationCap, Palette, ArrowRight, Sparkles } from 'lucide-react';

export default function CategoriesPage() {
  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<{ data: CategoryDTO[] }>('/categories'),
  });

  const categories = categoriesData?.data || [];

  const categoryTheme: Record<
    string,
    { icon: React.ReactNode; bg: string; border: string; text: string; iconBg: string }
  > = {
    technology: {
      icon: <Cpu className="w-8 h-8 text-indigo-400 group-hover:text-white transition-colors" />,
      bg: 'bg-[#111827] hover:bg-[#162032]',
      border: 'border-slate-800 hover:border-indigo-500/50',
      text: 'text-white',
      iconBg: 'bg-indigo-500/10 border border-indigo-500/20 group-hover:bg-indigo-600',
    },
    music: {
      icon: <Music className="w-8 h-8 text-rose-400 group-hover:text-white transition-colors" />,
      bg: 'bg-[#111827] hover:bg-[#162032]',
      border: 'border-slate-800 hover:border-rose-500/50',
      text: 'text-white',
      iconBg: 'bg-rose-500/10 border border-rose-500/20 group-hover:bg-rose-600',
    },
    business: {
      icon: <Briefcase className="w-8 h-8 text-emerald-400 group-hover:text-white transition-colors" />,
      bg: 'bg-[#111827] hover:bg-[#162032]',
      border: 'border-slate-800 hover:border-emerald-500/50',
      text: 'text-white',
      iconBg: 'bg-emerald-500/10 border border-emerald-500/20 group-hover:bg-emerald-600',
    },
    education: {
      icon: <GraduationCap className="w-8 h-8 text-purple-400 group-hover:text-white transition-colors" />,
      bg: 'bg-[#111827] hover:bg-[#162032]',
      border: 'border-slate-800 hover:border-purple-500/50',
      text: 'text-white',
      iconBg: 'bg-purple-500/10 border border-purple-500/20 group-hover:bg-purple-600',
    },
    'arts-culture': {
      icon: <Palette className="w-8 h-8 text-amber-400 group-hover:text-white transition-colors" />,
      bg: 'bg-[#111827] hover:bg-[#162032]',
      border: 'border-slate-800 hover:border-amber-500/50',
      text: 'text-white',
      iconBg: 'bg-amber-500/10 border border-amber-500/20 group-hover:bg-amber-500',
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Vibrant Hero Banner with Ambient Mesh Background */}
      <div className="relative p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl overflow-hidden border border-slate-800">
        {/* Background Image Layer */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/ambient_mesh_bg.jpg"
            alt="Luminous background"
            className="w-full h-full object-cover opacity-20 mix-blend-screen filter brightness-110"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-indigo-950/80 to-slate-900/90" />
        </div>

        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/20 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none animate-float-slow" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-brand-500/20 text-brand-300 border border-brand-500/30 inline-block shadow-sm">
            Curated Disciplines
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Event Categories & Taxonomies
          </h1>
          <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed">
            Browse verified gatherings, summits, masterclasses, and exhibitions organized by field.
          </p>
        </div>
      </div>

      {/* Grid of Colorful Category Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => {
          const theme = categoryTheme[cat.slug] || {
            icon: <Cpu className="w-8 h-8 text-brand-400 group-hover:text-white" />,
            bg: 'bg-[#111827] hover:bg-[#162032]',
            border: 'border-slate-800 hover:border-brand-500/50',
            text: 'text-white',
            iconBg: 'bg-brand-500/10 border border-brand-500/20 group-hover:bg-brand-600',
          };

          return (
            <Link key={cat.id} href={`/events?category=${cat.slug}`} className="group">
              <Card
                className={`h-full ${theme.border} ${theme.bg} hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300`}
              >
                <CardContent className="p-8 flex flex-col justify-between h-full space-y-6">
                  <div>
                    <div
                      className={`w-16 h-16 rounded-2xl ${theme.iconBg} flex items-center justify-center mb-6 transition-all shadow-sm`}
                    >
                      {theme.icon}
                    </div>

                    <h3 className={`font-serif text-2xl font-bold ${theme.text} group-hover:text-brand-400 transition-colors mb-2`}>
                      {cat.name}
                    </h3>

                    <p className="text-xs text-slate-400 leading-relaxed font-normal">
                      {cat.description || 'Discover upcoming verified events in this category.'}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-400">
                      {cat._count?.events ? `${cat._count.events} Published Events` : 'Explore Events'}
                    </span>
                    <div className="flex items-center gap-1 text-brand-400 group-hover:translate-x-1.5 transition-transform font-bold">
                      <span>Browse</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
