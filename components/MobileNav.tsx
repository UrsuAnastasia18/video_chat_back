"use client"
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { sidebarLinks } from "@/constants"
import { cn } from "@/lib/utils"
import { useUser } from "@clerk/nextjs"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import React from "react"

type AppRole = "STUDENT" | "TEACHER_ADMIN";
const studentHiddenRoutes = new Set(["/upcoming", "/previous"]);

const MobileNav = () => {
  const pathname = usePathname();
  const { user } = useUser();
  const role = (user?.publicMetadata?.role as AppRole | undefined) ?? undefined;
  const visibleLinks = sidebarLinks.filter((link) => {
    if (role === "STUDENT" && studentHiddenRoutes.has(link.route)) return false;
    if (!link.roles) return true;
    if (!role) return false;
    return link.roles.includes(role);
  });

  return (
    <section className="w-full max-w-[264px]">
      <Sheet>
        <SheetTrigger asChild>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f4f0ff] text-[#9697f3] shadow-[0_8px_20px_rgba(58,36,72,0.08)] sm:hidden"
            aria-label="Deschide meniul"
          >
            <span className="flex flex-col gap-1">
              <span className="block h-0.5 w-5 rounded-full bg-current" />
              <span className="block h-0.5 w-5 rounded-full bg-current" />
              <span className="block h-0.5 w-5 rounded-full bg-current" />
            </span>
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="border-none bg-[#fbf6f1] text-[#17141f]">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ffe48c] text-lg font-black shadow-[0_10px_24px_rgba(246,181,70,0.24)]">
              H
            </div>
            <div>
              <p className="text-[22px] font-black leading-none">Hello English</p>
              <p className="mt-1 text-xs font-bold text-[#df6f98]">club pentru copii</p>
            </div>
          </Link>
          <div className="flex h-[calc(100vh-72px)] flex-col justify-between overflow-y-auto">
            <SheetClose asChild>
              <section className="flex h-full flex-col gap-3 pt-14">
                {visibleLinks.map((link) => {
                  const isActive =
                    link.route === "/"
                      ? pathname === "/"
                      : pathname === link.route || pathname.startsWith(link.route + "/");

                  return (
                    <SheetClose asChild key={link.route}>
                      <Link
                        href={link.route}
                        key={link.label}
                        className={cn("flex w-full max-w-60 items-center gap-4 rounded-2xl p-4 text-[#75697c]", {
                          "bg-[#ffe6ef] text-[#17141f] shadow-[0_12px_24px_rgba(223,111,152,0.12)]": isActive,
                        })}
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white">
                          <Image
                            src={link.imgUrl}
                            alt={link.label}
                            width={20}
                            height={20}
                            className="h-5 w-5 object-contain opacity-80"
                            style={{ filter: 'brightness(0) saturate(100%)' }}
                          />
                        </span>
                        <p className="font-bold">{link.label}</p>
                      </Link>
                    </SheetClose>
                  )
                })}
              </section>
            </SheetClose>
          </div>
        </SheetContent>
      </Sheet>
    </section>
  )
}

export default MobileNav
