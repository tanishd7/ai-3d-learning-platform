import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function SubjectCard({subject}){
  return (
    <motion.div whileHover={{scale:1.02}} className="glass p-4 rounded-lg transition-transform">
      <Link to={`/subject/${subject.slug}`}>
        <div className="h-40 bg-gradient-to-br from-[#0f1724] to-[#071229] rounded-md flex items-center justify-center mb-4 overflow-hidden"> 
          <div className="w-full h-full flex items-center justify-center text-sm opacity-60">{subject.coverImageUrl? <img src={subject.coverImageUrl} alt="cover" className="object-cover w-full h-full"/> : subject.visualType || 'Preview'}</div>
        </div>
        <h3 className="text-lg font-semibold">{subject.title}</h3>
        <p className="text-xs opacity-70">{subject.description || ''}</p>
      </Link>
    </motion.div>
  )
}
