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

    container.replaceChildren()
    setRenderError(null)

    if (!buffer) {
      return
    }

    renderAsync(buffer, container, container, {
      className: 'docx-preview-surface',
      inWrapper: true,
    }).catch((reason: unknown) => {
      setRenderError(reason instanceof Error ? reason.message : 'Unable to render DOCX.')
    })
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
