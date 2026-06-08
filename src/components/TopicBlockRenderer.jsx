import React, { useMemo, useState } from 'react'
import ModelViewer from './ModelViewer'

function flattenTopicImages(topic) {
  const generated = Array.isArray(topic?.generatedContent?.images) ? topic.generatedContent.images : []
  const topicImages = Array.isArray(topic?.images) ? topic.images : []

  return [
    ...generated.map(image => ({
      src: image.src,
      label: image.alt || image.label || topic?.title || 'Topic image',
      caption: image.caption || '',
      kind: 'image'
    })),
    ...topicImages.map(image => ({
      src: image.src,
      label: image.alt || image.label || topic?.title || 'Topic image',
      caption: image.caption || '',
      kind: 'image'
    }))
  ]
}

function pickTopicImage(topic, keywords = []) {
  const images = flattenTopicImages(topic)
  if (!images.length) return null

  const normalizedKeywords = Array.isArray(keywords) ? keywords.map(value => String(value).toLowerCase()).filter(Boolean) : []

  const ranked = images.map(image => {
    const text = [image.label, image.caption, image.src].filter(Boolean).join(' ').toLowerCase()
    let score = 0
    normalizedKeywords.forEach(keyword => {
      if (text.includes(keyword)) score += 4
    })
    if (text.includes('anatomy')) score += 6
    if (text.includes('diagram')) score += 4
    if (text.includes('label')) score += 4
    if (text.includes('transparent')) score += 3
    return { ...image, score }
  })

  return ranked.sort((left, right) => right.score - left.score)[0]?.src || images[0].src
}

function TopicImageCard({ image, caption }) {
  if (!image) return null

  return (
    <div className="relative overflow-hidden rounded-[1.1rem] border border-white/10 bg-black/40">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.12),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))]" />
      <img src={image} alt={caption || 'Educational visual'} loading="lazy" className="relative z-10 h-full w-full object-contain p-3" />
    </div>
  )
}

