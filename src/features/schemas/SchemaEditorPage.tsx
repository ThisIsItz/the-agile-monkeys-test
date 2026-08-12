import { getSchema } from '@/api/schemas'
import { Loader } from '@mantine/core'
import { type Schema } from '@shared/types'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { SchemaEditor } from './SchemaEditor'

export const SchemaEditorPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [schema, setSchema] = useState<Schema | undefined>(undefined)
  const [loading, setLoading] = useState(Boolean(id))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    const loadSchema = async () => {
      try {
        const data = await getSchema(id)
        setSchema(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    loadSchema()
  }, [id])

  const handleBack = () => navigate('/schemas')

  if (loading) return <Loader />
  if (error) return <div>Error: {error}</div>

  return <SchemaEditor schema={schema} handleBack={handleBack} />
}
