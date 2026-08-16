import type { PropsWithChildren, ReactNode } from 'react'
import type { AnnotationSet } from '../types'

export function RendererSurface({
  annotations,
  children,
  error,
  isLoading,
  title,
}: PropsWithChildren<{
  annotations: AnnotationSet | null
  error?: string | null
  isLoading?: boolean
  title: string
}>) {
  const chips = annotations?.annotations ?? []

  return (
    <section className="renderer-surface" aria-label={title}>
      <div className="renderer-canvas">{renderState({ children, error, isLoading })}</div>
      <div className="renderer-annotations">
        <strong>Annotation targets</strong>
        {annotations ? (
          <ul>
            {chips.map((annotation) => (
              <li key={annotation.id}>
                <span
                  className="annotation-chip"
                  style={{
                    ['--annotation-salience' as string]: `${annotation.presentation.salience}`,
                  }}
                >
                  {annotation.target.text}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No annotation set loaded.</p>
        )}
      </div>
    </section>
  )
}

function renderState({
  children,
  error,
  isLoading,
}: {
  children: ReactNode
  error?: string | null
  isLoading?: boolean
}) {
  if (error) {
    return <div className="renderer-placeholder renderer-error">{error}</div>
  }

  if (isLoading) {
    return <div className="renderer-placeholder">Loading document…</div>
  }

  return children
}
