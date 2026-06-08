require('dotenv').config()
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const axios = require('axios')

const GEMINI_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY
const GEMINI_MODEL = 'gemini-2.5-flash'
const GEMINI_MODEL_FALLBACKS = ['gemini-2.0-flash', 'gemini-flash-latest', 'gemini-2.5-flash-lite']
const topicContentCache = new Map()
const topicMediaCache = new Map()

function getTopicCacheVersion({ title = '', subject = '', visualType = '' } = {}) {
  const normalizedTitle = titleCase(title).toLowerCase()
  const normalizedSubject = String(subject || '').toLowerCase()

  if (normalizedTitle.includes('brain') || (normalizedSubject === 'biology' && visualType === 'interactive-diagram')) {
    return 'brain-human-v3'
  }

  return 'topic-content-v1'
}

function titleCase(value = '') {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function slugify(value = '') {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function buildLocalTopicDraft({ title, subject = 'biology', difficulty = 'beginner' }) {
  const cleanTitle = titleCase(title || 'Untitled Topic')
  const baseSummary = subject === 'biology'
    ? `A visually guided introduction to ${cleanTitle} for beginner learners.`
    : `A dynamic topic page for ${cleanTitle}.`

  const visualType = subject === 'biology'
    ? (cleanTitle.toLowerCase().includes('heart') || cleanTitle.toLowerCase().includes('skeleton') ? 'anatomy-3d' : cleanTitle.toLowerCase().includes('lungs') ? 'simulation' : cleanTitle.toLowerCase().includes('dna') ? 'graph' : cleanTitle.toLowerCase().includes('brain') ? 'interactive-diagram' : 'image-gallery')
    : (difficulty === 'advanced' ? 'graph' : 'interactive-diagram')

  return {
    title: cleanTitle,
    slug: slugify(cleanTitle),
    subject,
    difficulty,
    visualType,
    summary: baseSummary,
    chatbotPrompt: `Explain ${cleanTitle} in a beginner-friendly visual way.`,
    contentBlocks: [
      { type: 'text', heading: `Understand ${cleanTitle}`, body: `This topic uses the dynamic learning engine to generate a visual explanation, quiz, and contextual tutoring for ${cleanTitle}.` },
      { type: 'diagram', title: 'Key idea map', items: ['Concept', 'Visual structure', 'Step-by-step flow', 'Knowledge check'] },
      { type: 'quiz', title: 'Quick check', questions: [{ question: `What is the core purpose of ${cleanTitle}?`, options: ['Understand the main role', 'Copy the title', 'Skip the visuals', 'Ignore the structure'], answer: 'Understand the main role', explanation: 'The page should help learners understand the main idea visually.' }] }
    ],
    images: [],
    videos: [],
    model3d: null,
    quiz: [{ question: `What is the core purpose of ${cleanTitle}?`, options: ['Understand the main role', 'Copy the title', 'Skip the visuals', 'Ignore the structure'], answer: 'Understand the main role', explanation: 'The page should help learners understand the main idea visually.' }],
    model3dSuggestions: []
  }
}

function safeParseGeminiJson(text) {
  if (!text) return null

  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')

  try {
    return JSON.parse(cleaned)
  } catch (firstError) {
    const repaired = repairGeminiJsonText(cleaned)
    if (repaired !== cleaned) {
      try {
        return JSON.parse(repaired)
      } catch (secondRepairError) {
        console.error('Gemini JSON repair failed', { firstError: firstError.message, secondRepairError: secondRepairError.message, text: repaired })
      }
    }

    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1))
      } catch (secondError) {
        console.error('Gemini JSON parse failed', { firstError: firstError.message, secondError: secondError.message, text: cleaned })
        return null
      }
    }

    console.error('Gemini JSON parse failed', { error: firstError.message, text: cleaned })
    return null
  }
}

function repairGeminiJsonText(text) {
  let repaired = ''
  let inString = false
  let escaped = false

  for (const char of text) {
    if (escaped) {
      repaired += char
      escaped = false
      continue
    }

    if (char === '\\') {
      repaired += char
      escaped = true
      continue
    }

    if (char === '"') {
      repaired += char
      inString = !inString
      continue
    }

    if (inString && char === '\n') {
      repaired += '\\n'
      continue
    }

    if (inString && char === '\r') {
      repaired += '\\r'
      continue
    }

    if (inString && char === '\t') {
      repaired += '\\t'
      continue
    }

    repaired += char
  }

  return repaired
}

function isRetryableGeminiError(error) {
  const status = error?.response?.status
  const message = String(error?.response?.data?.error?.message || error?.message || '').toLowerCase()
  return [404, 429, 500, 503].includes(status) || message.includes('not found') || message.includes('high demand') || message.includes('temporarily') || message.includes('unavailable') || message.includes('rate limit')
}

function inferDisplayMode({ title = '', subject = 'biology', difficulty = 'beginner', visualType = '' }) {
  const normalizedTitle = titleCase(title).toLowerCase()
  const normalizedSubject = String(subject || '').toLowerCase()
  const biologyMatches = normalizedSubject === 'biology' || ['heart', 'brain', 'eye', 'skeleton', 'lungs', 'dna'].some(item => normalizedTitle.includes(item))

  if (normalizedTitle.includes('heart') || normalizedTitle.includes('skeleton')) return 'model3d'
  if (normalizedTitle.includes('lungs')) return 'simulation'
  if (normalizedTitle.includes('dna')) return 'mixed'
  if (normalizedTitle.includes('brain')) return 'mixed'
  if (normalizedTitle.includes('eye')) return 'imageGallery'
  if (normalizedSubject === 'physics') return 'simulation'
  if (normalizedSubject === 'electronics') return 'mixed'

  if (!biologyMatches) {
    return difficulty === 'advanced' ? 'mixed' : 'imageGallery'
  }

  return visualType === 'simulation' ? 'simulation' : 'mixed'
}

