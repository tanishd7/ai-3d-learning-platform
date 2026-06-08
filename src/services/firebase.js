import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, getDocs, query, where } from 'firebase/firestore'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { deleteDoc, doc } from 'firebase/firestore'
import {
  BIOLOGY_SUBJECT,
  createTopicDraft,
  getSeedTopicBySlug,
  getSeedTopicsForSubject,
  normalizeTopicRecord,
  slugify
} from '../lib/topicContent'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const storage = getStorage(app)

function normalizeSubjectRecord(subject = {}) {
  return {
    ...subject,
    title: subject.title || '',
    slug: subject.slug || slugify(subject.title || ''),
    description: subject.description || '',
    visualType: subject.visualType || (subject.slug === BIOLOGY_SUBJECT.slug ? BIOLOGY_SUBJECT.visualType : 'interactive-diagram')
  }
}

async function loadSubjectMatch(subjectSlugOrId) {
  // If Firebase is not configured, return built-in biology subject when requested
  if (!firebaseConfig.apiKey) {
    if (subjectSlugOrId === BIOLOGY_SUBJECT.slug || subjectSlugOrId === BIOLOGY_SUBJECT.id) {
      return { ...BIOLOGY_SUBJECT }
    }
    return null
  }

  const subjectsSnap = await getDocs(collection(db, 'subjects'))
  const match = subjectsSnap.docs.find(docSnap => docSnap.id === subjectSlugOrId || docSnap.data().slug === subjectSlugOrId)

  if (match) {
    return { id: match.id, ...match.data() }
  }

  if (subjectSlugOrId === BIOLOGY_SUBJECT.slug || subjectSlugOrId === BIOLOGY_SUBJECT.id) {
    return { ...BIOLOGY_SUBJECT }
  }

  return null
}

export async function createSubject({title, slug, description=''}){
  const col = collection(db,'subjects')
  const payload = normalizeSubjectRecord({title, slug, description, createdAt: new Date().toISOString()})
  const doc = await addDoc(col,payload)
  return {id: doc.id, ...payload}
}

export async function fetchSubjects(){
  const snap = await getDocs(collection(db,'subjects'))
  const subjects = snap.docs.map(d=> ({id: d.id, ...d.data()})).map(normalizeSubjectRecord)
  const hasBiology = subjects.some(subject => subject.slug === BIOLOGY_SUBJECT.slug)

  if (!hasBiology) {
    subjects.unshift({ ...BIOLOGY_SUBJECT })
  }

  return subjects
}

export async function fetchTopics(){
  // If Firebase isn't configured, return the built-in biology seed topics immediately
  if (!firebaseConfig.apiKey) {
    return getSeedTopicsForSubject(BIOLOGY_SUBJECT.slug)
  }

  const snap = await getDocs(collection(db, 'topics'))
  const firestoreTopics = snap.docs.map(d => ({ id: d.id, ...d.data() })).map(normalizeTopicRecord)

  const merged = new Map()
  for (const topic of getSeedTopicsForSubject(BIOLOGY_SUBJECT.slug)) {
    merged.set(topic.slug, topic)
  }
  for (const topic of firestoreTopics) {
    merged.set(topic.slug, topic)
  }

  return Array.from(merged.values())
}

export async function createTopic({subjectId, subjectTitle='', title, slug, difficulty='beginner', summary='', visualType='', contentBlocks=[], images=[], videos=[], model3d=null, model3dSuggestions=[], quiz=[], chatbotPrompt='', aiPrompt='', description='', modelUrl=null}){
  const col = collection(db,'topics')
  const draft = normalizeTopicRecord({
    subject: subjectId,
    subjectTitle,
    title,
    slug,
    difficulty,
    summary: summary || description,
    visualType: visualType || (model3d || modelUrl ? 'anatomy-3d' : 'interactive-diagram'),
    contentBlocks,
    images,
    videos,
    model3d: model3d || modelUrl || null,
    model3dSuggestions,
    quiz,
    chatbotPrompt: chatbotPrompt || aiPrompt,
    aiPrompt: aiPrompt || chatbotPrompt
  })
  const payload = {
    ...draft,
    subjectId,
    createdAt: new Date().toISOString()
  }
  const doc = await addDoc(col,payload)
  return {id: doc.id, ...payload}
}

export async function fetchTopicsBySubject(subjectSlugOrId){
  try{
    const match = await loadSubjectMatch(subjectSlugOrId)
    if(!match) return []

    if (match.slug === BIOLOGY_SUBJECT.slug || match.id === BIOLOGY_SUBJECT.id) {
      const q = query(collection(db,'topics'), where('subject', '==', BIOLOGY_SUBJECT.slug))
      const snap = await getDocs(q)
      const firestoreTopics = snap.docs.map(d=> ({id:d.id, ...d.data()})).map(normalizeTopicRecord)
      if (!firestoreTopics.length) {
        return getSeedTopicsForSubject(BIOLOGY_SUBJECT.slug)
      }
      return firestoreTopics
    }

    const subjectId = match.id
    const q = query(collection(db,'topics'), where('subjectId','==', subjectId))
    const snap = await getDocs(q)
    return snap.docs.map(d=> ({id:d.id, ...d.data()})).map(normalizeTopicRecord)
  }catch(err){
    console.error('fetchTopicsBySubject error', err)
    throw err
  }
}

export async function fetchTopicBySlug(slug){
  // If Firebase is not configured in the environment, return a seed topic immediately
  if (!firebaseConfig.apiKey) {
    const seed = getSeedTopicBySlug(slug)
    return seed ? normalizeTopicRecord(seed) : null
  }

  const q = query(collection(db,'topics'), where('slug','==',slug))
  const snap = await getDocs(q)
  const doc = snap.docs[0]
  if (doc) {
    return normalizeTopicRecord({id: doc.id, ...doc.data()})
  }

  const seed = getSeedTopicBySlug(slug)
  return seed ? normalizeTopicRecord(seed) : null
}

export async function fetchSubjectBySlug(slug){
  const q = query(collection(db,'subjects'), where('slug','==',slug))
  const snap = await getDocs(q)
  const doc = snap.docs[0]
  if (doc) {
    return normalizeSubjectRecord({id: doc.id, ...doc.data()})
  }

  if (slug === BIOLOGY_SUBJECT.slug) {
    return { ...BIOLOGY_SUBJECT }
  }

  return null
}

export async function fetchTopicById(id){
  const snap = await getDocs(query(collection(db,'topics')))
  const doc = snap.docs.find(d=>d.id===id)
  return doc? normalizeTopicRecord({id:doc.id, ...doc.data()}) : null
}

export async function uploadModel(file, subjectId){
  const path = `models/${subjectId}/${Date.now()}_${file.name}`
  const r = ref(storage, path)
  await uploadBytes(r, file)
  return await getDownloadURL(r)
}

export async function deleteTopic(topicId){
  try{
    // fetch the topic doc to see if it has a storage URL
    const topicRef = doc(db, 'topics', topicId)
    // delete only the Firestore doc here; storage cleanup is optional and may require parsing the storage path
    await deleteDoc(topicRef)
    return true
  }catch(err){
    console.error('deleteTopic error', err)
    throw err
  }
}
