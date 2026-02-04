import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { SignedIn, UserButton } from '@clerk/nextjs'
import MobileNav from './MobileNav'

const Navbar = () => {
  return (
    //pe aceasta linie de mai jos modific dimensiunile navbarului
    //mai jos la image adaug imaginea logoului sus pe stanga
    //in tagul p adaug numele aplicatiei si se putea de pus si max-sm:hidden tipa pe versiune mobile sa nu se vada titlu
    <nav className='flex flex-between z-50 w-full bg-amber-400 px-6 py-4 lg:px-10'>
      <Link href="/" className="flex items-center gap-1">
        <Image
        src="/icons/logo.svg"
        width={32}
        height={32}
        alt="English logo"
        className='max-sm:size-10'
        />
        <p className="text-[26px] font-extrabold text-amber-950 ">Hello English</p>
      </Link>
      
      <div className="flex-between gap-5">
        <SignedIn>
          <UserButton />
        </SignedIn>
        <MobileNav />
      </div>
    </nav>
  )
}

export default Navbar


