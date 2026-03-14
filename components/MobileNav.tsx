"use client"
import{
    Sheet, SheetClose, SheetContent, SheetTrigger} from "@/components/ui/sheet"
import { sidebarLinks } from "@/constants"
import { cn } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useUser } from "@clerk/nextjs";


import React from 'react'
type AppRole = "STUDENT" | "TEACHER_ADMIN";

const MobileNav = () => {
  const pathname = usePathname();
   const { user } = useUser();
  const role = (user?.publicMetadata?.role as AppRole | undefined) ?? undefined;
  const visibleLinks = sidebarLinks.filter((link) => {
    if (!link.roles) return true;
    if (!role) return false;
    return link.roles.includes(role);
  });

  return (
    <section className="w-full max-w-[264px]">
    <Sheet>
      <SheetTrigger asChild> 
        <Image
        src="/icons/hamburger.svg"
        width={36}
        height={36}
        alt="hamburger icon"
        className="cursor-pointer sm:hidden"
        />
      </SheetTrigger>
        <SheetContent side="left" className="border-none bg-amber-400">
          
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
          <div className="flex h-[calc(100vh-72px)] flex-col justify-between overflow-y-auto">
            <SheetClose asChild>
              <section className='flex h-full flex-col gap-6 pt-16 text-amber-950'>
                {visibleLinks.map((link) => {
                  const isActive =
                  link.route === "/"
                  ? pathname === "/"
                  : pathname === link.route || pathname.startsWith(link.route + "/");
          
                   return(
                    <SheetClose asChild key={link.route}>
                    <Link
                      href={link.route}
                      key={link.label}
                      className={cn('flex gap-4 items-center p-4 rounded-lg w-full max-w-60',{
                        'bg-amber-300': isActive,
                    })}
                    >
                    <Image
                      src={link.imgUrl}
                      alt={link.label}
                      width={20}
                      height={20}
                    />
                      <p className="font-semibold">
                      {link.label}
                      </p>
                    </Link>
                    </SheetClose>
              )
               })}
              </section>
            </SheetClose>
          </div>
        </SheetContent>
    </Sheet>
    </section >
  )
}

export default MobileNav