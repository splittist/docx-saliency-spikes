import { ReactDocxViewer } from '@extend-ai/react-docx'
import { useFileArrayBuffer } from '../hooks/useFileArrayBuffer'
import type { SpikeRendererProps } from '../types'
import { RendererSurface } from './shared'

export function ExtendRenderer({ file, annotations }: SpikeRendererProps) {
  const { buffer, error, isLoading } = useFileArrayBuffer(file)

  return (
    <RendererSurface
      title="@extend-ai/react-docx"
      annotations={annotations}
      error={error}
      isLoading={isLoading}
    >
      <div className="html-renderer">
        <ReactDocxViewer file={buffer ?? undefined} emptyState="Select a DOCX file or fixture." />
      </div>
    </RendererSurface>
  )
}
