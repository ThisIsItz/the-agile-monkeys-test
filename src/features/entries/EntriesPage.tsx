import { getEntries } from '@/api/entries'
import { getSchema } from '@/api/schemas'
import { Button, Center, Group, Loader, Text, Title } from '@mantine/core'
import type { Entry } from '@shared/types'
import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

export const EntriesPage = () => {
  const navigate = useNavigate()
  const { schemaId } = useParams<{ schemaId: string }>()
  const [entries, setEntries] = useState<Entry[]>([])
  const [schemaName, setSchemaName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadEntries = async () => {
      try {
        if (!schemaId) return
        const [data, schema] = await Promise.all([
          getEntries(schemaId),
          getSchema(schemaId).catch(() => null)
        ])
        setEntries(data)
        if (schema) setSchemaName(schema.name)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    loadEntries()
  }, [schemaId])

  if (loading) return <Loader />
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <Group justify="space-between" align="center" mb="xl">
        <Title>Entries for {schemaName} schema</Title>
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
        <div>Entries list</div>
      ) : (
        <Center mih={200}>
          <Text c="dimmed">No entries yet.</Text>
        </Center>
      )}
    </div>
  )
}
