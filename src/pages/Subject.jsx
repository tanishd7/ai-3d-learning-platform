import React, {useEffect, useState} from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchTopicsBySubject, fetchSubjectBySlug } from '../services/firebase'
import TopicCard from '../components/TopicCard'
import { getVisualTypeMeta } from '../lib/topicContent'

export default function Subject(){
  const { slug } = useParams()
  const [topics, setTopics] = useState([])
  const [subject, setSubject] = useState(null)

  useEffect(()=>{
    fetchSubjectBySlug(slug).then(setSubject).catch(err=>{console.error('fetchSubjectBySlug error', err)})
    fetchTopicsBySubject(slug).then(setTopics).catch(err=>{console.error('fetchTopicsBySubject error', err)})
  },[slug])

  return (
    <div>
      <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-5">
        <div className="text-xs uppercase tracking-[0.28em] text-white/40">Subject</div>
        <h2 className="mt-2 text-3xl font-semibold text-white">{subject?.title || 'Subject'}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/68">{subject?.description}</p>
        {subject?.visualType ? (
          <div className="mt-4 inline-flex rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-white/55">
            {getVisualTypeMeta(subject.visualType).label}
          </div>
        ) : null}
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-6">
        {topics.length? topics.map(t=> <TopicCard key={t.id} topic={t} />) : <p className="opacity-60">No topics yet.</p>}
      </section>
    </div>
  )
}
