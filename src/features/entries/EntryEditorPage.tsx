import { getEntry } from '@/api/entries'
import { ReloadWarning } from '@/components/ReloadWarning'
import { useRealtimeEvent } from '@/realtime/useRealtimeEvent'
import { Loader } from '@mantine/core'
import { type Entry, type Schema } from '@shared/types'
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
  const [entryChanged, setEntryChanged] = useState(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const handleBack = () => navigate(`/schemas/${schemaId}/entries`)

  useRealtimeEvent<{ schemaId: string }>('schemas:changed', (payload) => {
    if (payload.schemaId === schemaId) setSchemaChanged(true)
  })

  useRealtimeEvent<{ schemaId: string; entryId: string }>(
    'entries:changed',
    (payload) => {
      if (!entryId) return
      if (payload.schemaId === schemaId && payload.entryId === entryId) {
        setEntryChanged(true)
      }
    }
  )

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
      setEntryChanged(false)
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
        <ReloadWarning
          title="This schema was changed"
          message="This schema changed while you were editing. Reload to use the latest fields. Any unsaved changes will be lost."
          onReload={handleReload}
        />
      )}
      {entryChanged && (
        <ReloadWarning
          title="This entry was changed"
          message="This entry was changed or deleted elsewhere while you were editing. Reload to see the latest version. Any unsaved changes will be lost."
          onReload={handleReload}
        />
      )}
      <EntryEditor
        key={`${schema.updatedAt}-${entry?.updatedAt ?? 'new'}`}
        entry={entry}
        schema={schema}
        handleBack={handleBack}
      />
    </div>
  )
}
