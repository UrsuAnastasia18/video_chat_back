import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import React from 'react'

export default function TeacherLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <main className="relative min-h-screen" style={{ background: 'var(--color-content-bg)' }}>
            <Navbar />
            <Sidebar />

            <section
                className="min-h-screen pt-[57px] sm:pl-[88px] lg:pl-60"
                style={{ background: 'var(--color-content-bg)' }}
            >
                <div className="min-h-[calc(100vh-57px)] px-7 py-7 sm:px-10 sm:py-8">
                    {children}
                </div>
            </section>
        </main>
    )
}
