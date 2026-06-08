import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { askAssistant } from '../services/api'
import { useAssistantContext } from './AssistantContext'

function buildRouteContext(pathname = '') {
  const match = pathname.match(/^\/topic\/([^/]+)/i)
  if (match) {
    const topicSlug = match[1]
    return {
      subject: 'Biology',
      topic: topicSlug.charAt(0).toUpperCase() + topicSlug.slice(1),
      learningContext: `Support the learner on the ${topicSlug} topic page with concise, visual explanations.`
    }
  }

  const subjectMatch = pathname.match(/^\/subject\/([^/]+)/i)
  if (subjectMatch) {
    const subjectSlug = subjectMatch[1]
    return {
      subject: subjectSlug.charAt(0).toUpperCase() + subjectSlug.slice(1),
      topic: '',
      learningContext: `Support the learner on the ${subjectSlug} subject page with concise visual guidance.`
    }
  }

  return {
    subject: 'General',
    topic: '',
    learningContext: 'Support the learner with concise visual explanations and study help.'
  }
}

function stripCodeFences(value = '') {
  return String(value)
    .trim()
    .replace(/^```(?:json|md|markdown)?\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
}

function normalizeAssistantText(value) {
  if (value == null) return ''

  const extractFromObject = input => {
    if (!input || typeof input !== 'object') return ''
    const preferred = input.answer || input.text || input.message || input.content || input.response || input.output || input.result
    if (preferred) return normalizeAssistantText(preferred)
    return ''
  }

  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return value.map(item => normalizeAssistantText(item)).filter(Boolean).join('\n')
    }
    return extractFromObject(value)
  }

  let text = stripCodeFences(value)

  if (!text) return ''

  try {
    const parsed = JSON.parse(text)
    const extracted = normalizeAssistantText(parsed)
    if (extracted) return extracted
  } catch (error) {
    // fall through to text cleanup
  }

  text = text
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\n')
    .replace(/\\t/g, ' ')
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/^\{+/, '')
    .replace(/\}+$/, '')

  return text.trim()
}

function MessageContent({ text }) {
  const cleanText = normalizeAssistantText(text)
  const blocks = cleanText
    .split(/\n{2,}/)
    .map(block => block.trim())
    .filter(Boolean)

  if (!blocks.length) {
    return <span className="break-words whitespace-pre-wrap">{cleanText}</span>
  }

  return (
    <div className="space-y-2 break-words">
      {blocks.map((block, blockIndex) => {
        const lines = block.split(/\n/).map(line => line.trim()).filter(Boolean)
        const isList = lines.every(line => /^[-*•]\s+/.test(line) || /^\d+[.)]\s+/.test(line))

        if (isList) {
          return (
            <ul key={blockIndex} className="list-disc space-y-1 pl-5 text-sm leading-7">
              {lines.map((line, index) => (
                <li key={index}>{line.replace(/^[-*•]\s+|^\d+[.)]\s+/, '')}</li>
              ))}
            </ul>
          )
        }

        return (
          <p key={blockIndex} className="text-sm leading-7 whitespace-pre-wrap">
            {block}
          </p>
        )
      })}
    </div>
  )
}

function AssistantBody({ open, onClose, messages, loading, input, setInput, onSend, contextLabel, contextText }) {
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, open])

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.98 }}
          transition={{ duration: 0.24, ease: 'easeOut' }}
          className="fixed bottom-5 right-5 z-[80] w-[min(92vw,28rem)] overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/75 text-white shadow-[0_20px_80px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.12),transparent_28%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.06),transparent_20%)]" />
          <div className="relative border-b border-white/10 px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.28em] text-white/40">AI assistant</div>
                <div className="mt-1 text-base font-semibold text-white">{contextLabel || 'Study support'}</div>
                <p className="mt-1 text-xs leading-6 text-white/55 break-words line-clamp-2">{contextText}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] uppercase tracking-[0.24em] text-white/65 transition hover:bg-white/10 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="relative max-h-[52vh] overflow-y-auto overflow-x-hidden px-4 py-4 sm:max-h-[60vh]">
            <div className="space-y-3">
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] min-w-0 rounded-2xl border px-3 py-2.5 text-sm leading-7 ${message.role === 'user' ? 'border-white/10 bg-white/10 text-white' : 'border-white/10 bg-black/35 text-white/78'}`}>
                    <MessageContent text={message.text} />
                  </div>
                </div>
              ))}
              {!messages.length ? (
                <div className="rounded-2xl border border-white/10 bg-black/30 p-3 text-sm leading-7 text-white/60 break-words">
                  Ask about the current topic, the visuals on this page, or how to study the material.
                </div>
              ) : null}
            </div>
          </div>

          <div className="border-t border-white/10 p-3">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={event => setInput(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    onSend()
                  }
                }}
                placeholder="Ask the assistant..."
                className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/25"
              />
              <button
                type="button"
                onClick={onSend}
                disabled={loading}
                className="rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/12 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? '...' : 'Send'}
              </button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

