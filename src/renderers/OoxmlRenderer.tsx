import { DocxDocument, DocxScrollViewer } from '@silurus/ooxml/docx'
import { useEffect, useRef, useState } from 'react'
import { useFileArrayBuffer } from '../hooks/useFileArrayBuffer'
import type { SpikeRendererProps } from '../types'
import { applyOoxmlSaliency } from './annotationDom'
import { RendererSurface } from './shared'

export function OoxmlRenderer({ file, annotations, saliency }: SpikeRendererProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const { buffer, error, isLoading } = useFileArrayBuffer(file)
  const [renderError, setRenderError] = useState<string | null>(null)
  const [pageTexts, setPageTexts] = useState<string[]>([])

  useEffect(() => {
    const container = containerRef.current

    if (!container) {
      return
    }

    container.replaceChildren()
    setRenderError(null)
    setPageTexts([])

    if (!buffer) {
      return
    }

    let cancelled = false
    let document: DocxDocument | null = null
    let viewer: Omit<DocxScrollViewer, 'load'> | null = null
    const resizeObserver = new ResizeObserver(() => viewer?.relayout())
    const card = container.closest<HTMLElement>('.renderer-card')
    const visibilityObserver = card
      ? new MutationObserver(() => {
          if (!card.hidden) {
            viewer?.relayout()
          }
        })
      : null

    resizeObserver.observe(container)
    if (card && visibilityObserver) {
      visibilityObserver.observe(card, { attributes: true, attributeFilter: ['hidden'] })
    }

    void DocxDocument.load(buffer)
      .then(async (loadedDocument) => {
        if (cancelled) {
          loadedDocument.destroy()
          return
        }

        document = loadedDocument
        const scrollViewer = DocxScrollViewer.fromDocument(container, loadedDocument, {
          enableTextSelection: true,
          onError: (reason) => setRenderError(reason.message),
          refitOnResize: true,
        })
        viewer = scrollViewer
        scrollViewer.relayout()

        const text = await Promise.all(
          Array.from({ length: loadedDocument.pageCount }, (_, pageIndex) =>
            loadedDocument.collectPageRuns(pageIndex).then((runs) => runs.map((run) => run.text).join('')),
          ),
        )

        if (!cancelled) {
          setPageTexts(text)
        }
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setRenderError(reason instanceof Error ? reason.message : 'Unable to render DOCX.')
        }
      })

    return () => {
      cancelled = true
      resizeObserver.disconnect()
      visibilityObserver?.disconnect()
      viewer?.destroy()
      document?.destroy()
    }
  }, [buffer])

  useEffect(() => {
    const container = containerRef.current

    if (!container || pageTexts.length === 0) {
      return
    }

    const applyCurrentSaliency = () => {
      observer.disconnect()
      applyOoxmlSaliency(container, pageTexts, annotations?.annotations ?? [], saliency)
      observer.observe(container, { childList: true, subtree: true })
    }

    const observer = new MutationObserver(applyCurrentSaliency)
    observer.observe(container, { childList: true, subtree: true })
    applyCurrentSaliency()

    return () => {
      observer.disconnect()
    }
  }, [annotations, pageTexts, saliency])

  return (
    <RendererSurface
      title="@silurus/ooxml"
      annotations={annotations}
      error={error ?? renderError}
      isLoading={isLoading}
      saliency={saliency}
    >
      <div className="ooxml-host" ref={containerRef} />
    </RendererSurface>
  )
}
