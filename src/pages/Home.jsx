import React, {useEffect, useState} from 'react'
import { Link } from 'react-router-dom'
import { fetchSubjects } from '../services/firebase'
import HomeHeroScene from '../components/HomeHeroScene'
import { motion } from 'framer-motion'

export default function Home(){
  const [subjects, setSubjects] = useState([])
  useEffect(()=>{fetchSubjects().then(setSubjects).catch(()=>{})},[])

  return (
    <div className="relative -mx-4 md:-mx-8" style={{ marginTop: 'calc((var(--app-header-height, 5rem) + 0.75rem) * -1)' }}>
      <section className="relative min-h-[100svh] overflow-hidden">
        <HomeHeroScene />

        <div className="relative z-10 flex min-h-[100svh] items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
          <div className="mx-auto flex w-full max-w-5xl flex-col items-center text-center">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="mb-6 flex flex-wrap items-center justify-center gap-2"
            >
              {(subjects.length ? subjects.slice(0, 4) : [{ title: 'Biology' }, { title: 'Science' }]).map((subject, index) => (
                <span key={`${subject.id || subject.title}-${index}`} className="rounded-full border border-white/10 bg-black/30 px-4 py-1.5 text-[11px] uppercase tracking-[0.28em] text-white/70 backdrop-blur-md">
                  {subject.title}
                </span>
              ))}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.04 }}
              className="max-w-4xl text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl md:text-7xl"
            >
              Explore 3D Learning in a cinematic, futuristic space.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.12 }}
              className="mt-5 max-w-2xl text-sm leading-7 text-white/68 sm:text-base"
            >
              Interactive 3D models, immersive lessons, and monochrome sci-fi visuals designed to feel expansive and elegant.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.18 }}
              className="mt-8 flex flex-wrap items-center justify-center gap-3"
            >
              <Link to="/subject/biology" className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm text-white/80 transition hover:bg-white/[0.07] hover:text-white">
                Enter Biology
              </Link>
              <Link to="/admin" className="rounded-full border border-white/10 bg-black/30 px-5 py-2.5 text-sm text-white/65 transition hover:bg-white/[0.05] hover:text-white">
                Manage Content
              </Link>
            </motion.div>

            <div className="mt-14 flex flex-wrap items-center justify-center gap-3">
              {(subjects.length ? subjects.slice(0, 6) : [{ title: 'Biology', slug: 'biology' }, { title: 'Science', slug: 'science' }]).map(subject => (
                <Link
                  key={subject.id || subject.slug || subject.title}
                  to={`/subject/${subject.slug}`}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/70 backdrop-blur-md transition hover:bg-white/[0.06] hover:text-white hover:shadow-[0_0_20px_rgba(255,255,255,0.06)]"
                >
                  {subject.title}
                </Link>
              ))}
              {!subjects.length ? (
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/55 backdrop-blur-md">
                  No subjects yet. Visit Admin to add content.
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
