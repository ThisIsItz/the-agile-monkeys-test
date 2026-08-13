import { deleteSchema, getSchemas } from '@/api/schemas.ts'
import { confirmDelete } from '@/components/confirmDelete'
import { EntityActions } from '@/components/EntityActions'
import { ListPageHeader } from '@/components/ListPageHeader'
import { useRealtimeEvent } from '@/realtime/useRealtimeEvent'
import {
  Button,
  Card,
  Center,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Text
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import type { Schema } from '@shared/types'
import { ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export const SchemaList = () => {
  const navigate = useNavigate()
  const [schemas, setSchemas] = useState<Schema[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const handleDeleteSchema = async (schema: Schema) => {
    try {
      await deleteSchema(schema.id)
      const data = await getSchemas()
      setSchemas(data)
      notifications.show({
        message: `Schema "${schema.name}" deleted`,
        color: 'green'
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const openDeleteModal = (schema: Schema) =>
    confirmDelete({
      title: 'Delete schema',
      message: `Are you sure you want to delete the schema "${schema.name}"? This action cannot be undone.`,
      onConfirm: () => handleDeleteSchema(schema)
    })

  const referenceTargetName = (targetId: string) =>
    schemas.find((schema) => schema.id === targetId)?.name ?? 'Unknown'

  const refreshSchemas = async () => {
    try {
      const data = await getSchemas()
      setSchemas(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  useRealtimeEvent('schemas:changed', () => {
    refreshSchemas()
  })

  useEffect(() => {
    const loadSchemas = async () => {
      try {
        const data = await getSchemas()
        setSchemas(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    loadSchemas()
  }, [])

  if (loading) return <Loader />

  return (
    <div>
      <ListPageHeader
        title="Schemas"
        actionLabel="Add schema"
        onAction={() => navigate('/schemas/new')}
      />
      {error && <p className="schema-list__error">{error}</p>}

      {schemas.length > 0 ? (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} mt="md">
          {schemas.map((schema) => (
            <Card
              key={schema.id}
              withBorder
              padding="lg"
              radius="md"
              style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%'
              }}
            >
              <Group justify="space-between" align="center" mb="md">
                <Text fw={600} size="lg">
                  {schema.name}
                </Text>
                <Button
                  variant="subtle"
                  size="xs"
                  onClick={() => navigate(`/schemas/${schema.id}/entries`)}
                  rightSection={<ArrowRight size={16} />}
                >
                  View entries
                </Button>
              </Group>

              <Stack gap={4}>
                {schema.fields.map((field) => (
                  <Group key={field.id} gap="xs">
                    <Text size="md" fw={500}>
                      {field.name}
                    </Text>
                    <Text size="sm">{field.type}</Text>
                    {field.type === 'reference' &&
                      field.referenceTargetSchemaId && (
                        <Text size="sm">
                          → {referenceTargetName(field.referenceTargetSchemaId)}
                        </Text>
                      )}
                  </Group>
                ))}
              </Stack>

              <EntityActions
                mt="auto"
                onEdit={() => navigate(`/schemas/${schema.id}/edit`)}
                onDelete={() => openDeleteModal(schema)}
              />
            </Card>
          ))}
        </SimpleGrid>
      ) : (
        <Center mih={200}>
          <Text c="dimmed">No schemas yet.</Text>
        </Center>
      )}
    </div>
  )
}
