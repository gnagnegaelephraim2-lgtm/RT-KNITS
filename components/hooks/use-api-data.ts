import { useState, useEffect } from "react"
import { NitaApi, ApiResult } from "@/lib/api"

interface UseApiDataOptions {
  immediate?: boolean
  onSuccess?: (data: any) => void
  onError?: (error: string) => void
}

export function useApiData<T>(
  fetcher: () => Promise<ApiResult<T>>,
  options: UseApiDataOptions = {}
) {
  const { immediate = true, onSuccess, onError } = options
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetcher()
      if (result.ok && result.data) {
        setData(result.data as T)
        onSuccess?.(result.data)
      } else {
        const errorMsg = result.error || "Failed to fetch data"
        setError(errorMsg)
        onError?.(errorMsg)
      }
    } catch (err) {
      const errorMsg = (err as Error).message || "An unexpected error occurred"
      setError(errorMsg)
      onError?.(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (immediate) {
      fetch()
    }
  }, [immediate])

  return { data, loading, error, refetch: fetch }
}
