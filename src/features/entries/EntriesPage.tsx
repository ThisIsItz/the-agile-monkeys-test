import { getEntries } from '@/api/entries'
import { getSchema } from '@/api/schemas'
import {
  Anchor,
  Button,
  Card,
  Center,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Text,
  Title
} from '@mantine/core'
import type { Entry, Schema } from '@shared/types'
import { ArrowLeft, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

export const EntriesPage = () => {
  const navigate = useNavigate()
  const { schemaId } = useParams<{ schemaId: string }>()
  const [entries, setEntries] = useState<Entry[]>([])
  const [schema, setSchema] = useState<Schema>()
  const [referenceLabels, setReferenceLabels] = useState<Record<string, string>>(
    {}
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    loadEntries()
  }, [schemaId])

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
        console.error('Failed to load reference labels', err)
      }
    }

    loadReferenceLabels()
  }, [schema])

  if (loading) return <Loader />
  if (error) return <div>Error: {error}</div>
  if (!schema) return null

  return (
    <div>
      <Button
        variant="subtle"
        onClick={() => navigate('/schemas')}
        leftSection={<ArrowLeft size={16} />}
        color="gray"
      >
        Back
      </Button>
      <Group justify="space-between" align="center" mb="xl">
        <Title>Entries for {schema.name} schema</Title>
        <Button
          variant="filled"
          color="violet"
          onClick={() => navigate(`/schemas/${schemaId}/entries/new`)}
          size="md"
          leftSection={<Plus size={16} />}
        >
          Add Entry
        </Button>
      </Group>
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
                          to={`/schemas/${field.referenceTargetSchemaId}/entries/${value}/edit`}
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

                <Group justify="flex-end" mt="md">
                  <Button
                    size="xs"
                    variant="light"
                    onClick={() =>
                      navigate(`/schemas/${schema.id}/entries/${entry.id}/edit`)
                    }
                  >
                    Edit
                  </Button>
                </Group>
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
