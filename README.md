# docx-saliency-spikes

Compare four DOCX rendering surfaces side by side for externally generated saliency annotations.

## Included renderers

- `docx-preview`
- `@superdoc-dev/react`
- `@extend-ai/react-docx`
- `@silurus/ooxml`

## Local development

```bash
npm install
npm run dev
```

## Fixture corpus

The app ships with a small fixture corpus under `public/fixtures/` plus annotation JSON files that all renderer adapters consume through the shared `SpikeRendererProps` interface.
