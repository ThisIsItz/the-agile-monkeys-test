import { getSchema } from '@/api/schemas'
import { ReloadWarning } from '@/components/ReloadWarning'
import { useRealtimeEvent } from '@/realtime/useRealtimeEvent'
import { Loader } from '@mantine/core'
import { type Schema } from '@shared/types'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { SchemaEditor } from './SchemaEditor'

export const SchemaEditorPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [schema, setSchema] = useState<Schema | undefined>(undefined)
  const [schemaChanged, setSchemaChanged] = useState(false)
  const [loading, setLoading] = useState(Boolean(id))
  const [error, setError] = useState<string | null>(null)

  const handleBack = () => navigate('/schemas')

  useRealtimeEvent<{ schemaId: string }>('schemas:changed', (payload) => {
    if (id && payload.schemaId === id) setSchemaChanged(true)
  })

  const handleReload = async () => {
    if (!id) return

    try {
      const data = await getSchema(id)
      setSchema(data)
      setSchemaChanged(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

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

  if (loading) return <Loader />
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      {schemaChanged && (
        <ReloadWarning
          title="This schema was changed"
          message="This schema was changed or deleted elsewhere while you were editing. Reload to see the latest version. Any unsaved changes will be lost."
          onReload={handleReload}
        />
      )}
      <SchemaEditor
        key={schema?.updatedAt ?? 'new'}
        schema={schema}
        handleBack={handleBack}
      />
    </div>
  )
}