function buildMediaSearchKeywords({ title, subject = 'biology', visualType = '', displayMode = '' }) {
  const normalizedTitle = titleCase(title).toLowerCase()
  const keywords = new Set([
    normalizedTitle,
    subject,
    `${normalizedTitle} illustration`,
    `${normalizedTitle} diagram`,
    `${normalizedTitle} scientific visual`
  ])

  if (normalizedTitle.includes('heart')) {
    keywords.add('heart anatomy')
    keywords.add('blood flow diagram')
    keywords.add('cardiac illustration')
  }
  if (normalizedTitle.includes('brain')) {
    keywords.add('brain regions')
    keywords.add('neural network diagram')
    keywords.add('brain anatomy')
  }
  if (normalizedTitle.includes('eye')) {
    keywords.add('eye anatomy')
    keywords.add('light path diagram')
    keywords.add('retina illustration')
  }
  if (normalizedTitle.includes('skeleton')) {
    keywords.add('skeleton anatomy')
    keywords.add('bone structure diagram')
    keywords.add('rib cage illustration')
  }
  if (normalizedTitle.includes('lungs')) {
    keywords.add('lung anatomy')
    keywords.add('breathing cycle diagram')
    keywords.add('alveoli illustration')
  }
  if (normalizedTitle.includes('dna')) {
    keywords.add('DNA helix')
    keywords.add('genetic structure diagram')
    keywords.add('molecular illustration')
  }

  if (visualType) keywords.add(visualType)
  if (displayMode) keywords.add(displayMode)

  return Array.from(keywords).filter(Boolean).slice(0, 10)
}

function decodeJsonString(value = '') {
  try {
    return JSON.parse(`"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`)
  } catch (error) {
    return String(value)
  }
}

