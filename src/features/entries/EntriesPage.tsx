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

  useEffect(() => {
    if (!schema) return

    const targetSchemaIds = [
      ...new Set(
        schema.fields
          .filter((field) => field.type === 'reference')
          .map((field) => field.referenceTargetSchemaId)
          .filter((id): id is string => Boolean(id))
      )
    ]
    if (targetSchemaIds.length === 0) return

    const loadReferenceLabels = async () => {
      try {
        const labels: Record<string, string> = {}

        await Promise.all(
          targetSchemaIds.map(async (targetSchemaId) => {
            const [targetSchema, targetEntries] = await Promise.all([
              getSchema(targetSchemaId),
              getEntries(targetSchemaId)
            ])
            const titleField = targetSchema.fields[0]
            for (const targetEntry of targetEntries) {
              const value = titleField
                ? targetEntry.data[titleField.id]
                : undefined
              labels[targetEntry.id] =
                value === null || value === undefined || value === ''
                  ? targetEntry.id
                  : String(value)
            }
          })
        )

        setReferenceLabels(labels)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      }
    }

    loadReferenceLabels()
  }, [schema])

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

  const entryLabel = (entryToLabel: Entry) => {
    const textField = schema?.fields.find((field) => {
      if (field.type !== 'text') return false
      const value = entryToLabel.data[field.id]
      return typeof value === 'string' && value !== ''
    })

    if (textField) {
      return String(entryToLabel.data[textField.id])
    }

    return `${entryToLabel.id.slice(0, 8)}…`
  }

  const openDeleteModal = (entryToDelete: Entry) =>
    confirmDelete({
      title: 'Delete entry',
      message: `Are you sure you want to delete "${entryLabel(entryToDelete)}" entry? This action cannot be undone.`,
      onConfirm: () => handleDeleteEntry(entryToDelete)
    })

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
                  onDelete={() => openDeleteModal(entry)}
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
