import { SuperDocEditor } from '@superdoc-dev/react'
import '@superdoc-dev/react/style.css'
import { useCallback, useEffect, useRef } from 'react'
import { applySuperDocSaliency } from './annotationDom'
import type { SpikeRendererProps } from '../types'
import { RendererSurface } from './shared'

export function SuperDocRenderer({ file, annotations, saliency }: SpikeRendererProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)

  const applyCurrentSaliency = useCallback(() => {
    const editorRoot = hostRef.current?.querySelector('.superdoc-editor-container')

    if (editorRoot) {
      applySuperDocSaliency(editorRoot, annotations?.annotations ?? [], saliency)
    }
  }, [annotations, saliency])

  useEffect(() => {
    applyCurrentSaliency()
  }, [applyCurrentSaliency])

  return (
    <RendererSurface title="@superdoc-dev/react" annotations={annotations} saliency={saliency}>
      {file ? (
        <div className="superdoc-host" ref={hostRef}>
          <SuperDocEditor
            document={file}
            documentMode="viewing"
            hideToolbar
            onEditorCreate={applyCurrentSaliency}
            onEditorUpdate={applyCurrentSaliency}
          />
        </div>
      ) : (
        <div className="renderer-placeholder">Select a DOCX file or fixture.</div>
      )}
    </RendererSurface>
  )
}