export default function GlobalAssistant() {
  const location = useLocation()
  const { assistantContext } = useAssistantContext()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Open me to ask about the current lesson, visuals, or quiz prep.' }
  ])
  const [loading, setLoading] = useState(false)
  const synthRef = useRef(typeof window !== 'undefined' ? window.speechSynthesis : null)

  const routeContext = useMemo(() => buildRouteContext(location.pathname), [location.pathname])
  const context = useMemo(() => ({
    subject: assistantContext?.subject || routeContext.subject,
    topic: assistantContext?.topic || routeContext.topic,
    learningContext: assistantContext?.learningContext || routeContext.learningContext,
    topicId: assistantContext?.topicId || null
  }), [assistantContext, routeContext])

  const contextLabel = useMemo(() => {
    const topicLabel = context.topic ? `${context.subject}${context.topic ? ` · ${context.topic}` : ''}` : context.subject
    return topicLabel || 'Study support'
  }, [context])

  function speak(text) {
    if (!synthRef.current || !('speechSynthesis' in window)) return
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    synthRef.current.cancel()
    synthRef.current.speak(utterance)
  }

  async function send() {
    const prompt = input.trim()
    if (!prompt || loading) return

    setMessages(current => [...current, { role: 'user', text: prompt }])
    setLoading(true)
    setInput('')

    try {
      const response = await askAssistant({
        topicId: context.topicId,
        prompt,
        topicPrompt: context.learningContext,
        context: [context.subject, context.topic, context.learningContext].filter(Boolean).join(' | ')
      })
      const text = normalizeAssistantText(response?.answer || response?.response || response?.content || response) || 'Sorry, no response.'
      setMessages(current => [...current, { role: 'assistant', text }])
      speak(text)
    } catch (error) {
      const text = error?.message || 'The assistant is unavailable right now.'
      setMessages(current => [...current, { role: 'assistant', text }])
    } finally {
      setLoading(false)
    }
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <>
      {!open ? (
        <motion.button
          type="button"
          initial={{ opacity: 0, scale: 0.92, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-[81] flex items-center gap-3 rounded-full border border-white/10 bg-black/75 px-4 py-3 text-left text-white shadow-[0_0_30px_rgba(255,255,255,0.08),0_16px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
        >
          <span className="relative flex h-4 w-4 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/25 opacity-30" />
            <span className="relative h-2.5 w-2.5 rounded-full bg-white" />
          </span>
          <span className="flex flex-col">
            <span className="text-[10px] uppercase tracking-[0.28em] text-white/40">AI Assistant</span>
            <span className="text-sm font-medium text-white">{context.topic || 'Ask anything'}</span>
          </span>
        </motion.button>
      ) : null}

      <AssistantBody
        open={open}
        onClose={() => setOpen(false)}
        messages={messages}
        loading={loading}
        input={input}
        setInput={setInput}
        onSend={send}
        contextLabel={contextLabel}
        contextText={context.learningContext}
      />
    </>,
    document.body
  )
}
