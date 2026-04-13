import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { SignedIn, UserButton } from '@clerk/nextjs'
import MobileNav from './MobileNav'

const Navbar = () => {
  return (
    <nav
      className="flex-between fixed z-50 w-full px-6 py-3.5 lg:px-10"
      style={{
        background: 'rgba(255,255,255,0.92)',
        borderBottom: '1px solid rgba(234,223,235,0.95)',
        boxShadow: '0 12px 34px rgba(58,36,72,0.08)',
        backdropFilter: 'blur(16px)',
      }}
    >
      <Link href="/" className="flex items-center gap-3">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden shrink-0"
          style={{
            background: '#ffe48c',
            border: '1px solid rgba(246,164,58,0.28)',
            boxShadow: '0 8px 20px rgba(246,181,70,0.22)',
          }}
        >
          <Image
            src="/icons/logo.svg"
            width={22}
            height={22}
            alt="Logo Hello English"
            className="brightness-0"
          />
        </div>
        <div className="flex items-baseline gap-1.5 max-sm:hidden">
          <span className="text-[20px] font-bold tracking-tight leading-none text-[#17141f]">
            Hello
          </span>
          <span
            className="text-[20px] font-bold tracking-tight leading-none"
            style={{ color: '#df6f98' }}
          >
            English
          </span>
        </div>
      </Link>

      <div className="flex items-center gap-4">
        <SignedIn>
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'h-8 w-8 ring-2 ring-[#f3a9c2]',
              },
            }}
          />
        </SignedIn>
        <MobileNav />
      </div>
    </nav>
  )
}

export default Navbar
