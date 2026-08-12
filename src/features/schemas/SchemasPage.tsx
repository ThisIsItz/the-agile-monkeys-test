import type { Schema } from '@shared/types'
import { useEffect, useState } from 'react'
import { deleteSchema, getSchemas } from '@/api/schemas.ts'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import {
  Button,
  Card,
  Center,
  Group,
  SimpleGrid,
  Stack,
  Text,
  Title
} from '@mantine/core'
import { Pencil, Trash2, Plus } from 'lucide-react'

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
      <Group justify="space-between" align="center" mb="xl">
        <Title>Schemas</Title>
        <Button
          variant="filled"
          color="violet"
          onClick={handleAdd}
          size="md"
          leftSection={<Plus size={16} />}
        >
          Add schema
        </Button>
      </Group>
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
                  leftSection={<Pencil size={16} />}
                >
                  Edit
                </Button>
                <Button
                  size="xs"
                  variant="light"
                  color="red"
                  onClick={() => openDeleteModal(schema)}
                  leftSection={<Trash2 size={16} />}
                >
                  Delete
                </Button>
              </Group>
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