function TopicQuiz({ questions = [] }) {
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [revealed, setRevealed] = useState({})

  const score = useMemo(() => {
    return questions.reduce((total, question, index) => {
      const answer = selectedAnswers[index]
      return total + (answer && answer === question.answer ? 1 : 0)
    }, 0)
  }, [questions, selectedAnswers])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div>
          <div className="text-sm font-medium text-white">Knowledge check</div>
          <div className="text-xs uppercase tracking-[0.24em] text-white/45">{score} / {questions.length || 0} correct</div>
        </div>
        <button type="button" onClick={() => { setSelectedAnswers({}); setRevealed({}) }} className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/65 transition hover:bg-white/5">
          Reset
        </button>
      </div>

      <div className="space-y-4">
        {questions.map((question, index) => {
          const selected = selectedAnswers[index]
          const isCorrect = selected && selected === question.answer
          const isRevealed = revealed[index]

          return (
            <div key={`${question.question}-${index}`} className="rounded-[1.25rem] border border-white/10 bg-white/[0.025] p-4">
              <div className="text-sm font-medium text-white">{index + 1}. {question.question}</div>
              <div className="mt-3 grid gap-2">
                {question.options?.map(option => {
                  const active = selected === option
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setSelectedAnswers(current => ({ ...current, [index]: option }))}
                      className={`rounded-xl border px-3 py-2 text-left text-sm transition ${active ? 'border-white/35 bg-white/10 text-white' : 'border-white/10 bg-transparent text-white/72 hover:bg-white/5'}`}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>

              <div className="mt-3 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setRevealed(current => ({ ...current, [index]: !current[index] }))}
                  className="text-[11px] uppercase tracking-[0.22em] text-white/55 transition hover:text-white"
                >
                  {isRevealed ? 'Hide explanation' : 'Reveal explanation'}
                </button>
                {selected ? (
                  <div className={`text-[11px] uppercase tracking-[0.22em] ${isCorrect ? 'text-white/80' : 'text-white/45'}`}>
                    {isCorrect ? 'Correct' : 'Try again'}
                  </div>
                ) : null}
              </div>

              {isRevealed ? (
                <div className="mt-3 rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white/72">
                  <div className="text-xs uppercase tracking-[0.22em] text-white/45">Answer</div>
                  <div className="mt-1 text-white">{question.answer}</div>
                  <div className="mt-2 text-white/60">{question.explanation}</div>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AnimatedDiagram({ title, subtitle, steps = [], note = '' }) {
  return (
    <section className="rounded-[1.45rem] border border-white/10 bg-white/[0.03] p-5">
      <div className="text-xs uppercase tracking-[0.26em] text-white/40">Animated diagram</div>
      <h3 className="mt-2 text-xl font-semibold text-white">{title}</h3>
      {subtitle ? <p className="mt-2 max-w-3xl text-sm leading-7 text-white/65">{subtitle}</p> : null}

      <div className="mt-5 grid gap-3">
        {steps.map((step, index) => (
          <div key={step} className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/25 p-4">
            <div className="absolute inset-y-0 left-0 w-[2px] bg-white/10" />
            <div className="absolute left-[-12px] top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border border-white/25 bg-white/10 shadow-[0_0_24px_rgba(255,255,255,0.16)]" />
            <div className="ml-4 flex items-start gap-3">
              <div className="mt-0.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-white/50">
                Step {index + 1}
              </div>
              <div className="text-sm leading-7 text-white/78">{step}</div>
            </div>
          </div>
        ))}
      </div>

      {note ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/35 p-4 text-sm leading-7 text-white/66">
          {note}
        </div>
      ) : null}
    </section>
  )
}

function AnatomyLabels({ title, image, labels = [] }) {
  return (
    <section className="overflow-hidden rounded-[1.45rem] border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-end justify-between gap-3 px-1 pb-4">
        <div>
          <div className="text-xs uppercase tracking-[0.26em] text-white/40">Anatomy labels</div>
          <h3 className="mt-2 text-xl font-semibold text-white">{title}</h3>
        </div>
        <div className="text-xs uppercase tracking-[0.22em] text-white/45">Labeled anatomy</div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <TopicImageCard image={image} caption={`${title} anatomy labels`} />
        <div className="grid gap-3 self-start">
          {labels.map(label => (
            <div key={label.name} className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="text-xs uppercase tracking-[0.24em] text-white/40">{label.name}</div>
              <div className="mt-2 text-sm leading-7 text-white/74">{label.value}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function InteractiveHotspots({ title, image, hotspots = [] }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeHotspot = hotspots[activeIndex] || hotspots[0]

  return (
    <section className="rounded-[1.45rem] border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-end justify-between gap-3 px-1 pb-4">
        <div>
          <div className="text-xs uppercase tracking-[0.26em] text-white/40">Interactive hotspots</div>
          <h3 className="mt-2 text-xl font-semibold text-white">{title}</h3>
        </div>
        <div className="text-xs uppercase tracking-[0.22em] text-white/45">Tap the anatomy points</div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="relative overflow-hidden rounded-[1.15rem] border border-white/10 bg-black/35">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.12),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))]" />
          <img src={image} alt={`${title} hotspot anatomy`} loading="lazy" className="relative z-0 h-[24rem] w-full object-contain p-3 sm:h-[30rem]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05),transparent_34%)]" />
          <div className="absolute inset-0 z-20">
            {hotspots.map((hotspot, index) => {
              const isActive = index === activeIndex
              return (
                <button
                  key={hotspot.label}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-md transition ${isActive ? 'border-white/40 bg-white text-black shadow-[0_0_28px_rgba(255,255,255,0.26)]' : 'border-white/20 bg-black/55 text-white/85 hover:bg-black/75 hover:text-white'}`}
                  style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
                >
                  <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-black' : 'bg-white'}`} />
                  {hotspot.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="rounded-[1.1rem] border border-white/10 bg-black/30 p-4">
          <div className="text-xs uppercase tracking-[0.24em] text-white/40">Selected point</div>
          <h4 className="mt-3 text-lg font-semibold text-white">{activeHotspot?.label}</h4>
          <p className="mt-3 text-sm leading-7 text-white/72">{activeHotspot?.detail}</p>
          <div className="mt-5 space-y-3">
            {hotspots.map((hotspot, index) => (
              <button
                key={`${hotspot.label}-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left text-sm transition ${index === activeIndex ? 'border-white/30 bg-white/[0.08] text-white' : 'border-white/10 bg-transparent text-white/65 hover:bg-white/5'}`}
              >
                <span>{hotspot.label}</span>
                <span className="text-[10px] uppercase tracking-[0.22em] text-white/40">{index + 1}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function MedicalImageGallery({ title, images = [] }) {
  const heroImage = images?.[0]?.src || null
  const supportImage = images?.[1]?.src || null

  return (
    <section className="rounded-[1.45rem] border border-white/10 bg-white/[0.03] p-5">
      <div className="text-xs uppercase tracking-[0.26em] text-white/40">Medical image gallery</div>
      <h3 className="mt-2 text-xl font-semibold text-white">{title}</h3>
      <div className="mt-5 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        {heroImage ? (
          <figure className="overflow-hidden rounded-[1.15rem] border border-white/10 bg-black/30">
            <div className="relative aspect-[16/10] bg-black/45">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.12),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))]" />
              <img src={heroImage} alt={title} loading="lazy" className="relative z-10 h-full w-full object-contain p-4" />
            </div>
            <figcaption className="border-t border-white/10 px-4 py-3 text-sm text-white/70">{images?.[0]?.caption || title}</figcaption>
          </figure>
        ) : null}

        {supportImage ? (
          <figure className="overflow-hidden rounded-[1.15rem] border border-white/10 bg-black/30">
            <div className="relative aspect-[4/5] bg-black/45">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.12),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))]" />
              <img src={supportImage} alt={images?.[1]?.caption || title} loading="lazy" className="relative z-10 h-full w-full object-contain p-4" />
            </div>
            <figcaption className="border-t border-white/10 px-4 py-3 text-sm text-white/70">{images?.[1]?.caption || 'Supporting visual'}</figcaption>
          </figure>
        ) : null}
      </div>
    </section>
  )
}

function EmbeddedVideo({ title, src, caption }) {
  return (
    <section className="rounded-[1.45rem] border border-white/10 bg-white/[0.03] p-4">
      <div className="text-xs uppercase tracking-[0.26em] text-white/40">Embedded video</div>
      <h3 className="mt-2 text-xl font-semibold text-white">{title}</h3>
      <div className="mt-4 overflow-hidden rounded-[1.15rem] border border-white/10 bg-black/35">
        {src ? (
          <div className="aspect-video">
            <iframe
              title={title}
              src={src}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="relative aspect-video overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.12),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))]" />
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/85 shadow-[0_0_36px_rgba(255,255,255,0.2)]">
                ▶
              </div>
              <div className="text-xs uppercase tracking-[0.28em] text-white/45">Video slot ready</div>
            </div>
          </div>
        )}
      </div>
      {caption ? <p className="mt-3 text-sm leading-7 text-white/65">{caption}</p> : null}
    </section>
  )
}

function AnatomyFacts({ title, facts = [] }) {
  return (
    <section className="rounded-[1.45rem] border border-white/10 bg-white/[0.03] p-5">
      <div className="text-xs uppercase tracking-[0.26em] text-white/40">Anatomy facts</div>
      <h3 className="mt-2 text-xl font-semibold text-white">{title}</h3>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {facts.map(fact => (
          <div key={fact} className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-7 text-white/72">
            {fact}
          </div>
        ))}
      </div>
    </section>
  )
}

function KeyConcepts({ title, items = [] }) {
  return (
    <section className="rounded-[1.45rem] border border-white/10 bg-white/[0.03] p-5">
      <div className="text-xs uppercase tracking-[0.26em] text-white/40">Key concepts</div>
      <h3 className="mt-2 text-xl font-semibold text-white">{title}</h3>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {items.map(item => (
          <div key={item} className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-7 text-white/72">
            {item}
          </div>
        ))}
      </div>
    </section>
  )
}

function VisualHighlights({ title, items = [] }) {
  return (
    <section className="rounded-[1.45rem] border border-white/10 bg-white/[0.03] p-5">
      <div className="text-xs uppercase tracking-[0.26em] text-white/40">Visual highlights</div>
      <h3 className="mt-2 text-xl font-semibold text-white">{title}</h3>
      <div className="mt-5 flex flex-wrap gap-2">
        {items.map(item => (
          <span key={item} className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] text-white/65">
            {item}
          </span>
        ))}
      </div>
    </section>
  )
}

function MediaGallery({ title, items = [], description = '', loading = false }) {
  const hasItems = Array.isArray(items) && items.length > 0
  const heroItem = hasItems ? items[0] : null
  const supportItem = hasItems ? items[1] : null

  return (
    <section className="rounded-[1.45rem] border border-white/10 bg-white/[0.03] p-5">
      <div className="text-xs uppercase tracking-[0.26em] text-white/40">Educational media</div>
      <h3 className="mt-2 text-xl font-semibold text-white">{title}</h3>
      {description ? <p className="mt-2 max-w-3xl text-sm leading-7 text-white/65">{description}</p> : null}

      {loading && !hasItems ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-[1.35fr_0.75fr]">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-[1.15rem] border border-white/10 bg-black/30">
              <div className={`animate-pulse bg-[linear-gradient(110deg,rgba(255,255,255,0.02)_8%,rgba(255,255,255,0.08)_18%,rgba(255,255,255,0.02)_33%)] bg-[length:200%_100%] ${index === 0 ? 'aspect-[16/10]' : 'aspect-[4/5]'}`} />
              <div className="space-y-3 border-t border-white/10 px-4 py-3">
                <div className="h-4 w-3/4 animate-pulse rounded-full bg-white/10" />
                <div className="h-3 w-full animate-pulse rounded-full bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      ) : hasItems ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-[1.35fr_0.75fr]">
          {heroItem ? (
            <figure className="overflow-hidden rounded-[1.15rem] border border-white/10 bg-black/30">
              <div className="relative aspect-[16/10] bg-black/45">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.12),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))]" />
                <img src={heroItem.src} alt={heroItem.label} loading="lazy" className="relative z-10 h-full w-full object-contain p-4" />
                <div className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/45 px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-white/70 backdrop-blur-md">
                  {heroItem.kind || 'image'}
                </div>
              </div>
              <figcaption className="space-y-2 border-t border-white/10 px-4 py-3">
                <div className="text-sm font-medium text-white">{heroItem.label}</div>
                <div className="text-sm leading-6 text-white/65">{heroItem.caption}</div>
              </figcaption>
            </figure>
          ) : null}

          {supportItem ? (
            <figure className="overflow-hidden rounded-[1.15rem] border border-white/10 bg-black/30">
              <div className="relative aspect-[4/5] bg-black/45">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.12),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))]" />
                <img src={supportItem.src} alt={supportItem.label} loading="lazy" className="relative z-10 h-full w-full object-contain p-4" />
                <div className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/45 px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-white/70 backdrop-blur-md">
                  {supportItem.kind || 'image'}
                </div>
                {supportItem.kind === 'video' ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white/90 shadow-[0_0_30px_rgba(255,255,255,0.18)]">
                      ▶
                    </div>
                  </div>
                ) : null}
                {supportItem.kind === '3d-model' ? (
                  <div className="absolute right-3 top-3 rounded-full border border-white/10 bg-black/45 px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-white/70 backdrop-blur-md">
                    sketchfab
                  </div>
                ) : null}
              </div>
              <figcaption className="space-y-2 border-t border-white/10 px-4 py-3">
                <div className="text-sm font-medium text-white">{supportItem.label}</div>
                <div className="text-sm leading-6 text-white/65">{supportItem.caption}</div>
              </figcaption>
            </figure>
          ) : null}
        </div>
      ) : (
        <div className="mt-5 rounded-[1.15rem] border border-white/10 bg-black/30 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70">◌</div>
            <div>
              <div className="text-sm font-medium text-white">No media attached yet</div>
              <div className="mt-1 text-sm leading-6 text-white/60">The system will generate visuals for this topic as soon as Gemini or the fallback media pipeline returns content.</div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function TopicBlockRenderer({ topic, blocks = [], suppress3dBlockWhenHero = false }) {
  if (!blocks.length) return null

  return (
    <div className="space-y-4">
      {blocks.map((block, index) => {
        if (block.type === 'text') {
          return (
            <section key={`${block.type}-${index}`} className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-5">
              <div className="text-xs uppercase tracking-[0.28em] text-white/40">Concept</div>
              <h3 className="mt-2 text-xl font-semibold text-white">{block.heading}</h3>
              <p className="mt-3 max-w-4xl text-sm leading-7 text-white/72">{block.body}</p>
            </section>
          )
        }

        if (block.type === 'anatomy-labels') {
          return (
            <AnatomyLabels
              key={`${block.type}-${index}`}
              title={block.title}
              image={pickTopicImage(topic, [block.title, ...(block.labels || []).map(label => label.name)]) || block.image}
              labels={block.labels}
            />
          )
        }

        if (block.type === 'interactive-hotspots') {
          return (
            <InteractiveHotspots
              key={`${block.type}-${index}`}
              title={block.title}
              image={pickTopicImage(topic, [block.title, ...(block.hotspots || []).map(hotspot => hotspot.label)]) || block.image}
              hotspots={block.hotspots}
            />
          )
        }

        if (block.type === 'animated-diagram') {
          return (
            <AnimatedDiagram
              key={`${block.type}-${index}`}
              title={block.title}
              subtitle={block.subtitle}
              steps={block.steps}
              note={block.note}
            />
          )
        }

        if (block.type === 'medical-image-gallery') {
          return (
            <MedicalImageGallery
              key={`${block.type}-${index}`}
              title={block.title}
              images={Array.isArray(topic?.generatedContent?.images) && topic.generatedContent.images.length ? topic.generatedContent.images : (Array.isArray(topic?.images) && topic.images.length ? topic.images : block.images)}
            />
          )
        }

        if (block.type === 'embedded-video' || block.type === 'video') {
          return (
            <EmbeddedVideo
              key={`${block.type}-${index}`}
              title={block.title}
              src={block.src}
              caption={block.caption}
            />
          )
        }

        if (block.type === 'anatomy-facts') {
          return (
            <AnatomyFacts
              key={`${block.type}-${index}`}
              title={block.title}
              facts={block.facts}
            />
          )
        }

        if (block.type === 'key-concepts') {
          return (
            <KeyConcepts
              key={`${block.type}-${index}`}
              title={block.title}
              items={block.items}
            />
          )
        }

        if (block.type === 'visual-highlights') {
          return (
            <VisualHighlights
              key={`${block.type}-${index}`}
              title={block.title}
              items={block.items}
            />
          )
        }

        if (block.type === 'media-gallery') {
          return (
            <MediaGallery
              key={`${block.type}-${index}`}
              title={block.title}
              items={block.items}
              description={block.description}
              loading={block.loading}
            />
          )
        }

        if (block.type === 'ai-summary' || block.type === 'ai-explanation') {
          return (
            <section key={`${block.type}-${index}`} className="rounded-[1.45rem] border border-white/10 bg-white/[0.03] p-5">
              <div className="text-xs uppercase tracking-[0.26em] text-white/40">{block.type === 'ai-summary' ? 'AI summary' : 'AI explanation'}</div>
              <h3 className="mt-2 text-xl font-semibold text-white">{block.title}</h3>
              <p className="mt-3 max-w-4xl text-sm leading-7 text-white/72">{block.body}</p>
            </section>
          )
        }

        if (block.type === 'image') {
          return (
            <section key={`${block.type}-${index}`} className="overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[0.03]">
              <div className="relative aspect-[16/10] bg-black/45">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.12),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))]" />
                <img src={block.src} alt={block.title || 'Topic image'} loading="lazy" className="relative z-10 h-full w-full object-contain p-4" />
              </div>
              <div className="p-4">
                <div className="text-xs uppercase tracking-[0.24em] text-white/40">Image</div>
                <h3 className="mt-1 text-lg font-semibold text-white">{block.title}</h3>
                {block.caption ? <p className="mt-2 text-sm text-white/65">{block.caption}</p> : null}
              </div>
            </section>
          )
        }

        if (block.type === 'video') {
          return (
            <section key={`${block.type}-${index}`} className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs uppercase tracking-[0.24em] text-white/40">Video</div>
              <h3 className="mt-1 text-lg font-semibold text-white">{block.title}</h3>
              <div className="mt-4 overflow-hidden rounded-[1.1rem] border border-white/10 bg-black/40">
                <div className="aspect-video">
                  <iframe
                    title={block.title || 'Embedded video'}
                    src={block.src}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
              {block.caption ? <p className="mt-3 text-sm text-white/65">{block.caption}</p> : null}
            </section>
          )
        }

        if (block.type === '3d-model') {
          if (suppress3dBlockWhenHero) return null

          return (
            <section key={`${block.type}-${index}`} className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-white/40">3D model</div>
                  <h3 className="mt-1 text-lg font-semibold text-white">{block.title}</h3>
                </div>
                {block.caption ? <p className="max-w-lg text-right text-xs uppercase tracking-[0.2em] text-white/45">{block.caption}</p> : null}
              </div>
              <div className="mt-4 h-[26rem] overflow-hidden rounded-[1.15rem] border border-white/10 bg-black/35">
                <ModelViewer modelUrl={block.src || topic?.model3d} />
              </div>
            </section>
          )
        }

        if (block.type === 'simulation') {
          return (
            <section key={`${block.type}-${index}`} className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs uppercase tracking-[0.24em] text-white/40">Simulation</div>
              <h3 className="mt-1 text-lg font-semibold text-white">{block.title}</h3>
              <p className="mt-2 text-sm text-white/68">{block.description}</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {block.steps?.map((step, stepIndex) => (
                  <div key={step} className="rounded-2xl border border-white/10 bg-black/30 p-3 text-sm text-white/75">
                    <div className="text-[10px] uppercase tracking-[0.24em] text-white/40">Step {stepIndex + 1}</div>
                    <div className="mt-1">{step}</div>
                  </div>
                ))}
              </div>
            </section>
          )
        }

        if (block.type === 'diagram') {
          return (
            <section key={`${block.type}-${index}`} className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs uppercase tracking-[0.24em] text-white/40">Diagram</div>
              <h3 className="mt-1 text-lg font-semibold text-white">{block.title}</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {block.items?.map((item, itemIndex) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-black/30 p-3 text-sm text-white/74">
                    <div className="text-[10px] uppercase tracking-[0.24em] text-white/40">Node {itemIndex + 1}</div>
                    <div className="mt-1 leading-6">{item}</div>
                  </div>
                ))}
              </div>
            </section>
          )
        }

        if (block.type === 'quiz') {
          return (
            <section key={`${block.type}-${index}`} className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs uppercase tracking-[0.24em] text-white/40">Quiz</div>
              <h3 className="mt-1 text-lg font-semibold text-white">{block.title}</h3>
              <div className="mt-4">
                <TopicQuiz questions={block.questions || topic?.quiz || []} />
              </div>
            </section>
          )
        }

        return null
      })}
    </div>
  )
}

export default TopicBlockRenderer