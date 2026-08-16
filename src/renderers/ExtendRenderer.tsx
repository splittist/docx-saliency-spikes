import { ReactDocxViewer } from '@extend-ai/react-docx'
import { useEffect, useRef } from 'react'
import { useFileArrayBuffer } from '../hooks/useFileArrayBuffer'
import type { SpikeRendererProps } from '../types'
import { applySaliency } from './annotationDom'
import { RendererSurface } from './shared'

export function ExtendRenderer({ file, annotations, saliency }: SpikeRendererProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const { buffer, error, isLoading } = useFileArrayBuffer(file)

  useEffect(() => {
    const host = hostRef.current

    if (!host) {
      return
    }

    const applyCurrentSaliency = () => {
      const viewer = host.querySelector('[data-testid="react-docx-viewer"]')

      if (viewer) {
        applySaliency(viewer, annotations?.annotations ?? [], saliency)
      }
    }

    const observer = new MutationObserver(() => {
      observer.disconnect()
      applyCurrentSaliency()
      observer.observe(host, { childList: true, subtree: true })
    })

    observer.observe(host, { childList: true, subtree: true })
    applyCurrentSaliency()

    return () => {
      observer.disconnect()
    }
  }, [annotations, buffer, saliency])

  return (
    <RendererSurface
      title="@extend-ai/react-docx"
      annotations={annotations}
      error={error}
      isLoading={isLoading}
      saliency={saliency}
    >
      <div className="html-renderer" ref={hostRef}>
        <ReactDocxViewer file={buffer ?? undefined} emptyState="Select a DOCX file or fixture." />
      </div>
    </RendererSurface>
  )
}
