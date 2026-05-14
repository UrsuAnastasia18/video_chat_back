import React from 'react';
import Image from 'next/image';

interface HomeCardProps {
  className: string;
  img: string;
  title: string;
  description: string;
  handleClick: () => void;
}

const CARD_THEMES: Record<string, { bg: string; border: string; accent: string; iconBg: string; iconRing: string }> = {
  'bg-orange-1': {
    bg: '#ffffff',
    border: 'rgba(246,164,58,0.26)',
    accent: '#f6a43a',
    iconBg: '#fff0bf',
    iconRing: 'rgba(246,164,58,0.38)',
  },
  'bg-blue-1': {
    bg: '#ffffff',
    border: 'rgba(150,151,243,0.32)',
    accent: '#9697f3',
    iconBg: '#ededff',
    iconRing: 'rgba(150,151,243,0.36)',
  },
  'bg-purple-1': {
    bg: '#ffffff',
    border: 'rgba(243,169,194,0.42)',
    accent: '#df6f98',
    iconBg: '#ffe6ef',
    iconRing: 'rgba(223,111,152,0.34)',
  },
  'bg-yellow-1': {
    bg: '#ffffff',
    border: 'rgba(255,228,140,0.9)',
    accent: '#f2bc2f',
    iconBg: '#fff4c9',
    iconRing: 'rgba(242,188,47,0.36)',
  },
};

const DEFAULT_THEME = {
  bg: '#ffffff',
  border: 'rgba(243,169,194,0.32)',
  accent: '#df6f98',
  iconBg: '#ffe6ef',
  iconRing: 'rgba(223,111,152,0.32)',
};

const HomeCard = ({ className, img, title, description, handleClick }: HomeCardProps) => {
  const themeKey = className
    .split(' ')
    .find((c) => c.startsWith('bg-')) ?? '';
  const theme = CARD_THEMES[themeKey] ?? DEFAULT_THEME;

  return (
    <div
      className="relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-[22px] p-5 transition-all duration-200"
      style={{
        background: theme.bg,
        border: `1px solid ${theme.border}`,
        boxShadow: '0 14px 32px rgba(58,36,72,0.08)',
        minHeight: '190px',
      }}
      onClick={handleClick}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = `0 20px 42px ${theme.accent}2e`;
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-5px) rotate(-0.35deg)';
        (e.currentTarget as HTMLElement).style.borderColor = `${theme.accent}88`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 14px 32px rgba(58,36,72,0.08)';
        (e.currentTarget as HTMLElement).style.transform = '';
        (e.currentTarget as HTMLElement).style.borderColor = theme.border;
      }}
    >
      <span
        className="absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-55"
        style={{ background: theme.iconBg }}
      />
      <span
        className="absolute right-6 top-8 h-3 w-3 rounded-full"
        style={{ background: theme.accent }}
      />
      <span
        className="absolute bottom-5 right-6 h-2 w-16 rotate-[-6deg] rounded-full opacity-70"
        style={{ background: theme.accent }}
      />

      <div
        className="relative flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{
          background: theme.iconBg,
          border: `1px solid ${theme.iconRing}`,
          boxShadow: `0 10px 22px ${theme.accent}20`,
        }}
      >
        <Image
          src={img}
          alt={title}
          width={22}
          height={22}
          className="opacity-95"
          style={{ width: '22px', height: '22px', filter: 'brightness(0) saturate(100%)' }}
        />
      </div>

      <div className="relative flex flex-col gap-2">
        <h3 className="text-lg font-black leading-tight" style={{ color: '#17141f' }}>
          {title}
        </h3>
        <p className="text-sm font-medium leading-5" style={{ color: '#75697c' }}>
          {description}
        </p>
      </div>
    </div>
  );
};

export default HomeCard;
