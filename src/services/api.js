import axios from 'axios'

const VITE_GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
export const hasGeminiClientConfig = Boolean(VITE_GEMINI_API_KEY)

if (!hasGeminiClientConfig) {
  console.warn('VITE_GEMINI_API_KEY is not set. Gemini requests will depend on the server-side fallback.')
}

function normalizeApiError(error, fallbackMessage) {
  const serverMessage = error?.response?.data?.details?.error?.message
    || error?.response?.data?.details?.message
    || error?.response?.data?.error
    || error?.message
    || fallbackMessage
  const normalized = new Error(serverMessage)
  normalized.status = error?.response?.status
  normalized.details = error?.response?.data?.details || error?.response?.data || null
  normalized.isGeminiError = true
  return normalized
}

export async function askAssistant({topicId, prompt, topicPrompt = '', context = ''}){
  try {
    const res = await axios.post('/api/assistant', {topicId, prompt, topicPrompt, context})
    return res.data
  } catch (error) {
    throw normalizeApiError(error, 'The AI tutor is unavailable right now.')
  }
}

export async function requestTopicDraft({ title, subject, difficulty }){
  try {
    const res = await axios.post('/api/topic-draft', { title, subject, difficulty })
    return res.data
  } catch (error) {
    throw normalizeApiError(error, 'Failed to generate the topic draft.')
  }
}

export async function requestTopicContent({ title, subject, difficulty, visualType }){
  try {
    const base = import.meta.env.DEV ? 'http://localhost:8787' : ''
    const res = await axios.post(`${base}/api/topic-content`, { title, subject, difficulty, visualType })
    return res.data
  } catch (error) {
    throw normalizeApiError(error, 'Failed to generate topic content.')
  }
}
