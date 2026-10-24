'use client';

import React from 'react';
import Link from 'next/link';

export interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  theme?: 'light' | 'dark';
  showSubtitle?: boolean;
  link?: boolean;
  className?: string;
  onClick?: () => void;
}

export function BrandLogoIcon({
  size = 44,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      <defs>
        {/* Warm, vibrant amber-to-orange gradient matching the reference image */}
        <linearGradient id="eventra-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFA216" />
          <stop offset="45%" stopColor="#FF7A00" />
          <stop offset="100%" stopColor="#F55200" />
        </linearGradient>

        {/* Soft natural drop shadow for squircle */}
        <filter id="eventra-logo-shadow" x="-15%" y="-15%" width="130%" height="130%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="3" stdDeviation="3.5" floodColor="#EA580C" floodOpacity="0.28" />
        </filter>
      </defs>

      {/* Squircle Badge Container */}
      <rect
        x="3"
        y="3"
        width="42"
        height="42"
        rx="14"
        fill="url(#eventra-logo-grad)"
        filter="url(#eventra-logo-shadow)"
      />

      {/* Ticket Pass with side notches, rotated -45° to match orientation */}
      <g transform="translate(24, 24) rotate(-45) translate(-13, -8)">
        {/* Ticket outer perimeter with cut-out notches on the long edges */}
        <path
          d="
            M 2.5 0.5
            L 8.5 0.5
            C 8.5 2.5, 10.5 4, 13 4
            C 15.5 4, 17.5 2.5, 17.5 0.5
            L 23.5 0.5
            C 24.6 0.5, 25.5 1.4, 25.5 2.5
            L 25.5 13.5
            C 25.5 14.6, 24.6 15.5, 23.5 15.5
            L 17.5 15.5
            C 17.5 13.5, 15.5 12, 13 12
            C 10.5 12, 8.5 13.5, 8.5 15.5
            L 2.5 15.5
            C 1.4 15.5, 0.5 14.6, 0.5 13.5
            L 0.5 2.5
            C 0.5 1.4, 1.4 0.5, 2.5 0.5
            Z
          "
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dashed perforation between top and bottom notches */}
        <line
          x1="13"
          y1="4.5"
          x2="13"
          y2="11.5"
          stroke="#FFFFFF"
          strokeWidth="1.6"
          strokeDasharray="1.5 2"
          strokeLinecap="round"
          opacity="0.9"
        />
      </g>
    </svg>
  );
}

export function BrandLogo({
  size = 'md',
  theme = 'light',
  showSubtitle = true,
  link = true,
  className = '',
  onClick,
}: BrandLogoProps) {
  // Proportions matching the reference image across size variants
  const sizeMap = {
    sm: {
      iconSize: 34,
      titleSize: 'text-lg',
      subSize: 'text-[8.5px]',
      dotSize: 'w-1.5 h-1.5',
      gap: 'gap-2.5',
      letterSpacing: 'tracking-[0.18em]',
    },
    md: {
      iconSize: 44,
      titleSize: 'text-2xl',
      subSize: 'text-[10px]',
      dotSize: 'w-2 h-2',
      gap: 'gap-3',
      letterSpacing: 'tracking-[0.22em]',
    },
    lg: {
      iconSize: 54,
      titleSize: 'text-3xl sm:text-4xl',
      subSize: 'text-xs',
      dotSize: 'w-2.5 h-2.5',
      gap: 'gap-4',
      letterSpacing: 'tracking-[0.24em]',
    },
    xl: {
      iconSize: 68,
      titleSize: 'text-4xl sm:text-5xl',
      subSize: 'text-sm',
      dotSize: 'w-3 h-3',
      gap: 'gap-5',
      letterSpacing: 'tracking-[0.25em]',
    },
  }[size];

  const textColor = theme === 'dark' ? 'text-white' : 'text-[#0B132B]';
  const subColor = theme === 'dark' ? 'text-slate-400' : 'text-[#4A5568]';

  const content = (
    <div
      onClick={onClick}
      className={`inline-flex items-center ${sizeMap.gap} select-none group transition-transform duration-200 ${className}`}
    >
      {/* App Icon Squircle */}
      <div className="shrink-0 group-hover:scale-105 transition-transform duration-200">
        <BrandLogoIcon size={sizeMap.iconSize} />
      </div>

      {/* Typography Block */}
      <div className="flex flex-col justify-center leading-none">
        {/* Brand Name "EVENTRA." */}
        <div className="flex items-baseline gap-0.5">
          <span
            className={`font-serif font-black tracking-[-0.02em] ${sizeMap.titleSize} ${textColor} group-hover:text-brand-600 transition-colors`}
            style={{
              fontFamily: "'Playfair Display', Georgia, Cambria, 'Times New Roman', serif",
              fontWeight: 900,
            }}
          >
            EVENTRA
          </span>
          {/* Distinct Coral/Orange Dot */}
          <span
            className={`${sizeMap.dotSize} rounded-full bg-[#FF6B00] inline-block shrink-0 mb-0.5 transition-transform group-hover:scale-125`}
            aria-hidden="true"
          />
        </div>

        {/* Subtitle "DISCOVERY & TICKETING" */}
        {showSubtitle && (
          <span
            className={`${sizeMap.subSize} uppercase font-extrabold ${subColor} ${sizeMap.letterSpacing} mt-1`}
            style={{
              fontFamily:
                "var(--font-inter), system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            }}
          >
            DISCOVERY & TICKETING
          </span>
        )}
      </div>
    </div>
  );

  if (link) {
    return (
      <Link href="/" aria-label="EVENTRA — Discovery & Ticketing Homepage">
        {content}
      </Link>
    );
  }

  return content;
}

export default BrandLogo;
