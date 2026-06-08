import React, {useEffect, useMemo, useState, Suspense} from 'react'
import { motion } from 'framer-motion'
import { useParams } from 'react-router-dom'
import ModelViewer from '../components/ModelViewer'
import { fetchTopicBySlug } from '../services/firebase'
import TopicBlockRenderer from '../components/TopicBlockRenderer'
import { getVisualTypeMeta } from '../lib/topicContent'
import { requestTopicContent } from '../services/api'
import { useAssistantContext } from '../components/AssistantContext'
import useScrollDirection from '../hooks/useScrollDirection'
const VideosPanel = React.lazy(() => import('../components/VideosPanel'))
const QuizPanel = React.lazy(() => import('../components/QuizPanel'))

export default function Topic(){
  const { slug } = useParams()
  const { setAssistantContext } = useAssistantContext()
  const { scrollY } = useScrollDirection()
  const [topic, setTopic] = useState(null)
  const [generatedContent, setGeneratedContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [contentLoading, setContentLoading] = useState(false)
  const [contentMessage, setContentMessage] = useState('')
  const [contentSource, setContentSource] = useState('')
  const [mode, setMode] = useState('learning') // learning | videos | quiz

  const biologyThemeMap = {
    heart: {
      label: 'Circulatory rhythm',
      overlay: 'radial-gradient(circle at 20% 18%, rgba(255,255,255,0.12), transparent 24%), radial-gradient(circle at 82% 12%, rgba(255,255,255,0.08), transparent 18%), linear-gradient(135deg, rgba(255,255,255,0.04), transparent 65%)'
    },
    brain: {
      label: 'Neural network map',
      overlay: 'radial-gradient(circle at 18% 20%, rgba(255,255,255,0.1), transparent 20%), radial-gradient(circle at 78% 18%, rgba(255,255,255,0.06), transparent 18%), linear-gradient(135deg, rgba(255,255,255,0.03), transparent 72%)'
    },
    eye: {
      label: 'Light path study',
      overlay: 'radial-gradient(circle at 50% 12%, rgba(255,255,255,0.09), transparent 20%), radial-gradient(circle at 72% 22%, rgba(255,255,255,0.05), transparent 16%), linear-gradient(180deg, rgba(255,255,255,0.03), transparent 70%)'
    },
    skeleton: {
      label: 'Structural frame',
      overlay: 'radial-gradient(circle at 24% 14%, rgba(255,255,255,0.08), transparent 22%), radial-gradient(circle at 82% 26%, rgba(255,255,255,0.05), transparent 18%), linear-gradient(135deg, rgba(255,255,255,0.03), transparent 68%)'
    },
    lungs: {
      label: 'Breathing cycle',
      overlay: 'radial-gradient(circle at 50% 14%, rgba(255,255,255,0.1), transparent 26%), radial-gradient(circle at 18% 26%, rgba(255,255,255,0.06), transparent 18%), linear-gradient(180deg, rgba(255,255,255,0.04), transparent 72%)'
    },
    dna: {
      label: 'Genetic instruction code',
      overlay: 'radial-gradient(circle at 50% 16%, rgba(255,255,255,0.1), transparent 24%), radial-gradient(circle at 82% 18%, rgba(255,255,255,0.05), transparent 18%), linear-gradient(145deg, rgba(255,255,255,0.03), transparent 70%)'
    }
  }

  useEffect(()=>{
    let active = true
    setLoading(true)
    setGeneratedContent(null)
    setContentMessage('')
    setContentSource('')

    fetchTopicBySlug(slug)
      .then(data => {
        if(active) setTopic(data)
      })
      .catch(() => {
        if(active) setTopic(null)
      })
      .finally(() => {
        if(active) setLoading(false)
      })

    return () => {
      active = false
    }
  },[slug])

  useEffect(()=>{
    if(!topic?.title) return

    let active = true
    const cacheVersion = String(topic.slug || topic.title || '').toLowerCase().includes('brain') ? 'brain-human-v3' : 'topic-content-v1'
    const cacheKey = `education_3d:topic-content:${cacheVersion}:${topic.slug}`
    const CACHE_TTL_MS = 1000 * 60 * 60 * 24 // 24 hours
    let cachedContent = null
    let cachedSource = ''
    let cachedServerVersion = null

    try {
      const cached = localStorage.getItem(cacheKey)
      if(cached){
        const parsed = JSON.parse(cached)
        if(parsed?.content){
          cachedContent = parsed.content
          cachedSource = parsed.source || 'cache'
          cachedServerVersion = parsed.serverVersion || null
          const cachedAt = parsed.cachedAt ? new Date(parsed.cachedAt).getTime() : 0
          const age = Date.now() - cachedAt
          const isExpired = age > CACHE_TTL_MS

          setGeneratedContent(parsed.content)
          setContentSource(cachedSource)
          setContentMessage(parsed.content.mediaWarning || '')

          // If cache is fresh, not a local fallback, and has a serverVersion, avoid re-fetching
          if(!isExpired && cachedSource !== 'local-fallback' && cachedServerVersion){
            setContentLoading(false)
            return
          }
        }
      }
    } catch (error) {
      console.warn('topic content cache read failed', error)
    }

    async function loadContent(){
      // If cache exists but was expired or was a fallback, fetch fresh content

      setContentLoading(true)
      try{
        const response = await requestTopicContent({
          title: topic.title,
          subject: topic.subject || topic.subjectTitle || 'biology',
          difficulty: topic.difficulty || 'beginner',
          visualType: topic.visualType || 'interactive-diagram'
        })
        if(!active) return
        const content = response?.content || null
        if(content){
          // Only update cache if server provided new serverVersion or cache was empty/expired
          const source = response?.source || 'gemini'
          const serverVersion = response?.serverVersion || content.serverVersion || content.generatedAt || null

          const shouldUpdate = !cachedContent || !cachedServerVersion || (serverVersion && serverVersion !== cachedServerVersion)

          setGeneratedContent(content)
          setContentSource(source)
          setContentMessage(response?.warning || (source !== 'gemini' ? 'Gemini content is unavailable right now. Showing generated fallback content.' : ''))

          if(shouldUpdate){
            try {
              localStorage.setItem(cacheKey, JSON.stringify({ content, source, cachedAt: new Date().toISOString(), serverVersion }))
            } catch (error) {
              console.warn('topic content cache write failed', error)
            }
          }
        }
      }catch(error){
        if(active){
          console.error('requestTopicContent error', error?.details || error)
          setContentMessage(error?.message || 'Gemini content is unavailable right now.')
          setContentSource('error')
        }
      }finally{
        if(active) setContentLoading(false)
      }
    }

    loadContent()

    return () => {
      active = false
    }
  },[topic?.title, topic?.slug, topic?.subject, topic?.subjectTitle, topic?.difficulty, topic?.visualType])

  useEffect(() => {
    if (!topic?.title) return

    const learningContext = generatedContent?.tutoringContext
      || generatedContent?.summary
      || topic?.chatbotPrompt
      || topic?.summary
      || topic?.description
      || `Study the ${topic.title} topic visually.`

    setAssistantContext({
      topicId: topic.id || topic.slug || null,
      subject: topic.subjectTitle || topic.subject || 'Biology',
      topic: topic.title,
      learningContext
    })

    return () => {
      setAssistantContext(null)
    }
  }, [generatedContent?.summary, generatedContent?.tutoringContext, setAssistantContext, topic?.description, topic?.id, topic?.slug, topic?.subject, topic?.subjectTitle, topic?.title, topic?.chatbotPrompt, topic?.summary])

  const visualMode = generatedContent?.displayMode || topic?.visualType || 'mixed'
  const visualMeta = useMemo(() => getVisualTypeMeta(visualMode), [visualMode])
  const heroImage = generatedContent?.heroImage?.src || generatedContent?.images?.[0]?.src || topic?.images?.[0]?.src || null
  const supportingImage = generatedContent?.supportingImage?.src || generatedContent?.images?.[1]?.src || topic?.images?.[1]?.src || null
  const heroModel = generatedContent?.model3d || topic?.model3d || null
  const aiBlocks = useMemo(() => {
    if(!generatedContent) return []

    const videoBlocks = Array.isArray(generatedContent.videos) ? generatedContent.videos.map((video, index) => ({
      type: 'embedded-video',
      title: video.title || `${topic?.title || 'Topic'} video ${index + 1}`,
      src: video.src,
      caption: video.caption
    })) : []

    const modelBlock = generatedContent.model3d ? [{
      type: '3d-model',
      title: generatedContent.model3dProvider === 'sketchfab' ? 'Interactive Sketchfab model' : '3D model viewer',
      src: generatedContent.model3d,
      caption: generatedContent.model3dProvider === 'sketchfab' ? 'Embedded Sketchfab model for hands-on exploration' : 'Interactive model viewer'
    }] : []

    return [
      generatedContent.summary ? {
        type: 'ai-summary',
        title: 'Beginner summary',
        body: generatedContent.summary
      } : null,
      generatedContent.explanation ? {
        type: 'ai-explanation',
        title: 'Detailed explanation',
        body: generatedContent.explanation
      } : null,
      Array.isArray(generatedContent.keyConcepts) && generatedContent.keyConcepts.length ? {
        type: 'key-concepts',
        title: 'Key concepts',
        items: generatedContent.keyConcepts
      } : null,
      Array.isArray(generatedContent.visualHighlights) && generatedContent.visualHighlights.length ? {
        type: 'visual-highlights',
        title: 'Visual highlights',
        items: generatedContent.visualHighlights
      } : null,
      ...modelBlock
    ].filter(Boolean)
  }, [generatedContent, topic?.title, topic?.model3d])

  const topicBlocks = topic?.contentBlocks || []

  // Build isolated pipelines
  const learningContent = useMemo(() => {
    const allowed = new Set(['ai-summary','ai-explanation','key-concepts','visual-highlights','3d-model','medical-image-gallery','anatomy-labels','interactive-hotspots','animated-diagram','image','media-gallery','anatomy-facts','diagram','text'])
    const fromAi = aiBlocks.filter(b => allowed.has(b.type))
    const fromTopic = topicBlocks.filter(b => allowed.has(b.type))
    return [...fromAi, ...fromTopic]
  }, [aiBlocks, topicBlocks])

  const videoContent = useMemo(() => {
    // videos are handled separately; keep minimal pipeline if any video-specific blocks exist in topic blocks
    const allowed = new Set(['embedded-video','video'])
    return topicBlocks.filter(b => allowed.has(b.type))
  }, [topicBlocks])

  const quizContent = useMemo(() => {
    // Quiz data comes from generatedContent.quiz or topic.quiz
    const questions = Array.isArray(generatedContent?.quiz) && generatedContent.quiz.length ? generatedContent.quiz : (Array.isArray(topic?.quiz) ? topic.quiz : [])
    return questions
  }, [generatedContent, topic])
  const topicMood = biologyThemeMap[topic?.slug] || { label: 'Visual learning engine', overlay: 'linear-gradient(135deg, rgba(255,255,255,0.05), transparent 70%)' }
  const visualMetaDisplay = visualMeta

  const heroModeLabel = {
    model3d: '3D model focus',
    imageGallery: 'Image gallery focus',
    simulation: 'Simulation focus',
    videoLesson: 'Video lesson focus',
    mixed: 'Mixed media focus'
  }[visualMode] || 'Mixed media focus'
  const hideTopicTabs = scrollY > 140

  if (loading) {
    return (
      <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-8 text-sm text-white/60">
        Loading topic...
      </div>
    )
  }

  if (!topic) {
    return (
      <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-8">
        <div className="text-xs uppercase tracking-[0.28em] text-white/40">Dynamic topic engine</div>
        <h2 className="mt-3 text-3xl font-semibold text-white">Topic not found</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/65">
          The requested topic does not exist yet. Create it from Admin and the visual engine will generate a schema-driven page automatically.
        </p>
      </div>
    )
  }

  const heroLayout = visualMode === 'model3d'
    ? 'lg:grid-cols-[1.25fr_0.85fr]'
    : visualMode === 'simulation'
      ? 'lg:grid-cols-[1fr_1fr]'
      : visualMode === 'imageGallery'
        ? 'lg:grid-cols-[0.95fr_1.05fr]'
        : visualMode === 'mixed'
          ? 'lg:grid-cols-[1fr_1fr]'
          : 'lg:grid-cols-[1fr_1fr]'

  return (
    <div className="space-y-6">
      <motion.div
        className="sticky z-40 -mx-4 px-4 md:-mx-8 md:px-8"
        style={{ top: 'calc(var(--app-header-height, 0px) + 0.75rem)' }}
        initial={false}
        animate={hideTopicTabs ? { height: 0, opacity: 0, y: -16 } : { height: 88, opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
      >
        <div className="overflow-hidden rounded-[1.35rem] border border-white/10 bg-black/55 p-2 shadow-[0_18px_50px_rgba(0,0,0,0.25)] backdrop-blur-2xl">
          <div className="flex items-center gap-3">
            <div className="flex w-full max-w-md items-center gap-2 overflow-hidden rounded-full bg-white/[0.03] p-1">
              {['learning', 'videos', 'quiz'].map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 truncate select-none rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${mode === m ? 'bg-white/10 text-white shadow-[0_6px_18px_rgba(255,255,255,0.04)]' : 'text-white/60 hover:text-white/80'}`}
                >
                  {m === 'learning' ? 'Learning' : m === 'videos' ? 'Videos' : 'Quiz'}
                </button>
              ))}
            </div>
            <div className="ml-2 text-xs uppercase tracking-[0.22em] text-white/50">{mode === 'learning' ? 'Learning' : mode === 'videos' ? 'Videos' : 'Quiz'}</div>
          </div>
        </div>
      </motion.div>

      <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5 md:p-6">
        <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-white/45">
          <span>{topic.subjectTitle || 'Biology'}</span>
          <span>•</span>
          <span>{topic.difficulty || 'beginner'}</span>
          <span>•</span>
          <span>{visualMeta.label}</span>
        </div>
        <div className="mt-4 max-w-4xl">
          <h2 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">{topic.title}</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70 md:text-base">
            {generatedContent?.summary || topic.summary || topic.description}
          </p>
          <div className="mt-4 inline-flex rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-white/55">
            {contentSource || 'loading'}
          </div>
        </div>
      </section>

      {contentMessage ? (
        <section className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-white/72">
          {contentMessage}
        </section>
      ) : null}

      <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 md:p-5">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-white/40">Visual mode</div>
            <div className="mt-1 text-lg font-semibold text-white">{visualMetaDisplay.label}</div>
          </div>
          <div className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-white/60">
            {heroModeLabel}
          </div>
        </div>

        <div className="relative mt-4 overflow-hidden rounded-[1.25rem] border border-white/10 bg-black/35">
          <div className="pointer-events-none absolute inset-0 opacity-100" style={{ backgroundImage: topicMood.overlay }} />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/10" />
          <div className="pointer-events-none absolute left-4 top-4 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[10px] uppercase tracking-[0.26em] text-white/60 backdrop-blur-md">
            {heroModeLabel}
          </div>
          {contentLoading && !heroModel && !heroImage ? (
            <div className="flex h-[30rem] items-center justify-center px-8 text-center md:h-[34rem]">
              <div className="w-full max-w-lg space-y-4">
                <div className="mx-auto h-4 w-32 animate-pulse rounded-full bg-white/10" />
                <div className="h-8 w-3/4 animate-pulse rounded-full bg-white/10" />
                <div className="mx-auto h-3 w-5/6 animate-pulse rounded-full bg-white/5" />
                <div className="mt-6 grid grid-cols-3 gap-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="h-24 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
                  ))}
                </div>
              </div>
            </div>
          ) : heroModel ? (
            <div className="h-[30rem] md:h-[34rem]">
              <ModelViewer modelUrl={heroModel} />
            </div>
          ) : heroImage ? (
            <div className="relative h-[30rem] overflow-hidden md:h-[34rem]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.12),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] backdrop-blur-2xl" />
              <img src={heroImage} alt={topic.title} loading="lazy" className="relative z-10 h-full w-full object-contain p-4 md:p-6" />
              {supportingImage ? (
                <div className="absolute bottom-4 right-4 z-20 hidden w-40 overflow-hidden rounded-[1rem] border border-white/10 bg-black/55 shadow-[0_0_40px_rgba(0,0,0,0.35)] backdrop-blur-xl md:block lg:w-52">
                  <div className="aspect-[4/5]">
                    <img src={supportingImage} alt={`${topic.title} supporting visual`} loading="lazy" className="h-full w-full object-contain p-2" />
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex h-[30rem] items-center justify-center px-8 text-center md:h-[34rem]">
              <div>
                <div className="text-[11px] uppercase tracking-[0.3em] text-white/45">Adaptive learning panel</div>
                <div className="mt-4 text-2xl font-semibold text-white">{visualMeta.label}</div>
                <p className="mt-3 max-w-xl text-sm leading-7 text-white/65">
                  This block will adapt to the topic’s visual type, media set, and model availability.
                </p>
              </div>
            </div>
          )}
        </div>

        {mode === 'learning' && generatedContent?.model3d && generatedContent.model3d !== topic.model3d ? (
          <div className="mt-4 rounded-[1.15rem] border border-white/10 bg-black/25 p-3 text-sm text-white/65">
            <div className="text-[10px] uppercase tracking-[0.26em] text-white/40">3D embed</div>
            <div className="mt-1">Sketchfab interactive model loaded for this topic.</div>
          </div>
        ) : null}

        {mode === 'learning' && topic.model3dSuggestions?.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {topic.model3dSuggestions.map(item => (
              <span key={item} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-white/55">
                {item}
              </span>
            ))}
          </div>
        ) : null}
      </section>

      <div className="space-y-6">
        {mode === 'learning' ? (
            <div className="transition-opacity duration-300 ease-in-out">
            <TopicBlockRenderer topic={{...topic, generatedContent}} blocks={learningContent} suppress3dBlockWhenHero={Boolean(heroModel)} />
          </div>
        ) : null}

        {mode === 'videos' ? (
          <Suspense fallback={<div className="p-6 text-center text-white/60">Loading videos…</div>}>
            <div className="transition-opacity duration-300 ease-in-out">
              <VideosPanel videos={generatedContent?.videos || []} />
            </div>
          </Suspense>
        ) : null}

        {mode === 'quiz' ? (
          <Suspense fallback={<div className="p-6 text-center text-white/60">Loading quiz…</div>}>
            <div className="transition-opacity duration-300 ease-in-out">
              <QuizPanel quiz={quizContent} />
            </div>
          </Suspense>
        ) : null}
      </div>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 md:p-5">
          <div className="text-xs uppercase tracking-[0.24em] text-white/40">Summary</div>
          <p className="mt-3 text-sm leading-7 text-white/72">{generatedContent?.summary || topic.summary}</p>
          {generatedContent?.explanation ? (
            <p className="mt-3 text-sm leading-7 text-white/60">{generatedContent.explanation}</p>
          ) : null}
          {supportingImage ? (
            <div className="mt-4 overflow-hidden rounded-[1.15rem] border border-white/10 bg-black/35">
              <div className="relative aspect-[16/10]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.12),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))]" />
                <img src={supportingImage} alt={`${topic.title} supporting visual`} loading="lazy" className="relative z-10 h-full w-full object-contain p-4" />
              </div>
            </div>
          ) : null}
        </div>

        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 md:p-5">
          {contentLoading ? <p className="mt-2 text-xs uppercase tracking-[0.24em] text-white/40">Refreshing Gemini content...</p> : null}
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-white/70">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
              <div className="text-[10px] uppercase tracking-[0.22em] text-white/40">Blocks</div>
              <div className="mt-1 text-white">{learningContent.length}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
              <div className="text-[10px] uppercase tracking-[0.22em] text-white/40">Quiz items</div>
              <div className="mt-1 text-white">{generatedContent?.quiz?.length || topic.quiz?.length || 0}</div>
            </div>
          </div>
          {Array.isArray(generatedContent?.keyConcepts) && generatedContent.keyConcepts.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {generatedContent.keyConcepts.map(concept => (
                <span key={concept} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-white/55">
                  {concept}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}
