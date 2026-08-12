import type { Schema } from '@shared/types'
import { useEffect, useState } from 'react'
import { getSchemas } from '@/api/schemas.ts'

export const SchemaList = () => {
  const [schemas, setSchemas] = useState<Schema[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadSchemas = async () => {
      try {
        const data = await getSchemas()
        setSchemas(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    loadSchemas()
  }, [])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <h1>Schemas</h1>
      <ul>
        {schemas.map((schema) => (
          <li key={schema.id}>
            <strong>{schema.name}</strong> (Fields: {schema.fields.length})
          </li>
        ))}
      </ul>
    </div>
  )
}
