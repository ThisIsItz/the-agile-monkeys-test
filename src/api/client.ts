import type { ZodType } from 'zod'

export async function getErrorMessage(response: Response): Promise<string> {
  try {
    const data: unknown = await response.json()

    if (
      typeof data === 'object' &&
      data !== null &&
      'error' in data &&
      typeof data.error === 'string'
    ) {
      return data.error
    }
  } catch {
    return response.statusText || 'Request failed'
  }

  return response.statusText || 'Request failed'
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export async function throwApiError(response: Response): Promise<never> {
  throw new ApiError(await getErrorMessage(response), response.status)
}

export const apiFetch = async <T>(
  validation: ZodType<T> | null,
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> => {
  const response = await fetch(input, init)
  if (!response.ok) {
    await throwApiError(response)
  }

  if (!validation) return undefined as T

  const data = await response.json()
  return validation.parse(data)
}
