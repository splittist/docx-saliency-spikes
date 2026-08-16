import { useEffect, useRef, useState } from 'react'
import { renderAsync } from 'docx-preview'
import { useFileArrayBuffer } from '../hooks/useFileArrayBuffer'
import type { Annotation, SpikeRendererProps } from '../types'
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

function applySaliency(root: Element, annotations: Annotation[], saliency: number) {
  unwrapSaliencySpans(root)

  for (const annotation of annotations) {
    const match = findAnnotationRange(root, annotation)

    if (!match) {
      continue
    }

    const annotationSpan = document.createElement('span')
    annotationSpan.className = 'docx-saliency-annotation'
    annotationSpan.title = annotation.target.text
    annotationSpan.style.opacity = `${clamp(annotation.presentation.salience)}`
    annotationSpan.append(match.extractContents())
    match.insertNode(annotationSpan)
  }

  wrapOrdinaryText(root, clamp(saliency))
}

function findAnnotationRange(root: Element, annotation: Annotation) {
  const textNodes = getTextNodes(root)
  const fullText = textNodes.map((node) => node.data).join('')
  const target = annotation.target.text
  const matches: number[] = []

  for (let start = fullText.indexOf(target); start !== -1; start = fullText.indexOf(target, start + 1)) {
    matches.push(start)
  }

  const occurrence = annotation.target.occurrence ?? 1
  const start = matches[occurrence - 1]

  if (start === undefined) {
    return null
  }

  const prefix = annotation.target.prefix
  const suffix = annotation.target.suffix
  const before = prefix ? fullText.slice(Math.max(0, start - prefix.length), start) : ''
  const after = suffix ? fullText.slice(start + target.length, start + target.length + suffix.length) : ''

  if ((prefix && before !== prefix) || (suffix && after !== suffix)) {
    return null
  }

  return createRange(textNodes, start, start + target.length)
}

function createRange(textNodes: Text[], start: number, end: number) {
  const range = document.createRange()
  let offset = 0

  for (const node of textNodes) {
    const nodeEnd = offset + node.data.length

    if (start >= offset && start <= nodeEnd) {
      range.setStart(node, start - offset)
    }

    if (end >= offset && end <= nodeEnd) {
      range.setEnd(node, end - offset)
      return range
    }

    offset = nodeEnd
  }

  return null
}

function getTextNodes(root: Node) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const textNodes: Text[] = []
  let node = walker.nextNode()

  while (node) {
    if (node.parentElement?.closest('.docx-saliency-annotation') === null && node.textContent) {
      textNodes.push(node as Text)
    }
    node = walker.nextNode()
  }

  return textNodes
}

function unwrapSaliencySpans(root: Element) {
  for (const span of root.querySelectorAll('.docx-saliency-annotation, .docx-saliency-ordinary')) {
    span.replaceWith(...span.childNodes)
  }
}

function wrapOrdinaryText(root: Element, opacity: number) {
  for (const node of getTextNodes(root)) {
    const span = document.createElement('span')
    span.className = 'docx-saliency-ordinary'
    span.style.opacity = `${opacity}`
    node.replaceWith(span)
    span.append(node)
  }
}

function clamp(value: number) {
  return Math.min(1, Math.max(0, value))
}
