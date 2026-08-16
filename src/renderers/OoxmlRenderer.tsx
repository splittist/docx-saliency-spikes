import { DocxScrollViewer } from '@silurus/ooxml/docx'
import { useEffect, useRef, useState } from 'react'
import { useFileArrayBuffer } from '../hooks/useFileArrayBuffer'
import type { SpikeRendererProps } from '../types'
import { RendererSurface } from './shared'

export function OoxmlRenderer({ file, annotations }: SpikeRendererProps) {
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

    const viewer = new DocxScrollViewer(container, {
      enableTextSelection: true,
      onError: (reason) => setRenderError(reason.message),
      refitOnResize: true,
    })

    viewer.load(buffer).catch((reason: unknown) => {
      setRenderError(reason instanceof Error ? reason.message : 'Unable to render DOCX.')
    })

    return () => {
      viewer.destroy()
    }
  }, [buffer])

  return (
    <RendererSurface
      title="@silurus/ooxml"
      annotations={annotations}
      error={error ?? renderError}
      isLoading={isLoading}
    >
      <div className="ooxml-host" ref={containerRef} />
    </RendererSurface>
  )
}
