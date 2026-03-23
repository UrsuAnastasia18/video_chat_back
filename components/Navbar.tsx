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
        background: '#1e2d40',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 2px 16px rgba(0,0,0,0.2)',
      }}
    >
      {/* Logo + Brand */}
      <Link href="/" className="flex items-center gap-3">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden shrink-0"
          style={{
            background: 'rgba(79,142,247,0.15)',
            border: '1px solid rgba(79,142,247,0.3)',
          }}
        >
          <Image
            src="/icons/logo.svg"
            width={22}
            height={22}
            alt="Logo Hello English"
          />
        </div>
        <div className="flex items-baseline gap-1.5 max-sm:hidden">
          <span className="text-[20px] font-bold text-white tracking-tight leading-none">
            Hello
          </span>
          <span
            className="text-[20px] font-bold tracking-tight leading-none"
            style={{ color: '#4f8ef7' }}
          >
            English
          </span>
        </div>
      </Link>

      {/* Right */}
      <div className="flex items-center gap-4">
        <SignedIn>
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'h-8 w-8',
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
