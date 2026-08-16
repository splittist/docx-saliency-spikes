import { useEffect, useState } from 'react'

interface FileArrayBufferState {
  buffer: ArrayBuffer | null
  error: string | null
  isLoading: boolean
}

export function useFileArrayBuffer(file: File | null): FileArrayBufferState {
  const [state, setState] = useState<FileArrayBufferState>({
    buffer: null,
    error: null,
    isLoading: false,
  })

  useEffect(() => {
    if (!file) {
      setState({ buffer: null, error: null, isLoading: false })
      return
    }

    let cancelled = false
    setState({ buffer: null, error: null, isLoading: true })

    file
      .arrayBuffer()
      .then((buffer) => {
        if (!cancelled) {
          setState({ buffer, error: null, isLoading: false })
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            buffer: null,
            error: error instanceof Error ? error.message : 'Unable to read file.',
            isLoading: false,
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [file])

  return state
}
