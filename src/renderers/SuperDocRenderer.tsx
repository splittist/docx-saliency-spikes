import { SuperDocEditor } from '@superdoc-dev/react'
import '@superdoc-dev/react/style.css'
import type { SpikeRendererProps } from '../types'
import { RendererSurface } from './shared'

export function SuperDocRenderer({ file, annotations }: SpikeRendererProps) {
  return (
    <RendererSurface title="@superdoc-dev/react" annotations={annotations}>
      {file ? (
        <div className="superdoc-host">
          <SuperDocEditor document={file} documentMode="viewing" hideToolbar />
        </div>
      ) : (
        <div className="renderer-placeholder">Select a DOCX file or fixture.</div>
      )}
    </RendererSurface>
  )
}
