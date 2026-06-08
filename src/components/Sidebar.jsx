import React, {useEffect, useState} from 'react'
import { Link, useLocation } from 'react-router-dom'
import { fetchSubjects, fetchTopicsBySubject } from '../services/firebase'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu } from 'lucide-react'

export default function Sidebar({ open=false, onToggle, onClose }){
  const [subjects, setSubjects] = useState([])
  const [topicsMap, setTopicsMap] = useState({})
  const location = useLocation()

  useEffect(()=>{
    let mounted = true
    fetchSubjects().then(async (subs)=>{
      if(!mounted) return
      setSubjects(subs)
      const map = {}
      for(const s of subs){
        try{
          const t = await fetchTopicsBySubject(s.id)
          map[s.id] = t
        }catch(e){
          console.error('Sidebar fetch topics error', e)
          map[s.id] = []
        }
      }
      if(mounted) setTopicsMap(map)
    }).catch(err=>{console.error('Sidebar fetchSubjects',err)})
    return ()=> mounted = false
  },[])

  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        className="fixed left-4 top-1/2 z-40 -translate-y-1/2 inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/65 text-white/75 shadow-[0_0_24px_rgba(255,255,255,0.04),0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-2xl transition duration-200 hover:bg-black/75 hover:text-white hover:shadow-[0_0_28px_rgba(255,255,255,0.08),0_12px_40px_rgba(0,0,0,0.45)]"
        aria-label={open ? 'Close contents' : 'Open contents'}
      >
        <Menu className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {open ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px]"
              onClick={onClose}
            />

            <motion.aside
              initial={{ x: -24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -24, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="fixed left-0 top-0 z-50 h-[100dvh] w-[min(86vw,20rem)] border-r border-white/10 bg-[rgba(7,10,20,0.82)] text-sm text-white shadow-[0_20px_80px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
            >
              <div className="flex h-full flex-col px-4 pb-4 pt-[calc(var(--app-header-height,5rem)+0.75rem)]">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-xs uppercase tracking-[0.28em] text-white/45">Contents</div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-white/60 transition hover:bg-white/[0.08] hover:text-white"
                  >
                    Close
                  </button>
                </div>

                <nav className="space-y-4 overflow-auto pr-1">
                  {subjects.map(s=> (
                    <div key={s.id} className="rounded-2xl border border-white/8 bg-white/[0.02] p-3">
                      <div className="mb-2 text-[11px] uppercase tracking-[0.24em] text-white/45">{s.title}</div>
                      <ul className="space-y-1">
                        {(topicsMap[s.id]||[]).map(t=> (
                          <li key={t.id}>
                            <Link
                              to={`/topic/${t.slug}`}
                              onClick={onClose}
                              className={`block rounded-xl px-3 py-2 text-white/70 transition hover:bg-white/[0.05] hover:text-white ${location.pathname===`/topic/${t.slug}`? 'bg-white/[0.06] text-white' : ''}`}
                            >
                              {t.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </nav>
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  )
}
