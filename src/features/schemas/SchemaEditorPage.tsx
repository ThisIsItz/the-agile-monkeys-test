import { getSchema } from '@/api/schemas'
import { ReloadWarning } from '@/components/ReloadWarning'
import { useRealtimeEvent } from '@/realtime/useRealtimeEvent'
import { Button, Loader, Title } from '@mantine/core'
import { type Schema } from '@shared/types'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { SchemaEditor } from './SchemaEditor'
import { ApiError } from '@/api/client'
import { NotFoundPage } from '@/components/NotFoundPage'
import { SCHEMAS_ROUTE } from '@/features/routes/paths'
import { ArrowLeft } from 'lucide-react'

export const SchemaEditorPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [schema, setSchema] = useState<Schema | undefined>(undefined)
  const [schemaChanged, setSchemaChanged] = useState(false)
  const [loading, setLoading] = useState(Boolean(id))
  const [error, setError] = useState<Error | null>(null)

  const handleBack = () => navigate(SCHEMAS_ROUTE)

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
      setError(err instanceof Error ? err : new Error('Unknown error'))
    }
  }

  useEffect(() => {
    if (!id) return

    const loadSchema = async () => {
      try {
        const data = await getSchema(id)
        setSchema(data)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setLoading(false)
      }
    }

    loadSchema()
  }, [id])

  if (loading) return <Loader />
  if (error instanceof ApiError && error.status === 404) {
    return <NotFoundPage />
  }
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <Button
        variant="subtle"
        onClick={handleBack}
        leftSection={<ArrowLeft size={16} />}
        color="gray"
      >
        Back
      </Button>
      <Title>{schema ? 'Edit Schema' : 'Create Schema'}</Title>
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
