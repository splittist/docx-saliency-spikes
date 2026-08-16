import { useEffect, useRef, useState } from 'react'
import { renderAsync } from 'docx-preview'
import { useFileArrayBuffer } from '../hooks/useFileArrayBuffer'
import type { SpikeRendererProps } from '../types'
import { applySaliency } from './annotationDom'
import { RendererSurface } from './shared'

export function DocxPreviewRenderer({ file, annotations, saliency }: SpikeRendererProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const annotationsRef = useRef(annotations)
  const saliencyRef = useRef(saliency)
  const { buffer, error, isLoading } = useFileArrayBuffer(file)
  const [renderError, setRenderError] = useState<string | null>(null)

  annotationsRef.current = annotations
  saliencyRef.current = saliency

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
    })
      .then(() => {
        if (!cancelled) {
          applySaliency(renderContainer, annotationsRef.current?.annotations ?? [], saliencyRef.current)
        }
      })
      .catch((reason: unknown) => {
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

  useEffect(() => {
    const renderedDocument = containerRef.current?.firstElementChild

    if (renderedDocument) {
      applySaliency(renderedDocument, annotations?.annotations ?? [], saliency)
    }
  }, [annotations, saliency])

  return (
    <RendererSurface
      title="docx-preview"
      annotations={annotations}
      error={error ?? renderError}
      isLoading={isLoading}
      saliency={saliency}
    >
      <div className="html-renderer" ref={containerRef} />
    </RendererSurface>
  )
}
