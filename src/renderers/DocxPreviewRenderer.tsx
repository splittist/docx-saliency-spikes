import { useEffect, useRef, useState } from 'react'
import { renderAsync } from 'docx-preview'
import { useFileArrayBuffer } from '../hooks/useFileArrayBuffer'
import type { SpikeRendererProps } from '../types'
import { RendererSurface } from './shared'

export function DocxPreviewRenderer({ file, annotations }: SpikeRendererProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const { buffer, error, isLoading } = useFileArrayBuffer(file)
  const [renderError, setRenderError] = useState<string | null>(null)

  useEffect(() => {
    const container = containerRef.current

    if (!container) {
      return
    }

    let cancelled = false
    container.replaceChildren()
    setRenderError(null)

    if (!buffer) {
      return () => {
        cancelled = true
      }
    }

    const renderContainer = document.createElement('div')
    container.replaceChildren(renderContainer)

    renderAsync(buffer, renderContainer, renderContainer, {
      className: 'docx-preview-surface',
      inWrapper: true,
    }).catch((reason: unknown) => {
      if (!cancelled) {
        setRenderError(reason instanceof Error ? reason.message : 'Unable to render DOCX.')
      }
    })

    return () => {
      cancelled = true
      renderContainer.replaceChildren()
      if (renderContainer.isConnected) {
        renderContainer.remove()
      }
    }
  }, [buffer])

  return (
    <RendererSurface
      title="docx-preview"
      annotations={annotations}
      error={error ?? renderError}
      isLoading={isLoading}
    >
      <div className="html-renderer" ref={containerRef} />
    </RendererSurface>
  )
}
