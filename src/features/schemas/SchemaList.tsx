import type { Schema } from '@shared/types'
import { useEffect, useState } from 'react'
import { deleteSchema, getSchemas } from '@/api/schemas.ts'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'

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

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <h1>Schemas</h1>
      <button type="button" onClick={handleAdd}>
        Add new schema
      </button>
      {error && <p className="schema-list__error">{error}</p>}

      {schemas.length > 0 ? (
        <ul>
          {schemas.map((schema) => (
            <li key={schema.id}>
              <strong>{schema.name}</strong>
              <button type="button" onClick={() => handleEdit(schema)}>
                Edit
              </button>
              <button type="button" onClick={() => openDeleteModal(schema)}>
                Delete
              </button>

              <ul>
                {schema.fields.map((field) => (
                  <li key={field.id}>
                    <span>{field.name}</span> <span>{field.type}</span>
                    {field.type === 'reference' &&
                      field.referenceTargetSchemaId && (
                        <span>
                          {schemas.find(
                            (schema) =>
                              schema.id === field.referenceTargetSchemaId
                          )?.name ?? 'Unknown'}
                        </span>
                      )}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      ) : (
        <p>No schemas yet.</p>
      )}
    </div>
  )
}
