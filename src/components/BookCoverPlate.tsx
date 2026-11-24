import React from 'react';
import { Book } from '../types/library';

interface BookCoverPlateProps {
  book: Pick<Book, 'title' | 'author' | 'publisher' | 'callNumber' | 'coverTone' | 'coverMotif' | 'year'>;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const TONE_MAP: Record<
  Book['coverTone'],
  { bg: string; band: string; accent: string; ink: string; mutedInk: string }
> = {
  indigo: {
    bg: '#1e2b6f',
    band: '#24389c',
    accent: '#bac3ff',
    ink: '#ffffff',
    mutedInk: '#cacfff',
  },
  slate: {
    bg: '#334155',
    band: '#1e293b',
    accent: '#cbd5e1',
    ink: '#f8fafc',
    mutedInk: '#cbd5e1',
  },
  burgundy: {
    bg: '#5c1d28',
    band: '#3d1018',
    accent: '#f5ccd3',
    ink: '#ffffff',
    mutedInk: '#e8bfc6',
  },
  forest: {
    bg: '#1e4235',
    band: '#142d24',
    accent: '#b7decb',
    ink: '#ffffff',
    mutedInk: '#c4dfd2',
  },
  ochre: {
    bg: '#6e501f',
    band: '#4a3513',
    accent: '#f2dfb8',
    ink: '#ffffff',
    mutedInk: '#e8d7b7',
  },
  obsidian: {
    bg: '#191c1e',
    band: '#2d3133',
    accent: '#d0e1fb',
    ink: '#ffffff',
    mutedInk: '#c5c5d4',
  },
};

export const BookCoverPlate: React.FC<BookCoverPlateProps> = ({
  book,
  size = 'md',
  className = '',
}) => {
  const palette = TONE_MAP[book.coverTone];

  if (size === 'sm') {
    return (
      <div
        className={`relative aspect-[3/4] w-10 shrink-0 overflow-hidden rounded border border-[#c5c5d4]/70 select-none ${className}`}
        style={{ backgroundColor: palette.bg }}
        aria-hidden="true"
      >
        <div
          className="absolute inset-y-0 left-0 w-1.5 opacity-45"
          style={{ backgroundColor: palette.band }}
        />
        <div className="flex h-full flex-col justify-between p-1.5 pl-2.5">
          <div className="h-1 w-4 rounded-xs opacity-80" style={{ backgroundColor: palette.accent }} />
          <div className="space-y-0.5">
            <div className="h-1 w-full rounded-xs opacity-90" style={{ backgroundColor: palette.ink }} />
            <div className="h-1 w-3/4 rounded-xs opacity-70" style={{ backgroundColor: palette.mutedInk }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative aspect-[3/4] w-full overflow-hidden rounded border border-[#c5c5d4]/80 select-none ${className}`}
      style={{ backgroundColor: palette.bg }}
    >
      {/* Realistic Left Spine Crease */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-3 border-r border-white/10"
        style={{ backgroundColor: palette.band }}
      />

      {/* Archival Geometric Artwork */}
      <svg
        viewBox="0 0 180 240"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-25"
        aria-hidden="true"
      >
        {book.coverMotif === 'grid' && (
          <g stroke={palette.accent} strokeWidth="1" fill="none">
            <line x1="36" y1="0" x2="36" y2="240" />
            <line x1="84" y1="0" x2="84" y2="240" />
            <line x1="132" y1="0" x2="132" y2="240" />
            <line x1="18" y1="60" x2="180" y2="60" />
            <line x1="18" y1="120" x2="180" y2="120" />
            <line x1="18" y1="180" x2="180" y2="180" />
            <rect x="84" y="120" width="48" height="60" fill={palette.accent} fillOpacity="0.25" />
          </g>
        )}
        {book.coverMotif === 'geometric' && (
          <g stroke={palette.accent} strokeWidth="1.25" fill="none">
            <circle cx="115" cy="145" r="44" />
            <circle cx="115" cy="145" r="24" />
            <line x1="40" y1="145" x2="165" y2="145" />
            <line x1="115" y1="90" x2="115" y2="205" />
          </g>
        )}
        {book.coverMotif === 'archival' && (
          <g stroke={palette.accent} strokeWidth="1" fill="none">
            <rect x="28" y="24" width="136" height="192" />
            <rect x="34" y="30" width="124" height="180" />
            <path d="M55 180 L95 110 L135 180 Z" />
          </g>
        )}
        {book.coverMotif === 'monograph' && (
          <g fill={palette.accent}>
            <rect x="28" y="132" width="136" height="2" />
            <rect x="28" y="140" width="96" height="1.5" />
            <rect x="28" y="147" width="120" height="1.5" />
            <rect x="28" y="154" width="76" height="1.5" />
          </g>
        )}
        {book.coverMotif === 'typographic' && (
          <g stroke={palette.accent} strokeWidth="1" fill="none">
            <circle cx="128" cy="158" r="36" />
            <rect x="36" y="122" width="60" height="72" />
          </g>
        )}
        {book.coverMotif === 'botanical' && (
          <g stroke={palette.accent} strokeWidth="1.2" fill="none">
            <path d="M98 205 C98 150 120 128 148 110" />
            <path d="M98 175 C76 160 66 142 62 124" />
            <path d="M98 152 C118 140 132 142 144 152" />
            <circle cx="148" cy="110" r="8" />
            <circle cx="62" cy="124" r="6" />
          </g>
        )}
      </svg>

      {/* Cover Typography */}
      <div
        className={`relative flex h-full flex-col justify-between ${
          size === 'lg' ? 'p-5 pl-7' : 'p-3.5 pl-5'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span
            className="truncate font-mono text-[9px] tracking-wider uppercase opacity-85"
            style={{ color: palette.mutedInk }}
          >
            {book.publisher}
          </span>
          <span
            className="font-mono text-[9px] tabular-nums opacity-75"
            style={{ color: palette.mutedInk }}
          >
            {book.year}
          </span>
        </div>

        <div className="my-auto py-2">
          <div
            className={`font-semibold leading-snug tracking-tight ${
              size === 'lg' ? 'text-base line-clamp-4' : 'text-[13px] line-clamp-3'
            }`}
            style={{ color: palette.ink }}
          >
            {book.title}
          </div>
          <div
            className={`mt-1.5 truncate ${size === 'lg' ? 'text-xs' : 'text-[11px]'}`}
            style={{ color: palette.mutedInk }}
          >
            {book.author}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-white/15 pt-2">
          <span
            className="truncate font-mono text-[9px] tabular-nums opacity-85"
            style={{ color: palette.accent }}
          >
            {book.callNumber}
          </span>
        </div>
      </div>
    </div>
  );
};
