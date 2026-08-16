import type { JSX } from 'react'
import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { fixtures } from './fixtures'
import { DocxPreviewRenderer } from './renderers/DocxPreviewRenderer'
import { ExtendRenderer } from './renderers/ExtendRenderer'
import { OoxmlRenderer } from './renderers/OoxmlRenderer'
import { SuperDocRenderer } from './renderers/SuperDocRenderer'
import type { AnnotationSet, FixtureDefinition, SpikeRendererProps } from './types'

const DEFAULT_FIXTURE_ID = fixtures[0]?.id ?? ''

const rendererEntries: Array<{
  id: string
  label: string
  Renderer: (props: SpikeRendererProps) => JSX.Element
}> = [
  { id: 'docx-preview', label: 'docx-preview', Renderer: DocxPreviewRenderer },
  { id: 'superdoc', label: '@superdoc-dev/react', Renderer: SuperDocRenderer },
  { id: 'extend', label: '@extend-ai/react-docx', Renderer: ExtendRenderer },
  { id: 'ooxml', label: '@silurus/ooxml', Renderer: OoxmlRenderer },
]

function App() {
  const [fixtureId, setFixtureId] = useState(DEFAULT_FIXTURE_ID)
  const [fixtureFile, setFixtureFile] = useState<File | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [annotations, setAnnotations] = useState<AnnotationSet | null>(null)
  const [fixtureError, setFixtureError] = useState<string | null>(null)
  const [isFixtureLoading, setIsFixtureLoading] = useState(false)
  const [activeRendererId, setActiveRendererId] = useState(rendererEntries[0]?.id ?? '')
  const [saliency, setSaliency] = useState(1)

  const selectedFixture = useMemo(
    () => fixtures.find((fixture) => fixture.id === fixtureId) ?? null,
    [fixtureId],
  )

  useEffect(() => {
    if (!selectedFixture) {
      return
    }

    let cancelled = false
    setFixtureError(null)
    setIsFixtureLoading(true)

    loadFixture(selectedFixture)
      .then(({ annotations, file }) => {
        if (!cancelled) {
          setFixtureFile(file)
          setAnnotations(annotations)
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setFixtureError(error instanceof Error ? error.message : 'Unable to load fixture.')
          setFixtureFile(null)
          setAnnotations(null)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsFixtureLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [selectedFixture])

  const activeFile = uploadedFile ?? fixtureFile
  const activeSourceLabel = uploadedFile ? `Uploaded file: ${uploadedFile.name}` : selectedFixture?.label

  return (
    <main className="app-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Initial project setup</p>
          <h1>DOCX saliency spike harness</h1>
          <p className="lede">
            Compare four DOCX rendering surfaces against one shared annotation shape.
          </p>
        </div>
        <dl className="summary-grid">
          <div>
            <dt>Active document</dt>
            <dd>{activeSourceLabel ?? 'None loaded'}</dd>
          </div>
          <div>
            <dt>Annotation format</dt>
            <dd>{annotations ? `${annotations.label} · ${annotations.annotations.length} anchors` : 'None loaded'}</dd>
          </div>
        </dl>
      </header>

      <section className="control-panel" aria-label="Document controls">
        <label>
          <span>Fixture corpus</span>
          <select value={fixtureId} onChange={(event) => setFixtureId(event.target.value)}>
            {fixtures.map((fixture) => (
              <option key={fixture.id} value={fixture.id}>
                {fixture.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Local DOCX file</span>
          <input
            type="file"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(event) => setUploadedFile(event.target.files?.[0] ?? null)}
          />
        </label>

        <label>
          <span>Saliency: {saliency.toFixed(2)}</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={saliency}
            onChange={(event) => setSaliency(event.target.valueAsNumber)}
          />
        </label>

        <button type="button" onClick={() => setUploadedFile(null)} disabled={!uploadedFile}>
          Revert to fixture
        </button>
      </section>

      <section className="fixture-status" aria-live="polite">
        <p>{selectedFixture?.description}</p>
        {uploadedFile ? (
          <p>Custom uploads reuse the currently selected fixture annotation set.</p>
        ) : null}
        {isFixtureLoading ? <p>Loading fixture…</p> : null}
        {fixtureError ? <p className="error-text">{fixtureError}</p> : null}
      </section>

      <section className="renderer-grid" aria-label="Renderer comparison">
        <div className="renderer-tabs" role="tablist" aria-label="Renderers">
          {rendererEntries.map(({ id, label }) => (
            <button
              key={id}
              id={`renderer-tab-${id}`}
              type="button"
              role="tab"
              aria-controls={`renderer-panel-${id}`}
              aria-selected={activeRendererId === id}
              className="renderer-tab"
              onClick={() => setActiveRendererId(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {rendererEntries.map(({ id, label, Renderer }) => (
          <article
            key={id}
            id={`renderer-panel-${id}`}
            className="renderer-card"
            role="tabpanel"
            aria-labelledby={`renderer-tab-${id}`}
            hidden={activeRendererId !== id}
          >
            <div className="renderer-card-header">
              <h2>{label}</h2>
            </div>
            <Renderer file={activeFile} annotations={annotations} saliency={saliency} />
          </article>
        ))}
      </section>
    </main>
  )
}

async function loadFixture(fixture: FixtureDefinition) {
  const [fileResponse, annotationResponse] = await Promise.all([
    fetch(fixture.filePath),
    fetch(fixture.annotationPath),
  ])

  if (!fileResponse.ok) {
    throw new Error(`Fixture download failed: ${fileResponse.status}`)
  }

  if (!annotationResponse.ok) {
    throw new Error(`Annotation download failed: ${annotationResponse.status}`)
  }

  const blob = await fileResponse.blob()
  const annotationSet = (await annotationResponse.json()) as AnnotationSet

  return {
    annotations: annotationSet,
    file: new File([blob], fixture.filePath.split('/').at(-1) ?? `${fixture.id}.docx`, {
      type: blob.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    }),
  }
}

export default App
