import { createSchema, getSchemas, updateSchema } from '@/api/schemas'
import { FIELD_TYPES, type FieldInput, type FieldType, type Schema } from '@shared/types'
import { useEffect, useState } from 'react'
import { notifications } from '@mantine/notifications'

export const SchemaForm = ({
  schema,
  handleBack
}: {
  schema?: Schema
  handleBack: () => void
}) => {
  const [name, setName] = useState(schema?.name ?? '')
  const [fields, setFields] = useState<FieldInput[]>(
    schema?.fields.map(
      ({ id, name, type, required, referenceTargetSchemaId }) => ({
        id,
        name,
        type,
        required,
        referenceTargetSchemaId
      })
    ) ?? []
  )
  const [availableSchemas, setAvailableSchemas] = useState<Schema[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadAvailableSchemas = async () => {
      try {
        const data = await getSchemas()
        setAvailableSchemas(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      }
    }

    loadAvailableSchemas()
  }, [])

  const handleAddField = () => {
    setFields([
      ...fields,
      {
        name: '',
        type: 'text',
        required: false
      }
    ])
  }

  const handleFieldChange = (index: number, field: Partial<FieldInput>) => {
    const newFields = [...fields]
    newFields[index] = { ...newFields[index], ...field }
    setFields(newFields)
  }

  const handleRemoveField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (schema) {
        await updateSchema(schema.id, { name, fields })
        notifications.show({ message: `Schema "${name}" updated`, color: 'green' })
      } else {
        await createSchema({ name, fields })
        notifications.show({ message: `Schema "${name}" created`, color: 'green' })
      }
      handleBack()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <button type="button" onClick={handleBack}>
        Back
      </button>
      <h2>{schema ? 'Edit Schema' : 'Create Schema'}</h2>
      <div>
        <label>
          Schema Name:
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
      </div>
      <div>
        <h3>Fields</h3>
        {fields.map((field, index) => (
          <div key={index}>
            <input
              type="text"
              placeholder="Field Name"
              value={field.name}
              onChange={(e) =>
                handleFieldChange(index, { name: e.target.value })
              }
              required
            />
            <select
              value={field.type}
              onChange={(e) =>
                handleFieldChange(index, { type: e.target.value as FieldType })
              }
            >
              {FIELD_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <label>
              Required:
              <input
                type="checkbox"
                checked={field.required}
                onChange={(e) =>
                  handleFieldChange(index, { required: e.target.checked })
                }
              />
            </label>
            {field.type === 'reference' && (
              <select
                value={field.referenceTargetSchemaId ?? ''}
                onChange={(e) =>
                  handleFieldChange(index, {
                    referenceTargetSchemaId: e.target.value
                  })
                }
                required
              >
                <option value="" disabled>
                  Select referenced schema
                </option>
                {availableSchemas.map((schema) => (
                  <option key={schema.id} value={schema.id}>
                    {schema.name}
                  </option>
                ))}
              </select>
            )}
            <button type="button" onClick={() => handleRemoveField(index)}>
              Remove
            </button>
          </div>
        ))}
        <button type="button" onClick={handleAddField}>
          Add Field
        </button>
      </div>
      {error && <p className="schema-form__error">{error}</p>}
      <button type="submit" disabled={loading}>
        {schema
          ? loading
            ? 'Saving...'
            : 'Save Changes'
          : loading
            ? 'Creating...'
            : 'Create Schema'}
      </button>
    </form>
  )
}
