import { ApiError } from '@/api/client'
import { deleteEntry, getEntries } from '@/api/entries'
import { getSchema } from '@/api/schemas'
import { confirmDelete } from '@/components/confirmDelete'
import { EntityActions } from '@/components/EntityActions'
import { ListPageHeader } from '@/components/ListPageHeader'
import { NotFoundPage } from '@/components/NotFoundPage'
import { useRealtimeEvent } from '@/realtime/useRealtimeEvent'
import {
  Anchor,
  Button,
  Card,
  Center,
  Loader,
  SimpleGrid,
  Stack,
  Text
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import type { Entry, Schema } from '@shared/types'
import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  SCHEMAS_ROUTE,
  entryEditPath,
  newEntryPath
} from '@/features/routes/paths'
import { getReferenceLabels } from './referenceLabels'
import { getEntryLabel } from './entryUtils'

export const EntriesPage = () => {
  const navigate = useNavigate()
  const { schemaId } = useParams<{ schemaId: string }>()
  const [entries, setEntries] = useState<Entry[]>([])
  const [schema, setSchema] = useState<Schema>()
  const [referenceLabels, setReferenceLabels] = useState<
    Record<string, string>
  >({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const refreshEntries = async () => {
    if (!schemaId) return
    try {
      const data = await getEntries(schemaId)
      setEntries(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    }
  }

  useRealtimeEvent<{ schemaId: string; entryId: string }>(
    'entries:changed',
    (payload) => {
      if (payload.schemaId === schemaId) refreshEntries()
    }
  )

  const handleDeleteEntry = async (entryToDelete: Entry) => {
    if (!schemaId) return

    try {
      await deleteEntry(schemaId, entryToDelete.id)
      const data = await getEntries(schemaId)
      setEntries(data)
      notifications.show({ message: 'Entry deleted', color: 'green' })
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    }
  }

  const openDeleteModal = (entryToDelete: Entry, currentSchema: Schema) =>
    confirmDelete({
      title: 'Delete entry',
      message: `Are you sure you want to delete "${getEntryLabel(entryToDelete, currentSchema)}" entry? This action cannot be undone.`,
      onConfirm: () => handleDeleteEntry(entryToDelete)
    })

  useEffect(() => {
    if (!schema) return

    const loadReferenceLabels = async () => {
      try {
        setReferenceLabels(await getReferenceLabels(schema.fields))
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      }
    }

    loadReferenceLabels()
  }, [schema])

  useEffect(() => {
    const loadEntries = async () => {
      try {
        if (!schemaId) return
        const [data, fetchedSchema] = await Promise.all([
          getEntries(schemaId),
          getSchema(schemaId)
        ])

        setEntries(data)
        setSchema(fetchedSchema)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setLoading(false)
      }
    }

    loadEntries()
  }, [schemaId])

  if (loading) return <Loader />
  if (error instanceof ApiError && error.status === 404) {
    return <NotFoundPage />
  }
  if (error) return <div>Error: {error.message}</div>
  if (!schema) return null

  return (
    <div>
      <Button
        variant="subtle"
        onClick={() => navigate(SCHEMAS_ROUTE)}
        leftSection={<ArrowLeft size={16} />}
        color="gray"
      >
        Back
      </Button>
      <ListPageHeader
        title={`Entries for ${schema.name} schema`}
        actionLabel="Add Entry"
        onAction={() => navigate(newEntryPath(schemaId!))}
      />
      {entries.length > 0 ? (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} mt="md">
          {entries.map((entry) => (
            <Card key={entry.id} withBorder padding="lg" radius="md">
              <Stack gap="xs">
                {schema.fields.map((field) => {
                  const value = entry.data[field.id]
                  const isEmpty = value === '' || value == null

                  return (
                    <Text key={field.id} size="sm">
                      <strong>{field.name}:</strong>{' '}
                      {isEmpty ? (
                        '-'
                      ) : field.type === 'reference' &&
                        field.referenceTargetSchemaId ? (
                        <Anchor
                          component={Link}
                          to={entryEditPath(
                            field.referenceTargetSchemaId,
                            String(value)
                          )}
                          size="sm"
                        >
                          {referenceLabels[String(value)] ?? String(value)}
                        </Anchor>
                      ) : (
                        String(value)
                      )}
                    </Text>
                  )
                })}

                <EntityActions
                  mt="md"
                  onEdit={() => navigate(entryEditPath(schema.id, entry.id))}
                  onDelete={() => openDeleteModal(entry, schema)}
                />
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      ) : (
        <Center mih={200}>
          <Text c="dimmed">No entries yet.</Text>
        </Center>
      )}
    </div>
  )
}
