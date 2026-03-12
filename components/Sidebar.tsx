'use client'

import React from 'react'
import { sidebarLinks } from '@/constants'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { useUser } from "@clerk/nextjs";

type AppRole = "STUDENT" | "TEACHER_ADMIN";

const GroupsIcon = ({
  className,
  style,
}: {
  className?: string
  style?: React.CSSProperties
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={style}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.8}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
    />
  </svg>
)

const Sidebar = () => {
  const pathname = usePathname()
    const { user } = useUser();
  const role = (user?.publicMetadata?.role as AppRole | undefined) ?? undefined;

  const visibleLinks = sidebarLinks.filter((link) => {
    if (!link.roles) return true;
    if (!role) return false;
    return link.roles.includes(role);
  });

  return (
    <section
      className="sticky left-0 top-0 flex h-screen w-fit flex-col pt-[72px] max-sm:hidden lg:w-60"
      style={{
        background: '#1e2d40',
        borderRight: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Nav links */}
      <nav className="flex flex-col gap-1 px-3 py-5 flex-1">
        {visibleLinks.map((link) => {
            const isActive =
            link.route === '/'
              ? pathname === '/'
              : pathname === link.route || pathname.startsWith(link.route + '/')

          const isGroups = link.route === '/teacher/groups'

          return (
            <Link
              href={link.route}
              key={link.label}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3.5 py-2.5 transition-all duration-150 group relative',
              )}
              style={
                isActive
                  ? {
                    background: 'rgba(79,142,247,0.18)',
                    boxShadow: 'inset 3px 0 0 #4f8ef7',
                  }
                  : {}
              }
              onMouseEnter={(e) => {
                if (!isActive) {
                  ; (e.currentTarget as HTMLElement).style.background =
                    'rgba(255,255,255,0.06)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  ; (e.currentTarget as HTMLElement).style.background = ''
                }
              }}
            >
              {/* Icon */}
              <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                {isGroups ? (
                  <GroupsIcon
                    className="h-[18px] w-[18px]"
                    style={
                      {
                        color: isActive ? '#4f8ef7' : 'rgba(203,213,225,0.55)',
                      } as React.CSSProperties
                    }
                  />
                ) : (
                  <Image
                    src={link.imgUrl}
                    alt={link.label}
                    width={18}
                    height={18}
                    className={cn(
                      'transition-all',
                      isActive ? 'brightness-[10] saturate-0' : 'brightness-[4] saturate-0 opacity-55',
                    )}
                  />
                )}
              </div>

              {/* Label */}
              <span
                className="text-[13.5px] font-medium max-lg:hidden transition-colors"
                style={{
                  color: isActive ? '#e2eaf8' : 'rgba(203,213,225,0.6)',
                }}
              >
                {link.label}
              </span>

              {/* Active accent dot (icon-only mode) */}
              {isActive && (
                <span className="absolute right-2 h-1.5 w-1.5 rounded-full bg-[#4f8ef7] lg:hidden" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom subtle label */}
      <div className="px-5 pb-5 max-lg:hidden">
        <p className="text-[11px] text-white/15 font-medium uppercase tracking-widest">
          Hello English Platform
        </p>
      </div>
    </section>
  )
}

export default Sidebar