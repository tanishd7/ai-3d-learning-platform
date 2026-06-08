import React, {useState, useRef} from 'react'
import { askAssistant } from '../services/api'

export default function Chatbot({ topic }){
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const synthRef = useRef(window.speechSynthesis)

  const speak = (text)=>{
    if(!('speechSynthesis' in window)) return
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-US'
    synthRef.current.cancel()
    synthRef.current.speak(u)
  }

  async function send(){
    if(!input) return
    const userMsg = {role:'user', text: input}
    setMessages(m=>[...m, userMsg])
    setLoading(true)
    setErrorMessage('')
    try{
      const context = [
        topic?.generatedContent?.summary || topic?.summary,
        topic?.generatedContent?.explanation,
        topic?.subjectTitle,
        topic?.visualType,
        Array.isArray(topic?.generatedContent?.keyConcepts) ? topic.generatedContent.keyConcepts.join(', ') : ''
      ].filter(Boolean).join(' | ')
      const res = await askAssistant({
        topicId: topic?.id,
        prompt: input,
        topicPrompt: topic?.generatedContent?.tutoringContext || topic?.chatbotPrompt || '',
        context
      })
      const text = res?.answer || 'Sorry, no response.'
      const botMsg = {role:'assistant', text}
      setMessages(m=>[...m, botMsg])
      speak(text)
    }catch(e){
      console.error('Gemini tutor error', e?.details || e)
      const readableMessage = e?.message || 'The AI tutor is unavailable right now. Please try again.'
      setErrorMessage(readableMessage)
      setMessages(m=>[...m, {role:'assistant', text: readableMessage}])
    }finally{setLoading(false); setInput('')}
  }

  return (
    <div>
      <div className="text-xs uppercase tracking-[0.26em] text-white/40">AI tutor</div>
      <h3 className="mt-1 text-lg font-semibold">Ask the AI</h3>
      {topic?.generatedContent?.tutoringContext || topic?.chatbotPrompt ? <p className="mt-2 text-sm leading-6 text-white/60">{topic.generatedContent?.tutoringContext || topic.chatbotPrompt}</p> : null}
      {errorMessage ? <p className="mt-2 text-xs leading-6 text-white/45">{errorMessage}</p> : null}
      <div className="mt-4 h-72 overflow-auto glass p-3 rounded">
        {messages.map((m,i)=>(
          <div key={i} className={`mb-2 ${m.role==='user'? 'text-right':''}`}>
            <div className="inline-block p-2 rounded-md" style={{background: m.role==='user'? 'rgba(48,118,255,0.14)': 'rgba(255,255,255,0.03)'}}>{m.text}</div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <input value={input} onChange={e=>setInput(e.target.value)} placeholder="Ask a question" className="flex-1 p-2 rounded bg-transparent border border-white/5" />
        <button onClick={send} className="px-4 py-2 glass rounded">{loading? '...' : 'Send'}</button>
      </div>
    </div>
  )
}
