# docx-saliency-spikes

Compare four DOCX rendering surfaces side by side for externally generated saliency annotations.

## Included renderers

- `docx-preview`
- `@superdoc-dev/react`
- `@extend-ai/react-docx`
- `@silurus/ooxml`

## Annotation rendering notes

- `docx-preview` and `@extend-ai/react-docx` render ordinary DOM text that can be wrapped with saliency spans. Extend UI parses asynchronously and does not expose a viewer-render callback, so its adapter observes the viewer host and reapplies the transform after renderer updates.
- SuperDoc requires run-level text segmentation to preserve its layout. See `src/renderers/annotationDom.ts` for the shared matching and presentation logic.
- `@silurus/ooxml` paints document content to canvas. Its adapter fades that surface globally for ordinary text, then draws annotation text over an opaque salience-tinted background in the viewer's selectable text layer. The background masks the faded canvas glyphs beneath annotations, avoiding Chromium ghosting while keeping annotations legible. The adapter uses the headless `DocxDocument` API to resolve annotation occurrences across virtualized pages.

## Local development

```bash
npm install
npm run dev
```

## Fixture corpus

The app ships with a small fixture corpus under `public/fixtures/` plus annotation JSON files that all renderer adapters consume through the shared `SpikeRendererProps` interface.
