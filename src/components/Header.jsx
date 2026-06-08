import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'

export default function Header({onSearchClick, hidden = false}){
  return (
    <div className="px-3 pt-3 sm:pt-4">
      <motion.header
        initial={{ y: -18, opacity: 0, scale: 0.985 }}
        animate={hidden ? { y: -54, opacity: 0, scale: 0.97 } : { y: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className={`mx-auto w-[min(100%,70rem)] rounded-full border border-white/10 bg-[rgba(8,8,8,0.68)] px-3 py-2 text-white shadow-[0_18px_60px_rgba(0,0,0,0.38),0_0_18px_rgba(255,255,255,0.03)] backdrop-blur-2xl transition-all duration-300 ease-out ${hidden ? '-translate-y-[120%] opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
          <div className="flex items-center justify-start gap-2 sm:gap-3">
            <Link to="/" className="flex items-center gap-2.5 rounded-full px-2 py-1 transition hover:bg-white/[0.03]">
              <span className="text-sm font-medium tracking-[0.04em] text-white sm:text-[15px]">AI 3D Learning Platform</span>
            </Link>
          </div>

          <nav className="hidden items-center justify-center gap-3 md:flex">
            {[
              { to: '/', label: 'Home' },
              { to: '/subject/biology', label: 'Subjects' },
              { to: '/admin', label: 'Admin' }
            ].map(link => (
              <Link
                key={link.to}
                to={link.to}
                className="rounded-full px-4 py-2 text-sm text-white/65 transition duration-200 hover:bg-white/[0.04] hover:text-white hover:shadow-[0_0_18px_rgba(255,255,255,0.08)]"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={onSearchClick}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.03] text-white/70 transition duration-200 hover:bg-white/[0.06] hover:text-white hover:shadow-[0_0_18px_rgba(255,255,255,0.08)]"
              aria-label="Open search"
            >
              <Search className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <nav className="mt-3 flex items-center justify-center gap-2 overflow-x-auto pb-0.5 md:hidden">
          {[
            { to: '/', label: 'Home' },
            { to: '/subject/biology', label: 'Subjects' },
            { to: '/admin', label: 'Admin' }
          ].map(link => (
            <Link
              key={link.to}
              to={link.to}
              className="whitespace-nowrap rounded-full border border-white/8 bg-white/[0.02] px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] text-white/60 transition hover:bg-white/[0.05] hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </motion.header>
    </div>
  )
}
