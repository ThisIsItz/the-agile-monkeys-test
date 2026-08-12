import { createSchema } from '@/api/schemas'
import { FIELD_TYPES, type FieldInput, type FieldType } from '@shared/types'
import { useState } from 'react'

export const SchemaForm = () => {
  const [name, setName] = useState('')
  const [fields, setFields] = useState<FieldInput[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await createSchema({ name, fields })
      setName('')
      setFields([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
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
          </div>
        ))}
        <button type="button" onClick={handleAddField}>
          Add Field
        </button>
      </div>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Schema'}
      </button>
    </form>
  )
}
