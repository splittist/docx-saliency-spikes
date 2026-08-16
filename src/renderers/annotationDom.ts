import type { Annotation } from '../types'

export function applySaliency(root: Element, annotations: Annotation[], saliency: number) {
  unwrapSaliencySpans(root)

  const matches = annotations
    .map((annotation) => ({
      annotation,
      range: findAnnotationRange(root, annotation),
    }))
    .filter((match): match is { annotation: Annotation; range: Range } => match.range !== null)
    .sort((left, right) => right.range.startOffset - left.range.startOffset)

  for (const { annotation, range } of matches) {
    const annotationSpan = document.createElement('span')
    annotationSpan.className = 'docx-saliency-annotation'
    annotationSpan.title = annotation.target.text
    annotationSpan.style.opacity = `${clamp(annotation.presentation.salience)}`
    annotationSpan.append(range.extractContents())
    range.insertNode(annotationSpan)
  }

  wrapOrdinaryText(root, clamp(saliency))
}

export function applySuperDocSaliency(root: Element, annotations: Annotation[], saliency: number) {
  unwrapSaliencySpans(root)

  const textRuns = [...root.querySelectorAll<HTMLElement>('.superdoc-text-run')]
  const runRanges = getRunRanges(textRuns)
  const fullText = runRanges.map(({ text }) => text).join('')
  const annotationRanges = annotations
    .map((annotation) => ({
      annotation,
      range: findAnnotationOffsets(fullText, annotation),
    }))
    .filter((match): match is { annotation: Annotation; range: { start: number; end: number } } => match.range !== null)

  for (const [index, run] of runRanges.entries()) {
    const runStart = run.start
    const runEnd = run.start + run.text.length
    const matchingAnnotations = annotationRanges.filter(
      ({ range }) => range.start < runEnd && range.end > runStart,
    )
    const boundaries = new Set([0, run.text.length])

    for (const { range } of matchingAnnotations) {
      boundaries.add(Math.max(0, range.start - runStart))
      boundaries.add(Math.min(run.text.length, range.end - runStart))
    }

    const sortedBoundaries = [...boundaries].sort((left, right) => left - right)
    const textRun = textRuns[index]
    textRun.style.opacity = ''
    textRun.replaceChildren()

    for (let boundaryIndex = 0; boundaryIndex < sortedBoundaries.length - 1; boundaryIndex += 1) {
      const start = sortedBoundaries[boundaryIndex]
      const end = sortedBoundaries[boundaryIndex + 1]
      const segment = document.createElement('span')
      const segmentStart = runStart + start
      const segmentEnd = runStart + end
      const segmentAnnotations = annotationRanges.filter(
        ({ range }) => range.start < segmentEnd && range.end > segmentStart,
      )
      const opacity = segmentAnnotations.length
        ? Math.max(...segmentAnnotations.map(({ annotation }) => clamp(annotation.presentation.salience)))
        : clamp(saliency)

      segment.className = 'superdoc-saliency-segment'
      segment.style.opacity = `${opacity}`
      segment.textContent = run.text.slice(start, end)
      textRun.append(segment)
    }
  }
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

function findAnnotationOffsets(fullText: string, annotation: Annotation) {
  const target = annotation.target.text
  const matches: number[] = []

  for (let start = fullText.indexOf(target); start !== -1; start = fullText.indexOf(target, start + 1)) {
    matches.push(start)
  }

  const start = matches[(annotation.target.occurrence ?? 1) - 1]

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

  return { start, end: start + target.length }
}

function getRunRanges(textRuns: HTMLElement[]) {
  let start = 0

  return textRuns.map((element) => {
    const text = element.textContent ?? ''
    const range = { start, text }
    start += text.length
    return range
  })
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
  for (const span of root.querySelectorAll(
    '.docx-saliency-annotation, .docx-saliency-ordinary, .superdoc-saliency-segment',
  )) {
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
