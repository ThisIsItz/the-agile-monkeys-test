import { getEntry } from '@/api/entries'
import { ReloadWarning } from '@/components/ReloadWarning'
import { useRealtimeEvent } from '@/realtime/useRealtimeEvent'
import { Loader } from '@mantine/core'
import { type Entry, type Schema } from '@shared/types'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { EntryEditor } from './EntryEditor'
import { getSchema } from '@/api/schemas'
import { NotFoundPage } from '@/components/NotFoundPage'
import { ApiError } from '@/api/client'
import { entriesPath } from '@/features/routes/paths'

export const EntryEditorPage = () => {
  const { entryId, schemaId } = useParams<{
    entryId: string
    schemaId: string
  }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [entry, setEntry] = useState<Entry | undefined>(undefined)
  const [schema, setSchema] = useState<Schema | undefined>(undefined)
  const [schemaChanged, setSchemaChanged] = useState(false)
  const [entryChanged, setEntryChanged] = useState(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)

  const needsReview =
    (
      location.state as {
        needsReview?: {
          entryId: string
          fieldId?: string
          fieldName: string
        }[]
      } | null
    )?.needsReview ?? []

  const reviewFields = needsReview.filter((item) => item.entryId === entryId)

  const handleBack = () => {
    if (location.key !== 'default') {
      navigate(-1)
    } else {
      navigate(entriesPath(schemaId!))
    }
  }

  const handleSaved = () => {
    const remainingNeedsReview = needsReview.filter(
      (item) => item.entryId !== entryId
    )
    navigate(entriesPath(schemaId!), {
      state: { needsReview: remainingNeedsReview }
    })
  }

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
      setError(err instanceof Error ? err : new Error('Unknown error'))
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
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [entryId, schemaId])

  if (loading) return <Loader />
  if (error instanceof ApiError && error.status === 404) {
    return <NotFoundPage />
  }
  if (error) return <div>Error: {error.message}</div>
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
        handleSaved={handleSaved}
        reviewFields={reviewFields}
      />
    </div>
  )
}
