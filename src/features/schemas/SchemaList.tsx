import type { Schema } from '@shared/types'
import { useEffect, useState } from 'react'
import { deleteSchema, getSchemas } from '@/api/schemas.ts'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import { Button, Card, Group, SimpleGrid, Stack, Text } from '@mantine/core'

export const SchemaList = ({
  handleAdd,
  handleEdit
}: {
  handleAdd: () => void
  handleEdit: (schema: Schema) => void
}) => {
  const [schemas, setSchemas] = useState<Schema[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
    modals.openConfirmModal({
      title: 'Delete schema',
      children: (
        <p>
          Are you sure you want to delete the schema "{schema.name}"? This
          action cannot be undone.
        </p>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => handleDeleteSchema(schema)
    })

  const referenceTargetName = (targetId: string) =>
    schemas.find((schema) => schema.id === targetId)?.name ?? 'Unknown'

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <h1>Schemas</h1>
      <button type="button" onClick={handleAdd}>
        Add new schema
      </button>
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
              <Text fw={600} size="lg" mb="sm">
                {schema.name}
              </Text>

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

              <Group justify="flex-end" gap="xs" mt="auto">
                <Button
                  size="xs"
                  variant="light"
                  onClick={() => handleEdit(schema)}
                >
                  Edit
                </Button>
                <Button
                  size="xs"
                  variant="light"
                  color="red"
                  onClick={() => openDeleteModal(schema)}
                >
                  Delete
                </Button>
              </Group>
            </Card>
          ))}
        </SimpleGrid>
      ) : (
        <p>No schemas yet.</p>
      )}
    </div>
  )
}
