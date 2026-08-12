import { getEntry } from '@/api/entries'
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
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const handleBack = () => navigate(`/schemas/${schemaId}/entries`)

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

  return <EntryEditor entry={entry} schema={schema} handleBack={handleBack} />
}
