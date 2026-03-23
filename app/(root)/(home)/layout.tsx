import React, { ReactNode } from 'react'


import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Hello English",
  description: "Platformă pentru lecții video, grupe și resurse educaționale",
  icons:{
    icon: '/icons/logo.svg'
  }
};

const HomeLayout = ({children}: {children: ReactNode}) => {
  return (
    <main className='relative min-h-screen'>
        <Navbar/>
        <Sidebar/>

        <section className="min-h-screen bg-dark-2 pt-[57px] sm:pl-[88px] lg:pl-60">
            <div className="w-full px-6 pb-6 pt-10 max-md:pb-14 sm:px-14">
              {children}
            </div>
        </section>
    </main>
  )
}

export default HomeLayout
