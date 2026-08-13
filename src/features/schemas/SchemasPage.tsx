import {
  deleteSchema,
  getSchemas,
  previewSchemaDeletion
} from '@/api/schemas.ts'
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
import type { Schema, SchemaDeletionImpact } from '@shared/types'
import { ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  NEW_SCHEMA_ROUTE,
  entriesPath,
  schemaEditPath
} from '@/features/routes/paths'
import { SchemaDeletePreviewModal } from './SchemaDeletePreviewModal'

export const SchemaList = () => {
  const navigate = useNavigate()
  const [schemas, setSchemas] = useState<Schema[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [schemaToDelete, setSchemaToDelete] = useState<Schema | null>(null)
  const [deleteImpact, setDeleteImpact] = useState<SchemaDeletionImpact | null>(
    null
  )

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

  const openDeleteModal = async (schema: Schema) => {
    try {
      const impact = await previewSchemaDeletion(schema.id)

      setSchemaToDelete(schema)
      setDeleteImpact(impact)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

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
        onAction={() => navigate(NEW_SCHEMA_ROUTE)}
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
                  onClick={() => navigate(entriesPath(schema.id))}
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
                onEdit={() => navigate(schemaEditPath(schema.id))}
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
      <SchemaDeletePreviewModal
        opened={Boolean(schemaToDelete && deleteImpact)}
        schema={schemaToDelete}
        impact={deleteImpact}
        onClose={() => {
          setSchemaToDelete(null)
          setDeleteImpact(null)
        }}
        onConfirm={async () => {
          if (!schemaToDelete) return

          await handleDeleteSchema(schemaToDelete)

          setSchemaToDelete(null)
          setDeleteImpact(null)
        }}
      />
    </div>
  )
}
