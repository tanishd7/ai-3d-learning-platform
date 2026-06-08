import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function TopicCard({topic}){
  const previewImage = topic.images?.[0]?.src
  return (
    <motion.div whileHover={{scale:1.02}} className="glass p-4 rounded-lg transition-transform">
      <Link to={`/topic/${topic.slug}`}>
        <div className="h-40 bg-gradient-to-br from-[#071229] to-[#06111f] rounded-md flex items-center justify-center mb-4 overflow-hidden">
          {previewImage ? (
            <img src={previewImage} alt={topic.title} className="h-full w-full object-cover" />
          ) : (
            <div className="text-center text-sm text-white/60">
              <div>{topic.visualType || 'dynamic'}</div>
              <div className="mt-1 text-[10px] uppercase tracking-[0.24em]">Visual mode</div>
            </div>
          )}
        </div>
        <h3 className="text-lg font-semibold">{topic.title}</h3>
        <p className="text-xs opacity-70">{topic.summary?.slice(0,120) || topic.description?.slice(0,120)}</p>
      </Link>
    </motion.div>
  )
}
