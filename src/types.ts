export interface SpikeRendererProps {
  file: File | null
  annotations: AnnotationSet | null
}

export interface AnnotationSet {
  id: string
  label: string
  annotations: Annotation[]
  metadata?: Record<string, unknown>
}

export interface Annotation {
  id: string
  target: {
    text: string
    prefix?: string
    suffix?: string
    occurrence?: number
  }
  presentation: {
    salience: number
  }
  metadata?: Record<string, unknown>
}

export interface FixtureDefinition {
  id: string
  label: string
  description: string
  filePath: string
  annotationPath: string
}
