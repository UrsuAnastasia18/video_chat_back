'use client'

import { sidebarLinks } from '@/constants'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { useUser } from '@clerk/nextjs'

type AppRole = 'STUDENT' | 'TEACHER_ADMIN';
const studentHiddenRoutes = new Set(['/upcoming', '/previous']);

const Sidebar = () => {
  const pathname = usePathname()
  const { user } = useUser();
  const role = (user?.publicMetadata?.role as AppRole | undefined) ?? undefined;

  const visibleLinks = sidebarLinks.filter((link) => {
    if (role === 'STUDENT' && studentHiddenRoutes.has(link.route)) return false;
    if (!link.roles) return true;
    if (!role) return false;
    return link.roles.includes(role);
  });

  return (
    <section
      className="fixed left-0 top-[57px] z-40 hidden h-[calc(100vh-57px)] w-[88px] flex-col overflow-y-auto sm:flex lg:w-60"
      style={{
        background: 'linear-gradient(180deg, #ffffff 0%, #fff8f1 100%)',
        borderRight: '1px solid rgba(234,223,235,0.95)',
        boxShadow: '12px 0 34px rgba(58,36,72,0.06)',
      }}
    >
      <nav className="flex flex-1 flex-col gap-2 px-3 py-5">
        {visibleLinks.map((link) => {
          const isActive =
            link.route === '/'
              ? pathname === '/'
              : pathname === link.route || pathname.startsWith(link.route + '/')

          return (
            <Link
              href={link.route}
              key={link.label}
              className={cn(
                'group relative flex items-center gap-3 rounded-2xl px-3.5 py-3 transition-all duration-150',
              )}
              style={
                isActive
                  ? {
                    background: '#ffe6ef',
                    boxShadow: '0 12px 24px rgba(223,111,152,0.14)',
                    border: '1px solid rgba(223,111,152,0.24)',
                  }
                  : {
                    border: '1px solid transparent',
                  }
              }
              onMouseEnter={(e) => {
                if (!isActive) {
                  ; (e.currentTarget as HTMLElement).style.background =
                    '#fff2bf'
                  ; (e.currentTarget as HTMLElement).style.borderColor =
                    'rgba(246,164,58,0.22)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  ; (e.currentTarget as HTMLElement).style.background = ''
                  ; (e.currentTarget as HTMLElement).style.borderColor = 'transparent'
                }
              }}
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                style={{
                  background: isActive ? '#ffffff' : '#f4f0ff',
                }}
              >
                <Image
                  src={link.imgUrl}
                  alt={link.label}
                  width={20}
                  height={20}
                  className={cn(
                    'h-5 w-5 object-contain transition-all',
                    isActive ? 'opacity-95' : 'opacity-75',
                  )}
                />
              </div>

              <span
                className="text-[13.5px] font-bold transition-colors max-lg:hidden"
                style={{
                  color: isActive ? '#17141f' : '#75697c',
                }}
              >
                {link.label}
              </span>

              {isActive && (
                <span className="absolute right-2 h-2 w-2 rounded-full bg-[#df6f98] lg:hidden" />
              )}
            </Link>
          )
        })}
      </nav>

      
    </section>
  )
}

export default Sidebar
