import React, { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, ArrowRight, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { fetchSubjects, fetchTopics } from '../services/firebase'

export default function SearchModal({ open, onClose }){
  const [query, setQuery] = useState('')
  const [subjects, setSubjects] = useState([])
  const [topics, setTopics] = useState([])
  const navigate = useNavigate()

  useEffect(()=>{
    if(!open) return

    let mounted = true
    Promise.all([fetchSubjects(), fetchTopics()])
      .then(([subjectResults, topicResults])=>{
        if(!mounted) return
        setSubjects(subjectResults)
        setTopics(topicResults)
      })
      .catch(err=>console.error('SearchModal fetch error', err))

    return ()=>{ mounted = false }
  }, [open])

  useEffect(()=>{
    if(!open) return
    const handleKeyDown = event => {
      if(event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return ()=> window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  useEffect(()=>{
    if(open) setQuery('')
  }, [open])

  const results = useMemo(()=>{
    const normalized = query.trim().toLowerCase()
    if(!normalized){
      return [
        ...subjects.slice(0, 4).map(subject => ({ type: 'subject', title: subject.title, subtitle: subject.description || 'Subject', path: `/subject/${subject.slug}` })),
        ...topics.slice(0, 6).map(topic => ({ type: 'topic', title: topic.title, subtitle: topic.summary || topic.description || 'Topic', path: `/topic/${topic.slug}` })),
      ]
    }

    const subjectMatches = subjects.filter(subject => {
      const haystack = `${subject.title} ${subject.description || ''} ${subject.slug || ''}`.toLowerCase()
      return haystack.includes(normalized)
    }).map(subject => ({ type: 'subject', title: subject.title, subtitle: subject.description || 'Subject', path: `/subject/${subject.slug}` }))

    const topicMatches = topics.filter(topic => {
      const haystack = `${topic.title} ${topic.summary || topic.description || ''} ${topic.slug || ''} ${topic.aiPrompt || ''} ${topic.visualType || ''}`.toLowerCase()
      return haystack.includes(normalized)
    }).map(topic => ({ type: 'topic', title: topic.title, subtitle: topic.summary || topic.description || 'Topic', path: `/topic/${topic.slug}` }))

    return [...subjectMatches, ...topicMatches].slice(0, 8)
  }, [query, subjects, topics])

  const handleSelect = path => {
    onClose()
    navigate(path)
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/55 px-4 pt-24 backdrop-blur-md sm:pt-28"
          onMouseDown={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.985 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="w-full max-w-2xl overflow-hidden rounded-[1.7rem] border border-white/10 bg-[rgba(8,8,8,0.92)] shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
            onMouseDown={event => event.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-white/8 px-4 py-4 sm:px-5">
              <Search className="h-4 w-4 text-white/45" />
              <input
                autoFocus
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Search subjects and topics"
                className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
              />
              <button type="button" onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white/45 transition hover:bg-white/5 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-auto p-2 sm:p-3">
              <div className="px-3 pb-2 text-[11px] uppercase tracking-[0.26em] text-slate-500">Search results</div>
              <div className="space-y-1">
                {results.length ? results.map(result => (
                  <button
                    key={`${result.type}-${result.path}`}
                    type="button"
                    onClick={()=>handleSelect(result.path)}
                    className="group flex w-full items-center justify-between gap-4 rounded-[1.1rem] px-3 py-3 text-left transition duration-200 hover:bg-white/[0.04]"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-white">{result.title}</div>
                      <div className="truncate text-xs text-slate-500">{result.type}</div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 transition group-hover:text-white/80">
                      <span className="hidden sm:inline truncate max-w-[16rem] text-right">{result.subtitle}</span>
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </div>
                  </button>
                )) : (
                  <div className="px-3 py-8 text-sm text-slate-500">No matching subjects or topics.</div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}