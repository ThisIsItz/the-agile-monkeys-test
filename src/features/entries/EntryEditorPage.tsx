import { getEntry } from '@/api/entries'
import { useRealtimeEvent } from '@/realtime/useRealtimeEvent'
import { Alert, Button, Loader, Stack, Text, Group } from '@mantine/core'
import { type Entry, type Schema } from '@shared/types'
import { RotateCw, TriangleAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { EntryEditor } from './EntryEditor'
import { getSchema } from '@/api/schemas'

export const EntryEditorPage = () => {
  const { entryId, schemaId } = useParams<{
    entryId: string
    schemaId: string
  }>()
  const navigate = useNavigate()
  const [entry, setEntry] = useState<Entry | undefined>(undefined)
  const [schema, setSchema] = useState<Schema | undefined>(undefined)
  const [schemaChanged, setSchemaChanged] = useState(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const handleBack = () => navigate(`/schemas/${schemaId}/entries`)

  useRealtimeEvent<{ schemaId: string }>('schemas:changed', (payload) => {
    if (payload.schemaId === schemaId) setSchemaChanged(true)
  })

  const handleReload = async () => {
    if (!schemaId) return

    try {
      const schemaData = await getSchema(schemaId)
      setSchema(schemaData)

      if (entryId) {
        const entryData = await getEntry(schemaId, entryId)
        setEntry(entryData)
      }

      setSchemaChanged(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  useEffect(() => {
    if (!schemaId) return

    const loadData = async () => {
      try {
        const schemaData = await getSchema(schemaId)
        setSchema(schemaData)

        if (entryId) {
          const entryData = await getEntry(schemaId, entryId)
          setEntry(entryData)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [entryId, schemaId])

  if (loading) return <Loader />
  if (error) return <div>Error: {error}</div>
  if (!schema) return null

  return (
    <div>
      {schemaChanged && (
        <Alert
          color="yellow"
          icon={<TriangleAlert size={16} />}
          title="This schema was changed"
          mb="md"
        >
          <Stack gap="sm">
            <Text size="sm">
              This schema changed while you were editing. Reload to use the
              latest fields. Any unsaved changes will be lost.
            </Text>

            <Group align="center">
              <Button
                size="xs"
                variant="outline"
                color="orange"
                onClick={handleReload}
                leftSection={<RotateCw size={16} />}
              >
                Reload
              </Button>
            </Group>
          </Stack>
        </Alert>
      )}
      <EntryEditor
        key={schema.updatedAt}
        entry={entry}
        schema={schema}
        handleBack={handleBack}
      />
    </div>
  )
}
