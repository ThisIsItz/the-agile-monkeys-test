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
