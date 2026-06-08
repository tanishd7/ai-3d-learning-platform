import React, {useState, useEffect} from 'react'
import { createSubject, fetchSubjects, createTopic, uploadModel, fetchTopicsBySubject, deleteTopic } from '../services/firebase'
import { requestTopicDraft } from '../services/api'

export default function Admin(){
  const [subjects, setSubjects] = useState([])
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [topicTitle, setTopicTitle] = useState('')
  const [topicDesc, setTopicDesc] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [difficulty, setDifficulty] = useState('beginner')
  const [file, setFile] = useState(null)
  const [modelUrlInput, setModelUrlInput] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(()=>{ fetchSubjects().then(setSubjects).catch(err=>{ console.error('fetchSubjects error', err); alert('Failed to load subjects — check console') }) },[])
  useEffect(()=>{
    // load topics map for admin
    let mounted = true
    async function load(){
      try{
        const map = {}
        for(const s of subjects){
          const t = await fetchTopicsBySubject(s.id)
          map[s.id] = t
        }
        if(mounted) setTopicsMap(map)
      }catch(err){ console.error('admin load topics',err) }
    }
    load()
    return ()=> mounted = false
  },[subjects])

  const [topicsMap, setTopicsMap] = useState({})

  async function onCreateSubject(){
    if(!title || title.trim().length<1) return alert('Please enter a subject title')
    setLoading(true)
    try{
      const newSlug = slug && slug.trim().length>0 ? slug.trim() : title.toLowerCase().replace(/\s+/g,'-')
      const res = await createSubject({title: title.trim(), slug: newSlug, description: ''})
      console.log('createSubject result', res)
      setTitle(''); setSlug('')
      const refreshed = await fetchSubjects()
      setSubjects(refreshed)
      alert('Subject created')
    }catch(err){
      console.error('createSubject error', err)
      alert('Failed to create subject — check console for details')
    }finally{ setLoading(false) }
  }

  async function onCreateTopic(){
    if(!selectedSubject) return alert('Pick subject')
    if(!topicTitle || topicTitle.trim().length<1) return alert('Enter topic title')
    setLoading(true)
    try{
      const subjectRecord = subjects.find(subject => subject.id === selectedSubject) || {}
      const draftResponse = await requestTopicDraft({
        title: topicTitle.trim(),
        subject: subjectRecord.slug || subjectRecord.title || 'biology',
        difficulty
      })
      const draft = draftResponse?.draft || {}
      let modelUrl = modelUrlInput.trim() || null
      if(file){
        modelUrl = await uploadModel(file, selectedSubject)
      }
      const topicSlug = draft.slug || topicTitle.toLowerCase().replace(/\s+/g,'-')
      const res = await createTopic({
        subjectId:selectedSubject,
        subjectTitle: subjectRecord.title || '',
        title: draft.title || topicTitle.trim(),
        slug: topicSlug,
        difficulty,
        summary: draft.summary || topicDesc,
        visualType: draft.visualType || '',
        contentBlocks: draft.contentBlocks || [],
        images: draft.images || [],
        videos: draft.videos || [],
        model3d: modelUrl || draft.model3d || null,
        model3dSuggestions: draft.model3dSuggestions || [],
        quiz: draft.quiz || [],
        chatbotPrompt: draft.chatbotPrompt || '',
        aiPrompt: draft.chatbotPrompt || topicDesc || ''
      })
      console.log('createTopic result', res)
      setTopicTitle(''); setTopicDesc(''); setFile(null); setModelUrlInput('')
      setDifficulty('beginner')
      // refresh topics list
      try{
        const updated = await fetchTopicsBySubject(selectedSubject)
        setTopicsMap(m=> ({...m, [selectedSubject]: updated}))
      }catch(e){ console.error('refresh topics after create', e) }
      alert('Topic created')
    }catch(err){
      console.error('createTopic error', err)
      alert('Failed to create topic. If Storage requires billing, leave file empty and use Model URL field.')
    }finally{ setLoading(false) }
  }

  return (
    <div className="space-y-6">
      <section className="glass p-4 rounded">
        <h3 className="font-semibold">Create Subject</h3>
        <div className="mt-2 flex gap-2">
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Title" className="p-2 bg-transparent border" />
          <input value={slug} onChange={e=>setSlug(e.target.value)} placeholder="slug (optional)" className="p-2 bg-transparent border" />
          <button onClick={onCreateSubject} disabled={loading} className="px-4 py-2 glass">{loading? '...' : 'Create'}</button>
        </div>
      </section>

      <section className="glass p-4 rounded">
        <h3 className="font-semibold">Create Topic</h3>
        <div className="mt-2 grid grid-cols-1 gap-2">
          <select onChange={e=>setSelectedSubject(e.target.value)} value={selectedSubject} className="p-2 bg-transparent border">
            <option value="">Select subject</option>
            {subjects.map(s=> <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
          <input value={topicTitle} onChange={e=>setTopicTitle(e.target.value)} placeholder="Topic title" className="p-2 bg-transparent border" />
          <select value={difficulty} onChange={e=>setDifficulty(e.target.value)} className="p-2 bg-transparent border">
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <textarea value={topicDesc} onChange={e=>setTopicDesc(e.target.value)} placeholder="AI notes or special focus (optional)" className="p-2 bg-transparent border" />
          <input
            value={modelUrlInput}
            onChange={e=>setModelUrlInput(e.target.value)}
            placeholder="Model URL (optional) e.g. /models/heart.glb"
            className="p-2 bg-transparent border"
          />
          <input type="file" accept=".glb,.gltf" onChange={e=>setFile(e.target.files[0])} />
          <p className="text-xs opacity-70">If Storage asks for payment, leave file empty and use Model URL from `public/models`.</p>
          <div className="flex gap-2">
            <button onClick={onCreateTopic} disabled={loading} className="px-4 py-2 glass">{loading? '...' : 'Generate & Save Topic'}</button>
          </div>
        </div>
      </section>

      <section className="glass p-4 rounded">
        <h3 className="font-semibold">Existing Subjects</h3>
        <div className="mt-2 space-y-3">
          {subjects.map(s=> (
            <div key={s.id} className="p-2 bg-white/3 rounded">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{s.title}</div>
                  <div className="text-xs opacity-60">{s.id}</div>
                </div>
                <div className="text-xs opacity-70">{(topicsMap[s.id]||[]).length} topics</div>
              </div>
              <ul className="mt-2 space-y-1">
                {(topicsMap[s.id]||[]).map(t=> (
                  <li key={t.id} className="flex items-center justify-between">
                    <div className="text-sm">{t.title}</div>
                    <div className="flex gap-2">
                      <button onClick={async ()=>{
                        if(!confirm('Delete topic "'+t.title+'"? This cannot be undone.')) return
                        try{
                          await deleteTopic(t.id)
                          // refresh
                          const updated = await fetchTopicsBySubject(s.id)
                          setTopicsMap(m=> ({...m, [s.id]: updated}))
                          alert('Topic deleted')
                        }catch(err){ console.error('delete topic', err); alert('Failed to delete topic') }
                      }} className="text-xs px-2 py-1 bg-red-600 rounded">Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
