import React, { createContext, useContext, useMemo, useState } from 'react'

const AssistantContext = createContext(null)

export function AssistantProvider({ children }) {
  const [assistantContext, setAssistantContext] = useState(null)

  const value = useMemo(() => ({
    assistantContext,
    setAssistantContext
  }), [assistantContext])

  return (
    <AssistantContext.Provider value={value}>
      {children}
    </AssistantContext.Provider>
  )
}

export function useAssistantContext() {
  const value = useContext(AssistantContext)
  if (!value) {
    throw new Error('useAssistantContext must be used within an AssistantProvider')
  }
  return value
}
