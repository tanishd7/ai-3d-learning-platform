import React, {useState, useMemo} from 'react'

function Flashcard({item, index}){
  const [flipped, setFlipped] = useState(false)
  return (
    <button onClick={() => setFlipped(s => !s)} className="group w-full rounded-[1rem] border border-white/8 bg-black/30 p-4 text-left transition-transform duration-200 hover:scale-[1.01]">
      <div className="text-sm font-medium text-white">{item.question || item.prompt || `Card ${index+1}`}</div>
      <div className={`mt-2 text-sm transition-all duration-200 ${flipped ? 'text-white/90' : 'text-white/30'}`}>
        {flipped ? (item.answer || item.correct || '—') : 'Tap to reveal answer'}
      </div>
      {item.explanation ? <div className="mt-2 text-xs text-white/50">{item.explanation}</div> : null}
    </button>
  )
}

function MCQPanel({questions = []}){
  const [selected, setSelected] = useState({})
  const [revealed, setRevealed] = useState({})

  const score = useMemo(() => {
    return questions.reduce((sum, q, idx) => {
      const sel = selected[idx]
      return sum + (sel && sel === q.answer ? 1 : 0)
    }, 0)
  }, [questions, selected])

  if(!questions.length) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-white">Quiz</div>
          <div className="text-xs uppercase tracking-[0.22em] text-white/45">{score} / {questions.length} correct</div>
        </div>
        <button onClick={() => { setSelected({}); setRevealed({}) }} className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-white/65">Reset</button>
      </div>

      <div className="space-y-3">
        {questions.map((q, idx) => (
          <div key={idx} className="rounded-[1.1rem] border border-white/10 bg-white/[0.02] p-4">
            <div className="text-sm font-medium text-white">{idx+1}. {q.question}</div>
            <div className="mt-3 grid gap-2">
              {q.options?.map(opt => {
                const isActive = selected[idx] === opt
                return (
                  <button key={opt} onClick={() => setSelected(s => ({...s, [idx]: opt}))} className={`rounded-xl border px-3 py-2 text-left text-sm transition ${isActive ? 'border-white/35 bg-white/10 text-white' : 'border-white/10 bg-transparent text-white/72 hover:bg-white/5'}`}>
                    {opt}
                  </button>
                )
              })}
            </div>

            <div className="mt-3 flex items-center justify-between">
              <button onClick={() => setRevealed(r => ({...r, [idx]: !r[idx]}))} className="text-[11px] uppercase tracking-[0.22em] text-white/55">{revealed[idx] ? 'Hide explanation' : 'Reveal explanation'}</button>
              {selected[idx] ? <div className={`text-[11px] uppercase tracking-[0.22em] ${selected[idx] === q.answer ? 'text-white/80' : 'text-white/45'}`}>{selected[idx] === q.answer ? 'Correct' : 'Try again'}</div> : null}
            </div>

            {revealed[idx] ? (
              <div className="mt-3 rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white/72">
                <div className="text-xs uppercase tracking-[0.22em] text-white/45">Answer</div>
                <div className="mt-1 text-white">{q.answer}</div>
                {q.explanation ? <div className="mt-2 text-white/60">{q.explanation}</div> : null}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function QuizPanel({ quiz = [] }){
  const items = Array.isArray(quiz) ? quiz : []

  if(!items.length) return (
    <div className="rounded-[1.15rem] border border-white/10 bg-white/[0.02] p-6 text-center text-white/60">No quiz items available.</div>
  )

  const mcq = items.filter(q => Array.isArray(q.options) && q.options.length)
  const flashcards = items.filter(q => !Array.isArray(q.options) || !q.options.length)

  return (
    <div className="space-y-6">
      {mcq.length ? <MCQPanel questions={mcq} /> : null}
      {flashcards.length ? (
        <div>
          <div className="text-sm font-medium text-white mb-3">Flashcards</div>
          <div className="grid gap-3 sm:grid-cols-2">
            {flashcards.map((f, i) => <Flashcard key={i} item={f} index={i} />)}
          </div>
        </div>
      ) : null}
    </div>
  )
}
