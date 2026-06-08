import React from 'react'

export default function VideosPanel({ videos = [] }){
  const items = Array.isArray(videos) ? videos.slice(0,3) : []

  if(!items.length) return (
    <div className="rounded-[1.15rem] border border-white/10 bg-white/[0.02] p-6 text-center text-white/60">No curated videos available.</div>
  )

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((v, i) => (
          <div key={v.src || i} className="overflow-hidden rounded-[1rem] border border-white/8 bg-black/40">
            <div className="aspect-video bg-black">
              <iframe title={v.title || `video-${i}`} src={v.src} loading="lazy" className="h-full w-full" frameBorder="0" allowFullScreen></iframe>
            </div>
            <div className="p-3">
              <div className="text-sm font-semibold text-white">{v.title}</div>
              {v.caption ? <div className="mt-1 text-xs text-white/60">{v.caption}</div> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
