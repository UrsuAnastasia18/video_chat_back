import React from 'react';
import Image from 'next/image';

interface HomeCardProps {
  className: string;
  img: string;
  title: string;
  description: string;
  handleClick: () => void;
}

// Map the old bg-* class names to new academic-style tokens
const CARD_THEMES: Record<string, { bg: string; border: string; accent: string; iconBg: string; iconRing: string }> = {
  'bg-orange-1': {
    bg: '#ffffff',
    border: 'rgba(79,142,247,0.22)',
    accent: '#4f8ef7',
    iconBg: 'rgba(79,142,247,0.16)',
    iconRing: 'rgba(79,142,247,0.26)',
  },
  'bg-blue-1': {
    bg: '#ffffff',
    border: 'rgba(129,140,248,0.22)',
    accent: '#818cf8',
    iconBg: 'rgba(129,140,248,0.16)',
    iconRing: 'rgba(129,140,248,0.26)',
  },
  'bg-purple-1': {
    bg: '#ffffff',
    border: 'rgba(16,185,129,0.22)',
    accent: '#10b981',
    iconBg: 'rgba(16,185,129,0.16)',
    iconRing: 'rgba(16,185,129,0.26)',
  },
  'bg-yellow-1': {
    bg: '#ffffff',
    border: 'rgba(245,158,11,0.22)',
    accent: '#f59e0b',
    iconBg: 'rgba(245,158,11,0.16)',
    iconRing: 'rgba(245,158,11,0.26)',
  },
};

const DEFAULT_THEME = {
  bg: '#ffffff',
  border: 'rgba(79,142,247,0.2)',
  accent: '#4f8ef7',
  iconBg: 'rgba(79,142,247,0.16)',
  iconRing: 'rgba(79,142,247,0.26)',
};

const HomeCard = ({ className, img, title, description, handleClick }: HomeCardProps) => {
  // Extract the bg-* class to determine theme
  const themeKey = className
    .split(' ')
    .find((c) => c.startsWith('bg-')) ?? '';
  const theme = CARD_THEMES[themeKey] ?? DEFAULT_THEME;

  return (
    <div
      className="flex cursor-pointer flex-col justify-between rounded-2xl p-5 transition-all duration-200"
      style={{
        background: theme.bg,
        border: `1px solid ${theme.border}`,
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        minHeight: '180px',
      }}
      onClick={handleClick}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 20px ${theme.accent}22`;
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLElement).style.borderColor = theme.accent + '55';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)';
        (e.currentTarget as HTMLElement).style.transform = '';
        (e.currentTarget as HTMLElement).style.borderColor = theme.border;
      }}
    >
      {/* Icon */}
      <div
        className="flex h-12 w-12 items-center justify-center rounded-xl"
        style={{
          background: theme.iconBg,
          border: `1px solid ${theme.iconRing}`,
          boxShadow: `0 6px 16px ${theme.accent}1f`,
        }}
      >
        <Image
          src={img}
          alt={title}
          width={22}
          height={22}
          className="opacity-95 brightness-[7] saturate-0"
        />
      </div>

      {/* Text */}
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-bold" style={{ color: '#1e293b' }}>
          {title}
        </h3>
        <p className="text-sm" style={{ color: '#94a3b8' }}>
          {description}
        </p>
      </div>
    </div>
  );
};

export default HomeCard;
