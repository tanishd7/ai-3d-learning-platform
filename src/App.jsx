import React, { useEffect, useRef, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Subject from './pages/Subject'
import Topic from './pages/Topic'
import Admin from './pages/Admin'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import SearchModal from './components/SearchModal'
import { AssistantProvider } from './components/AssistantContext'
import GlobalAssistant from './components/GlobalAssistant'
import useScrollDirection from './hooks/useScrollDirection'

export default function App(){
  const [showSidebar, setShowSidebar] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const headerWrapRef = useRef(null)
  const { scrollY } = useScrollDirection()
  const hideHeader = scrollY > 80

  useEffect(() => {
    const element = headerWrapRef.current
    if (!element || typeof window === 'undefined') return

    const updateHeaderHeight = () => {
      const height = element.offsetHeight || 0
      document.documentElement.style.setProperty('--app-header-height', `${height}px`)
    }

    updateHeaderHeight()

    const resizeObserver = new ResizeObserver(updateHeaderHeight)
    resizeObserver.observe(element)

    window.addEventListener('resize', updateHeaderHeight)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateHeaderHeight)
    }
  }, [])

  return (
    <AssistantProvider>
      <div className="min-h-screen">
        <div ref={headerWrapRef} className="fixed left-0 right-0 top-0 z-50">
          <Header
            onSearchClick={()=>setShowSearch(true)}
            hidden={hideHeader}
          />
        </div>
        <main
          className="p-4 md:p-8"
          style={{ paddingTop: 'calc(var(--app-header-height, 5rem) + 0.75rem)' }}
        >
          <Routes>
            <Route path="/" element={<Home/>} />
            <Route path="/subject/:slug" element={<Subject/>} />
            <Route path="/topic/:slug" element={<Topic/>} />
            <Route path="/admin/*" element={<Admin/>} />
          </Routes>
        </main>
        <Sidebar open={showSidebar} onToggle={()=>setShowSidebar(s=>!s)} onClose={()=>setShowSidebar(false)} />
        <SearchModal open={showSearch} onClose={()=>setShowSearch(false)} />
        <GlobalAssistant />
      </div>
    </AssistantProvider>
  )
}
