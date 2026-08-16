import { ReactDocxViewer } from '@extend-ai/react-docx'
import { useFileArrayBuffer } from '../hooks/useFileArrayBuffer'
import type { SpikeRendererProps } from '../types'
import { RendererSurface } from './shared'

export function ExtendRenderer({ file, annotations, saliency }: SpikeRendererProps) {
  const { buffer, error, isLoading } = useFileArrayBuffer(file)

  return (
    <RendererSurface
      title="@extend-ai/react-docx"
      annotations={annotations}
      error={error}
      isLoading={isLoading}
      saliency={saliency}
    >
      <div className="html-renderer">
        <ReactDocxViewer file={buffer ?? undefined} emptyState="Select a DOCX file or fixture." />
      </div>
    </RendererSurface>
  )
}
