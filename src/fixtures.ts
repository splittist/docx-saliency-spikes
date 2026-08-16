import type { FixtureDefinition } from './types'

export const fixtures: FixtureDefinition[] = [
  {
    id: 'overview',
    label: 'Overview fixture',
    description: 'Short fixture for checking the shared annotation model against simple prose.',
    filePath: '/fixtures/overview.docx',
    annotationPath: '/fixtures/overview.annotations.json',
  },
  {
    id: 'pagination',
    label: 'Pagination fixture',
    description: 'Longer fixture for comparing pagination, scrolling, and repeated targets.',
    filePath: '/fixtures/pagination.docx',
    annotationPath: '/fixtures/pagination.annotations.json',
  },
]
