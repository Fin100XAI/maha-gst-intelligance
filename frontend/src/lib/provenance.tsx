import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { JSX, ReactNode } from 'react'
import { ProvenanceDrawer } from '../components/ProvenanceDrawer'

/**
 * One drawer for the whole app, so any figure anywhere can open it.
 */
interface ProvenanceValue {
  open: (calcId: string) => void
  close: () => void
  calcId: string | null
}

const ProvenanceContext = createContext<ProvenanceValue | null>(null)

export function ProvenanceProvider({ children }: { children: ReactNode }): JSX.Element {
  const [calcId, setCalcId] = useState<string | null>(null)
  const open = useCallback((next: string) => {
    setCalcId(next)
  }, [])
  const close = useCallback(() => {
    setCalcId(null)
  }, [])
  const value = useMemo<ProvenanceValue>(() => ({ open, close, calcId }), [open, close, calcId])

  return (
    <ProvenanceContext.Provider value={value}>
      {children}
      <ProvenanceDrawer calcId={calcId} onClose={close} />
    </ProvenanceContext.Provider>
  )
}

export function useProvenance(): ProvenanceValue {
  const value = useContext(ProvenanceContext)
  if (value === null) throw new Error('useProvenance must be used inside a ProvenanceProvider')
  return value
}