function stripHtml(value = '') {
  return decodeJsonString(String(value)).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function is3dCapableTopic({ title = '', subject = 'biology', visualType = '' }) {
  const normalizedTitle = titleCase(title).toLowerCase()
  const normalizedSubject = String(subject || '').toLowerCase()
  return normalizedSubject === 'biology' && (
    visualType.includes('3d') ||
    visualType.includes('anatomy') ||
    ['heart', 'brain', 'eye', 'skeleton', 'lungs', 'dna'].some(item => normalizedTitle.includes(item))
  )
}

function buildMediaQueries({ title, subject = 'biology', visualType = '', keywords = [] }) {
  const cleanTitle = titleCase(title)
  const normalizedTitle = cleanTitle.toLowerCase()
  const keywordList = Array.isArray(keywords) ? keywords.filter(Boolean) : []
  const commonsQueries = [
    `${cleanTitle} anatomy`,
    `${cleanTitle} labeled anatomy`,
    `${cleanTitle} transparent png`,
    `${cleanTitle} educational diagram`,
    `${cleanTitle} scientific illustration`,
    ...keywordList.slice(0, 5)
  ].filter(Boolean)

  const youtubeQueries = [
    `${cleanTitle} animation tutorial`,
    `${cleanTitle} educational tutorial`,
    `${cleanTitle} biology explanation`,
    ...keywordList.slice(0, 3).map(keyword => `${keyword} tutorial`)
  ].filter(Boolean)

  const sketchfabQueries = is3dCapableTopic({ title, subject, visualType })
    ? [
        normalizedTitle.includes('brain') ? `${cleanTitle} human brain anatomy 3d model` : null,
        normalizedTitle.includes('brain') ? 'human brain anatomy 3d model' : null,
        normalizedTitle.includes('brain') ? `${cleanTitle} human anatomy 3d model` : null,
        `${cleanTitle} 3d model`,
        `${cleanTitle} anatomy 3d`,
        `${cleanTitle} interactive model`,
        ...keywordList.slice(0, 2).map(keyword => `${keyword} 3d model`)
      ].filter(Boolean)
    : []

  return {
    commonsQueries,
    youtubeQueries,
    sketchfabQueries,
    normalizedTitle
  }
}

async function fetchCommonsImages(queries, desiredCount = 4) {
  const results = []
  const seen = new Set()

  for (const query of queries) {
    if (results.length >= desiredCount) break

    const url = new URL('https://commons.wikimedia.org/w/api.php')
    url.searchParams.set('action', 'query')
    url.searchParams.set('generator', 'search')
    url.searchParams.set('gsrsearch', query)
    url.searchParams.set('gsrnamespace', '6')
    url.searchParams.set('gsrlimit', '10')
    url.searchParams.set('prop', 'imageinfo')
    url.searchParams.set('iiprop', 'url|mime|size|extmetadata')
    url.searchParams.set('iiurlwidth', '960')
    url.searchParams.set('format', 'json')
    url.searchParams.set('origin', '*')

    const response = await fetch(url.toString())
    if (!response.ok) continue

    const data = await response.json()
    const pages = Object.values(data?.query?.pages || {})

    for (const page of pages) {
      const imageInfo = page?.imageinfo?.[0]
      const thumb = imageInfo?.thumburl || imageInfo?.url
      if (!thumb || seen.has(thumb)) continue

      seen.add(thumb)
      const objectName = imageInfo?.extmetadata?.ObjectName?.value || page?.title?.replace(/^File:/i, '') || query
      const caption = stripHtml(
        imageInfo?.extmetadata?.ImageDescription?.value
          || imageInfo?.extmetadata?.ObjectName?.value
          || objectName
      )

      results.push({
        label: stripHtml(objectName),
        caption,
        kind: 'image',
        src: thumb,
        href: imageInfo?.descriptionurl || imageInfo?.url || null,
        provider: 'wikimedia-commons',
        mime: imageInfo?.mime || '',
        width: imageInfo?.width || 0,
        height: imageInfo?.height || 0,
        rawTitle: page?.title || objectName
      })

      if (results.length >= desiredCount) break
    }
  }

  return results.slice(0, desiredCount)
}

function scoreCommonsImage(image, { title, subject = 'biology', visualType = '' }) {
  const normalizedTitle = titleCase(title).toLowerCase()
  const text = [image.label, image.caption, image.rawTitle, image.href].filter(Boolean).join(' ').toLowerCase()
  const qualityTerms = ['anatomy', 'labeled', 'labelled', 'diagram', 'illustration', 'cutaway', 'transparent', 'vector', 'svg', 'educational']
  const negativeTerms = ['scan', 'mri', 'ct', 'xray', 'radiograph', 'ultrasound', 'microscopy', 'monochrome', 'grayscale', 'grey scale', 'black and white']
  let score = 0

  if (image.mime === 'image/png') score += 18
  if (image.mime === 'image/svg+xml') score += 14
  if (image.mime === 'image/webp') score += 8
  if ((image.width || 0) >= 1000 && (image.height || 0) >= 700) score += 8
  if ((image.width || 0) < 700 || (image.height || 0) < 500) score -= 20

  qualityTerms.forEach(term => {
    if (text.includes(term)) score += 8
  })

  negativeTerms.forEach(term => {
    if (text.includes(term)) score -= 18
  })

  if (text.includes(normalizedTitle)) score += 10
  if (normalizedTitle.includes('heart') && text.includes('flow')) score += 5
  if (normalizedTitle.includes('brain') && (text.includes('regions') || text.includes('neur'))) score += 5
  if (normalizedTitle.includes('eye') && (text.includes('layer') || text.includes('focus'))) score += 5
  if (normalizedTitle.includes('skeleton') && (text.includes('bone') || text.includes('rib'))) score += 5
  if (normalizedTitle.includes('lungs') && (text.includes('breath') || text.includes('alveoli'))) score += 5
  if (normalizedTitle.includes('dna') && (text.includes('helix') || text.includes('gene'))) score += 5

  if (subject === 'biology' && visualType.includes('anatomy')) score += 4

  return score
}

function curateCommonsImages(images, context) {
  const unique = []
  const seen = new Set()

  for (const image of images) {
    if (!image?.src || seen.has(image.src)) continue
    seen.add(image.src)
    unique.push({
      ...image,
      score: scoreCommonsImage(image, context)
    })
  }

  return unique.sort((left, right) => right.score - left.score)
}

function extractYouTubeResults(html, titleFallback) {
  const videoIds = [...new Set([...html.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)].map(match => match[1]))]
  const results = []

  for (const videoId of videoIds) {
    if (results.length >= 3) break
    const index = html.indexOf(`"videoId":"${videoId}"`)
    const snippet = index >= 0 ? html.slice(Math.max(0, index - 1600), Math.min(html.length, index + 2800)) : html
    const titleMatch = snippet.match(/"title":\{\"runs\":\[\{\"text\":\"([^\"]+)/)
    const channelMatch = snippet.match(/"longBylineText":\{\"runs\":\[\{\"text\":\"([^\"]+)/)

    results.push({
      label: decodeJsonString(titleMatch?.[1] || `${titleFallback} tutorial`),
      caption: `${decodeJsonString(channelMatch?.[1] || 'YouTube')} • Educational tutorial`,
      kind: 'video',
      src: `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`,
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      href: `https://www.youtube.com/watch?v=${videoId}`,
      provider: 'youtube'
    })
  }

  return results
}

async function fetchYouTubeVideos(queries, titleFallback) {
  const results = []
  const seen = new Set()

  for (const query of queries) {
    if (results.length >= 3) break

    const response = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, {
      headers: {
        'user-agent': 'Mozilla/5.0',
        accept: 'text/html'
      }
    })

    if (!response.ok) continue

    const html = await response.text()
    const candidates = extractYouTubeResults(html, titleFallback)

    for (const candidate of candidates) {
      if (results.length >= 3) break
      if (seen.has(candidate.src)) continue
      seen.add(candidate.src)
      results.push(candidate)
    }
  }

  return results
}

async function fetchSketchfabModel(queries, titleFallback) {
  const normalizedFallback = titleCase(titleFallback).toLowerCase()
  const isBrainTopic = normalizedFallback.includes('brain')
  const humanBrainEmbedUrl = 'https://sketchfab.com/models/e073c2590bc24daaa7323f4daa5b7784/embed'
  const humanBrainPageUrl = 'https://sketchfab.com/3d-models/human-brain-e073c2590bc24daaa7323f4daa5b7784'
  const allowedBrainTerms = ['human', 'adult', 'anatomy', 'cerebrum', 'cortex', 'brain']
  const blockedBrainTerms = ['rat', 'mouse', 'mice', 'rodent', 'murine', 'animal']

  if (isBrainTopic) {
    return {
      label: 'Human brain 3D model',
      caption: 'Pinned Sketchfab human brain model',
      kind: '3d-model',
      src: null,
      embedUrl: humanBrainEmbedUrl,
      href: humanBrainPageUrl,
      provider: 'sketchfab'
    }
  }

  const isAllowedBrainCandidate = candidate => {
    if (!isBrainTopic) return true

    const candidateText = [
      candidate?.name,
      candidate?.description,
      ...(Array.isArray(candidate?.tags) ? candidate.tags : [])
    ].filter(Boolean).join(' ').toLowerCase()

    if (blockedBrainTerms.some(term => candidateText.includes(term))) return false
    return allowedBrainTerms.some(term => candidateText.includes(term))
  }

  for (const query of queries) {
    const url = new URL('https://api.sketchfab.com/v3/search')
    url.searchParams.set('type', 'models')
    url.searchParams.set('q', query)

    const response = await fetch(url.toString(), {
      headers: {
        'user-agent': 'Mozilla/5.0',
        accept: 'application/json'
      }
    })

    if (!response.ok) continue

    const data = await response.json()
    const candidate = Array.isArray(data?.results)
      ? data.results.find(item => (item?.embedUrl || item?.viewerUrl) && isAllowedBrainCandidate(item))
      : null
    if (!candidate) continue

    const thumbnails = Array.isArray(candidate?.thumbnails?.images) ? candidate.thumbnails.images : []
    const thumbnail = thumbnails.slice().sort((left, right) => (right.width || 0) - (left.width || 0))[0]?.url || null

    return {
      label: candidate?.name || `${titleFallback} 3D model`,
      caption: 'Interactive Sketchfab 3D embed',
      kind: '3d-model',
      src: thumbnail,
      embedUrl: candidate?.embedUrl || null,
      href: candidate?.viewerUrl || candidate?.uri || null,
      provider: 'sketchfab'
    }
  }

  return null
}

async function buildTopicMedia({ title, subject = 'biology', difficulty = 'beginner', visualType = '', mediaKeywords = [] }) {
  const cacheKey = `${getTopicCacheVersion({ title, subject, visualType })}:${subject}:${title}:${difficulty}:${visualType}:${Array.isArray(mediaKeywords) ? mediaKeywords.join('|') : ''}`.toLowerCase()
  if (topicMediaCache.has(cacheKey)) {
    return topicMediaCache.get(cacheKey)
  }

  const cleanTitle = titleCase(title || 'Untitled Topic')
  const querySet = buildMediaQueries({ title: cleanTitle, subject, visualType, keywords: mediaKeywords })

  const [rawImages, videos, sketchfabModel] = await Promise.all([
    fetchCommonsImages(querySet.commonsQueries, 12).catch(error => {
      console.warn('Commons media fetch failed', error?.message || error)
      return []
    }),
    fetchYouTubeVideos(querySet.youtubeQueries, cleanTitle).catch(error => {
      console.warn('YouTube media fetch failed', error?.message || error)
      return []
    }),
    fetchSketchfabModel(querySet.sketchfabQueries, cleanTitle).catch(error => {
      console.warn('Sketchfab media fetch failed', error?.message || error)
      return null
    })
  ])

  const curatedImages = curateCommonsImages(rawImages, { title: cleanTitle, subject, visualType }).slice(0, 2)
  // Inject high-quality inline SVGs for core biology topics to guarantee crisp anatomy visuals
  const normalized = (querySet && querySet.normalizedTitle) ? querySet.normalizedTitle : cleanTitle.toLowerCase()
  function makeDataUri(svg) {
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
  }

  if (normalized.includes('eye')) {
    const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 720'><rect width='1200' height='720' rx='48' fill='#050505'/><g transform='translate(120,80)'><g transform='translate(240,160)'><ellipse cx='300' cy='200' rx='360' ry='160' fill='rgba(255,255,255,0.02)' stroke='rgba(255,255,255,0.06)'/><ellipse cx='300' cy='200' rx='260' ry='100' fill='rgba(255,255,255,0.03)' stroke='rgba(255,255,255,0.08)'/><circle cx='300' cy='200' r='60' fill='rgba(255,255,255,0.12)' /><circle cx='300' cy='200' r='28' fill='#050505' /></g><g transform='translate(20,420)'><text x='0' y='0' fill='#ffffff' font-size='22' font-family='Arial'>Eye anatomy</text><text x='0' y='36' fill='#d6d6d6' font-size='18' font-family='Arial'>Cornea, lens, retina, optic nerve</text></g></g></svg>`
    curatedImages.unshift({ label: 'Eye anatomy', caption: 'High-res vector anatomy', kind: 'image', src: makeDataUri(svg), href: null, provider: 'inline-svg', mime: 'image/svg+xml', width: 1200, height: 720, rawTitle: 'inline-eye' })
  }

  if (normalized.includes('skeleton')) {
    const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 720'><rect width='1200' height='720' rx='48' fill='#050505'/><g transform='translate(120,60)'><g transform='translate(220,80) scale(0.9)'><rect x='260' y='40' width='160' height='200' rx='80' fill='rgba(255,255,255,0.03)' stroke='rgba(255,255,255,0.06)' /><rect x='230' y='240' width='220' height='320' rx='26' fill='rgba(255,255,255,0.02)' stroke='rgba(255,255,255,0.05)' /><path d='M340 260 v120 M420 260 v120' stroke='rgba(255,255,255,0.08)' stroke-width='12' stroke-linecap='round' /><circle cx='350' cy='100' r='48' fill='rgba(255,255,255,0.12)' /></g><g transform='translate(20,440)'><text x='0' y='0' fill='#ffffff' font-size='22' font-family='Arial'>Skeleton frame</text><text x='0' y='36' fill='#d6d6d6' font-size='18' font-family='Arial'>Skull, spine, ribs, long bones</text></g></g></svg>`
    curatedImages.unshift({ label: 'Skeleton anatomy', caption: 'High-res vector skeleton', kind: 'image', src: makeDataUri(svg), href: null, provider: 'inline-svg', mime: 'image/svg+xml', width: 1200, height: 720, rawTitle: 'inline-skeleton' })
  }

  if (normalized.includes('lungs')) {
    const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 720'><rect width='1200' height='720' rx='48' fill='#050505'/><g transform='translate(160,80)'><g transform='translate(200,80)'><path d='M220 120 C180 60, 120 60, 120 220 C120 360, 220 420, 300 420' fill='rgba(255,255,255,0.03)' stroke='rgba(255,255,255,0.06)'/><path d='M420 120 C460 60, 520 60, 520 220 C520 360, 420 420, 340 420' fill='rgba(255,255,255,0.03)' stroke='rgba(255,255,255,0.06)'/><rect x='300' y='40' width='40' height='220' rx='10' fill='rgba(255,255,255,0.04)' /></g><g transform='translate(20,420)'><text x='0' y='0' fill='#ffffff' font-size='22' font-family='Arial'>Lung exchange</text><text x='0' y='36' fill='#d6d6d6' font-size='18' font-family='Arial'>Inhale, alveoli gas exchange, exhale</text></g></g></svg>`
    curatedImages.unshift({ label: 'Lung anatomy', caption: 'High-res vector lungs', kind: 'image', src: makeDataUri(svg), href: null, provider: 'inline-svg', mime: 'image/svg+xml', width: 1200, height: 720, rawTitle: 'inline-lungs' })
  }

  if (normalized.includes('dna')) {
    const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 720'><rect width='1200' height='720' rx='48' fill='#050505'/><g transform='translate(240,60)'><g transform='translate(200,60)'><path d='M80 60 C140 160, 220 260, 280 360 C340 460, 420 560, 480 660' stroke='rgba(255,255,255,0.06)' stroke-width='14' fill='none' /><path d='M140 60 C200 160, 280 260, 340 360 C400 460, 480 560, 540 660' stroke='rgba(255,255,255,0.06)' stroke-width='14' fill='none' /><g stroke='rgba(255,255,255,0.05)' stroke-width='8'><path d='M110 120 L170 200' /><path d='M170 200 L230 280' /><path d='M230 280 L290 360' /></g></g><g transform='translate(20,420)'><text x='0' y='0' fill='#ffffff' font-size='22' font-family='Arial'>DNA helix</text><text x='0' y='36' fill='#d6d6d6' font-size='18' font-family='Arial'>Base pairing and double helix structure</text></g></g></svg>`
    curatedImages.unshift({ label: 'DNA helix', caption: 'High-res vector DNA', kind: 'image', src: makeDataUri(svg), href: null, provider: 'inline-svg', mime: 'image/svg+xml', width: 1200, height: 720, rawTitle: 'inline-dna' })
  }
  const heroImage = curatedImages[0] || null
  const supportingImage = curatedImages[1] || null
  const curatedVideos = videos.slice(0, 3)
  const mediaGallery = curatedImages.map(image => ({
    label: image.label,
    caption: image.caption,
    kind: 'image',
    src: image.src,
    href: image.href,
    provider: image.provider
  }))

  const media = {
    mediaKeywords,
    images: curatedImages,
    heroImage,
    supportingImage,
    videos: curatedVideos.map(video => ({
      title: video.label,
      caption: video.caption,
      src: video.src,
      thumbnail: video.thumbnail,
      href: video.href,
      provider: video.provider
    })),
    mediaGallery,
    model3d: sketchfabModel?.embedUrl || null,
    model3dThumbnail: sketchfabModel?.src || null,
    model3dProvider: sketchfabModel?.provider || null,
    mediaState: {
      hasImages: curatedImages.length > 0,
      hasVideos: curatedVideos.length > 0,
      hasModel3d: Boolean(sketchfabModel)
    },
    warning: !curatedImages.length && !curatedVideos.length && !sketchfabModel
      ? 'No external media could be fetched for this topic. Showing text-based guidance instead.'
      : ''
  }

  topicMediaCache.set(cacheKey, media)
  return media
}

async function augmentTopicContent(content, meta) {
  const media = await buildTopicMedia(meta)
  const mergedKeyConcepts = Array.isArray(content?.keyConcepts) && content.keyConcepts.length ? content.keyConcepts : media.mediaKeywords.slice(0, 4)
  const mergedQuiz = Array.isArray(content?.quiz) && content.quiz.length ? content.quiz : buildLocalTopicContent(meta).quiz

  return {
    ...content,
    displayMode: content?.displayMode || media.displayMode,
    simulationType: content?.simulationType || media.simulationType,
    mediaKeywords: content?.mediaKeywords || media.mediaKeywords,
    mediaGallery: Array.isArray(content?.mediaGallery) && content.mediaGallery.length ? content.mediaGallery : media.mediaGallery,
    images: Array.isArray(content?.images) && content.images.length ? content.images : media.images,
    videos: Array.isArray(content?.videos) && content.videos.length ? content.videos : media.videos,
    model3d: media.model3d || content?.model3d || null,
    model3dThumbnail: media.model3dThumbnail || null,
    model3dProvider: media.model3dProvider || null,
    model3dSuggestions: Array.isArray(content?.model3dSuggestions) && content.model3dSuggestions.length ? content.model3dSuggestions : (media.model3d ? [media.model3d] : []),
    summary: content?.summary || buildLocalTopicContent(meta).summary,
    explanation: content?.explanation || buildLocalTopicContent(meta).explanation,
    keyConcepts: mergedKeyConcepts,
    tutoringContext: content?.tutoringContext || buildLocalTopicContent(meta).tutoringContext,
    quiz: mergedQuiz,
    visualHighlights: Array.isArray(content?.visualHighlights) && content.visualHighlights.length ? content.visualHighlights : mergedKeyConcepts,
    mediaWarning: media.warning || ''
  }
}

function buildLocalTopicContent({ title, subject = 'biology', difficulty = 'beginner', visualType = 'interactive-diagram' }) {
  const cleanTitle = titleCase(title || 'Untitled Topic')
  const normalizedSubject = String(subject || '').toLowerCase()
  const isBiology = normalizedSubject === 'biology'

  const summaryByTopic = {
    heart: 'The heart is a muscular pump that keeps blood moving so oxygen can reach every part of the body.',
    brain: 'The brain is the control center that processes signals, coordinates movement, and supports memory.',
    eye: 'The eye turns light into a visual signal and sends it to the brain for interpretation.',
    skeleton: 'The skeleton gives the body structure, protects vital organs, and helps movement happen safely.',
    lungs: 'The lungs move oxygen into the blood and remove carbon dioxide through the breathing cycle.',
    dna: 'DNA stores the instructions that tell living things how to build and run their cells.'
  }

  const explanationByTopic = {
    heart: 'Blood enters the heart, moves through chambers, passes through valves, and is pumped either to the lungs or the rest of the body. The right side sends blood to the lungs, and the left side sends it to the body.',
    brain: 'Different brain regions work like a coordinated network. The cerebrum handles thinking, the cerebellum handles balance, and the brainstem keeps automatic functions running.',
    eye: 'Light enters through the cornea, gets focused by the lens, lands on the retina, and then the optic nerve carries the image signal to the brain.',
    skeleton: 'Bones act like an internal frame. The skull protects the brain, the rib cage protects the chest organs, and joints let muscles move the body with control.',
    lungs: 'When you inhale, air enters the lungs and oxygen moves into the blood in the alveoli. When you exhale, carbon dioxide leaves the body so the cycle can repeat.',
    dna: 'DNA is a double helix made of two strands. Matching base pairs carry the code, and genes are the instruction sections cells read to build proteins.'
  }

  const keyConceptsByTopic = {
    heart: ['Chambers', 'Valves', 'Blood flow', 'Oxygenated vs. deoxygenated blood'],
    brain: ['Cerebrum', 'Cerebellum', 'Brainstem', 'Neural signals'],
    eye: ['Cornea', 'Lens', 'Retina', 'Optic nerve'],
    skeleton: ['Skull', 'Rib cage', 'Spine', 'Joints'],
    lungs: ['Trachea', 'Bronchi', 'Alveoli', 'Diaphragm'],
    dna: ['Double helix', 'Base pairs', 'Genes', 'Chromosomes']
  }

  const tutoringContextByTopic = {
    heart: 'Explain the heart as a circulation pump. Use simple arrows, chamber labels, and the idea of one-way flow.',
    brain: 'Explain the brain as a signal network. Keep the language simple and visually map each region to its job.',
    eye: 'Explain the eye as a light-to-signal machine. Focus on the path from cornea to lens to retina to brain.',
    skeleton: 'Explain the skeleton as an internal frame. Connect structure, protection, and movement in one visual story.',
    lungs: 'Explain the lungs as a breathing exchange system. Show the inhale/exhale cycle and the gas swap clearly.',
    dna: 'Explain DNA as genetic code. Keep the explanation beginner-friendly and use the double helix as the main visual metaphor.'
  }

  const questionBank = {
    heart: [
      { question: 'Which side of the heart sends blood to the lungs?', options: ['Right side', 'Left side', 'Top chamber only', 'Both sides at once'], answer: 'Right side', explanation: 'The right side sends blood to the lungs to pick up oxygen.' },
      { question: 'What do valves mainly do?', options: ['Keep blood flowing one way', 'Create oxygen', 'Filter food', 'Store energy'], answer: 'Keep blood flowing one way', explanation: 'Valves stop blood from moving backward.' }
    ],
    brain: [
      { question: 'Which part helps with balance and coordination?', options: ['Cerebellum', 'Retina', 'Stomach', 'Rib cage'], answer: 'Cerebellum', explanation: 'The cerebellum helps fine-tune movement and balance.' },
      { question: 'What do neurons do?', options: ['Carry signals', 'Digest food', 'Pump blood', 'Build bone'], answer: 'Carry signals', explanation: 'Neurons pass electrical and chemical signals through the nervous system.' }
    ],
    eye: [
      { question: 'Which part focuses light?', options: ['Lens', 'Rib', 'Kidney', 'Femur'], answer: 'Lens', explanation: 'The lens bends light so it lands clearly on the retina.' },
      { question: 'What sends signals from the eye to the brain?', options: ['Optic nerve', 'Tendon', 'Valve', 'Cartilage'], answer: 'Optic nerve', explanation: 'The optic nerve carries the visual signal to the brain.' }
    ],
    skeleton: [
      { question: 'Which bone area protects the brain?', options: ['Skull', 'Femur', 'Tibia', 'Humerus'], answer: 'Skull', explanation: 'The skull surrounds and protects the brain.' },
      { question: 'Why do bones matter for movement?', options: ['They give muscles something to pull on', 'They create light', 'They replace nerves', 'They stop breathing'], answer: 'They give muscles something to pull on', explanation: 'Muscles pull on bones to create movement.' }
    ],
    lungs: [
      { question: 'What gas do lungs bring into the blood?', options: ['Oxygen', 'Nitrogen', 'Helium', 'Smoke'], answer: 'Oxygen', explanation: 'Oxygen moves from the lungs into the bloodstream.' },
      { question: 'What gas do lungs remove from the body?', options: ['Carbon dioxide', 'Gold', 'Waterproofing', 'Calcium'], answer: 'Carbon dioxide', explanation: 'Carbon dioxide is carried out during exhalation.' }
    ],
    dna: [
      { question: 'What shape is DNA usually shown as?', options: ['Double helix', 'Square grid', 'Flat circle', 'Triangle spiral'], answer: 'Double helix', explanation: 'DNA is commonly illustrated as a twisting ladder or double helix.' },
      { question: 'Which base pairs with adenine?', options: ['Thymine', 'Guanine', 'Cytosine', 'Ribose'], answer: 'Thymine', explanation: 'Adenine pairs with thymine in DNA.' }
    ]
  }

  const normalizedTitle = cleanTitle.toLowerCase()
  const baseSummary = isBiology && summaryByTopic[normalizedTitle]
    ? summaryByTopic[normalizedTitle]
    : `A beginner-friendly overview of ${cleanTitle}.`

  const explanation = isBiology && explanationByTopic[normalizedTitle]
    ? explanationByTopic[normalizedTitle]
    : `This topic is presented in a visual learning style so students can connect the structure, function, and key ideas more easily.`

  return {
    title: cleanTitle,
    slug: slugify(cleanTitle),
    subject: normalizedSubject || subject,
    difficulty,
    visualType,
    summary: baseSummary,
    explanation,
    keyConcepts: isBiology && keyConceptsByTopic[normalizedTitle] ? keyConceptsByTopic[normalizedTitle] : ['Core idea', 'Visual structure', 'Function', 'Self-check'],
    tutoringContext: isBiology && tutoringContextByTopic[normalizedTitle] ? tutoringContextByTopic[normalizedTitle] : `Explain ${cleanTitle} in a simple, visual, beginner-friendly way.`,
    quiz: questionBank[normalizedTitle] || [
      {
        question: `What is the main idea of ${cleanTitle}?`,
        options: ['Understand the concept', 'Skip the details', 'Ignore the structure', 'Memorize random facts'],
        answer: 'Understand the concept',
        explanation: 'The goal is to learn the topic with a clear visual explanation.'
      }
    ],
    visualHighlights: isBiology && keyConceptsByTopic[normalizedTitle] ? keyConceptsByTopic[normalizedTitle] : ['Visual overview', 'Key labels', 'Guided explanation'],
    contentBlocks: [
      {
        type: 'text',
        heading: `Beginner summary: ${cleanTitle}`,
        body: baseSummary
      },
      {
        type: 'text',
        heading: `Detailed explanation`,
        body: explanation
      },
      {
        type: 'key-concepts',
        title: 'Key concepts',
        items: isBiology && keyConceptsByTopic[normalizedTitle] ? keyConceptsByTopic[normalizedTitle] : ['Core idea', 'Visual structure', 'Function', 'Self-check']
      }
    ]
  }
}

async function callGemini(prompt, generationConfigOverrides = {}) {
  if (!GEMINI_KEY) return null

  const candidateModels = [GEMINI_MODEL, ...GEMINI_MODEL_FALLBACKS]
  let lastError = null

  for (const model of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`
      const response = await axios.post(url, {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1200,
          responseMimeType: 'application/json',
          ...generationConfigOverrides
        }
      })

      return response.data
    } catch (error) {
      lastError = error
      if (!isRetryableGeminiError(error)) {
        throw error
      }
      console.warn(`Gemini model ${model} is unavailable, trying next candidate.`)
    }
  }

  throw lastError || new Error('Gemini model request failed')
}

async function callGeminiJson(prompt, generationConfigOverrides = {}) {
  if (!GEMINI_KEY) return { response: null, parsed: null, model: null }

  const candidateModels = [GEMINI_MODEL, ...GEMINI_MODEL_FALLBACKS]
  let lastError = null

  for (const model of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`
      const response = await axios.post(url, {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1200,
          responseMimeType: 'application/json',
          ...generationConfigOverrides
        }
      })

      const text = extractGeminiText(response.data)
      const parsed = safeParseGeminiJson(text)
      if (parsed) {
        return { response: response.data, parsed, model }
      }

      lastError = new Error(`Gemini model ${model} returned invalid JSON`)
      console.warn(`Gemini model ${model} returned invalid JSON, trying next candidate.`)
    } catch (error) {
      lastError = error
      if (!isRetryableGeminiError(error)) {
        throw error
      }
      console.warn(`Gemini model ${model} is unavailable, trying next candidate.`)
    }
  }

  return { response: null, parsed: null, model: null, error: lastError }
}

function extractGeminiText(responseData) {
  const parts = responseData?.candidates?.[0]?.content?.parts || []
  return parts.map(part => part.text || '').join('\n').trim()
}

function logGeminiError(scope, err) {
  const actualError = err?.response?.data || err?.message || err
  console.error(scope, actualError)
}

const app = express()
app.use(cors())
app.use(bodyParser.json())

// Pre-warm topic content for key biology topics so pages load production-ready content immediately.
async function prewarmTopicCache() {
  try {
    const topicsToWarm = ['Eye', 'Skeleton', 'Lungs', 'DNA']
    for (const title of topicsToWarm) {
      const meta = { title, subject: 'biology', difficulty: 'beginner', visualType: '' }
      try {
        // Use local draft and let buildTopicMedia inject inline SVGs for core topics
        const draft = buildLocalTopicContent(meta)
        const content = await augmentTopicContent(draft, meta)
        const cacheKey = `${getTopicCacheVersion(meta)}:${meta.subject}:${meta.title}:${meta.difficulty}:${meta.visualType}`.toLowerCase()
        const serverVersion = new Date().toISOString()
        topicContentCache.set(cacheKey, { content, serverVersion })
        console.log('Pre-warmed topic cache:', title)
      } catch (err) {
        console.warn('Failed to pre-warm topic', title, err?.message || err)
      }
    }
  } catch (err) {
    console.warn('Topic pre-warm failed', err?.message || err)
  }
}

// /api/assistant - proxies prompts to a server-side Gemini/Generative API.
// Keeps the Gemini API key on the server. If the key is not set,
// returns a safe local stub for development.
app.post('/api/assistant', async (req, res) => {
  const { prompt, topicId, topicPrompt = '', context = '' } = req.body
  if (!GEMINI_KEY) {
    // Development fallback: simple stub response
    return res.json({ answer: `(dev-stub) ${topicPrompt || context ? `${topicPrompt || context} ` : ''}Explain like I'm a beginner: ${prompt}` })
  }

  try {
    const answerPrompt = [
      'You are an educational assistant for a visual learning platform.',
      'Answer simply, clearly, and in a student-friendly way.',
      topicPrompt ? `Topic tutoring context: ${topicPrompt}` : '',
      context ? `Additional context: ${context}` : '',
      `Student question: ${prompt}`
    ].filter(Boolean).join('\n')

    const resp = await callGemini(answerPrompt)
    const answer = extractGeminiText(resp) || JSON.stringify(resp)

    return res.json({ answer })
  } catch (err) {
    logGeminiError('AI proxy error', err)
    const fallbackAnswer = `(fallback) ${topicPrompt || context ? `${topicPrompt || context} ` : ''}Explain like I'm a beginner: ${prompt}`
    return res.json({
      answer: fallbackAnswer,
      source: 'local-fallback',
      warning: 'Gemini tutor request failed. Using a local fallback response.'
    })
  }
})

app.post('/api/topic-draft', async (req, res) => {
  const { title, subject = 'biology', difficulty = 'beginner' } = req.body || {}
  const localDraft = buildLocalTopicDraft({ title, subject, difficulty })

  if (!GEMINI_KEY) {
    return res.json({ draft: localDraft, source: 'local' })
  }

  try {
    const prompt = [
      'Generate a JSON object for a dynamic visual learning topic.',
      'Return valid JSON only, with the following keys:',
      '{"title","slug","subject","difficulty","visualType","summary","contentBlocks","images","videos","model3d","model3dSuggestions","quiz","chatbotPrompt"}',
      'Use short beginner-friendly language.',
      'If the subject is biology, prefer anatomy, simulation, image-gallery, graph, or interactive-diagram.',
      `Topic title: ${title}`,
      `Subject: ${subject}`,
      `Difficulty: ${difficulty}`
    ].join('\n')

    const response = await callGeminiJson(prompt)
    const draft = response.parsed || localDraft
    const enrichedDraft = await augmentTopicContent(draft, { title, subject, difficulty })

    return res.json({ draft: enrichedDraft, source: response.parsed ? 'gemini' : 'local-fallback' })
  } catch (err) {
    logGeminiError('Topic draft generation error', err)
    return res.json({ draft: await augmentTopicContent(localDraft, { title, subject, difficulty }), source: 'local-fallback' })
  }
})

app.post('/api/topic-content', async (req, res) => {
  const { title, subject = 'biology', difficulty = 'beginner', visualType = 'interactive-diagram' } = req.body || {}
  const cacheKey = `${getTopicCacheVersion({ title, subject, visualType })}:${subject}:${title}:${difficulty}:${visualType}`.toLowerCase()

  if (topicContentCache.has(cacheKey)) {
    const entry = topicContentCache.get(cacheKey) || {}
    return res.json({ content: entry.content || null, source: 'memory-cache', serverVersion: entry.serverVersion || null })
  }

  const localContent = buildLocalTopicContent({ title, subject, difficulty, visualType })

  if (!GEMINI_KEY) {
    const serverVersion = new Date().toISOString()
    topicContentCache.set(cacheKey, { content: localContent, serverVersion })
    return res.json({ content: localContent, source: 'local', serverVersion })
  }

  try {
    const contentSchema = {
      type: 'OBJECT',
      properties: {
        summary: { type: 'STRING' },
        explanation: { type: 'STRING' },
        keyConcepts: {
          type: 'ARRAY',
          items: { type: 'STRING' }
        },
        quiz: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              question: { type: 'STRING' },
              options: {
                type: 'ARRAY',
                items: { type: 'STRING' }
              },
              answer: { type: 'STRING' },
              explanation: { type: 'STRING' }
            },
            required: ['question', 'options', 'answer', 'explanation']
          }
        },
        tutoringContext: { type: 'STRING' },
        visualHighlights: {
          type: 'ARRAY',
          items: { type: 'STRING' }
        }
      },
      required: ['summary', 'explanation', 'keyConcepts', 'quiz', 'tutoringContext', 'visualHighlights']
    }

    const prompt = [
      'Generate educational content for a topic page as valid JSON only.',
      'Use this schema:',
      '{"summary":"","explanation":"","keyConcepts":[""],"quiz":[{"question":"","options":[""],"answer":"","explanation":""}],"tutoringContext":"","visualHighlights":[""]}',
      'Write for beginner learners, keep language simple, and stay topic-focused.',
      'Return compact JSON with no markdown, no bullet lists inside strings, and no literal line breaks inside any string value.',
      'If the topic is Biology, emphasize anatomy, structure, function, and visual understanding.',
      `Topic title: ${title}`,
      `Subject: ${subject}`,
      `Difficulty: ${difficulty}`,
      `Visual type: ${visualType}`
    ].join('\n')

    const response = await callGeminiJson(prompt, { responseSchema: contentSchema })
    const content = await augmentTopicContent(response.parsed || localContent, { title, subject, difficulty, visualType })

    const serverVersion = new Date().toISOString()
    topicContentCache.set(cacheKey, { content, serverVersion })
    return res.json({ content, source: response.parsed ? 'gemini' : 'local-fallback', warning: content.mediaWarning || '', serverVersion })
  } catch (err) {
    logGeminiError('Topic content generation error', err)
    const fallbackContent = await augmentTopicContent(localContent, { title, subject, difficulty, visualType })
    const serverVersion = new Date().toISOString()
    topicContentCache.set(cacheKey, { content: fallbackContent, serverVersion })
    return res.json({ content: fallbackContent, source: 'local-fallback', warning: fallbackContent.mediaWarning || 'Gemini content generation failed. Using generated fallback visuals and explanations.', serverVersion })
  }
})

const port = process.env.PORT || 8787
prewarmTopicCache().catch(() => {})
app.listen(port, () => console.log('Server listening on', port))
