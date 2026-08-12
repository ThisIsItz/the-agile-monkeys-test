import { createEntry, updateEntry } from '@/api/entries'
import {
  Alert,
  Button,
  Checkbox,
  NumberInput,
  Select,
  Stack,
  TextInput,
  Title
} from '@mantine/core'
import { useForm } from '@mantine/form'
import type { Entry, EntryInput, Field, Schema } from '@shared/types'
import { ArrowLeft, TriangleAlert } from 'lucide-react'
import { useState } from 'react'

export const EntryEditor = ({
  entry,
  schema,
  handleBack
}: {
  entry?: Entry
  schema: Schema
  handleBack: () => void
}) => {
  const [error, setError] = useState<string | null>(null)
  const entryForm = useForm<EntryInput>({
    initialValues: {
      data: Object.fromEntries(
        schema.fields.map((field: Field) => [
          field.id,
          entry?.data[field.id] ?? (field.type === 'boolean' ? false : '')
        ])
      )
    }
  })

  const handleFormSubmit = async (values: EntryInput) => {
    setError(null)

    try {
      if (entry) {
        await updateEntry(schema.id, entry.id, values)
      } else {
        await createEntry(schema.id, values)
      }

      handleBack()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const renderField = (field: Schema['fields'][number]) => {
    const path = `data.${field.id}`

    switch (field.type) {
      case 'text':
        return (
          <TextInput
            key={field.id}
            label={field.name}
            required={field.required}
            {...entryForm.getInputProps(path)}
          />
        )

      case 'number':
        return (
          <NumberInput
            key={field.id}
            label={field.name}
            required={field.required}
            {...entryForm.getInputProps(path)}
          />
        )

      case 'boolean':
        return (
          <Checkbox
            key={field.id}
            label={field.name}
            {...entryForm.getInputProps(path, { type: 'checkbox' })}
          />
        )

      case 'date':
        return (
          <TextInput
            key={field.id}
            type="date"
            label={field.name}
            required={field.required}
            {...entryForm.getInputProps(path)}
          />
        )

      case 'reference':
        return (
          <Select
            key={field.id}
            label={field.name}
            required={field.required}
            data={[]}
            {...entryForm.getInputProps(path)}
          />
        )
    }
  }

  return (
    <div>
      <Button
        variant="subtle"
        onClick={handleBack}
        leftSection={<ArrowLeft size={16} />}
        color="gray"
      >
        Back
      </Button>
      <Title>{entry ? 'Edit Entry' : 'Create Entry'}</Title>
      {error && (
        <Alert color="red" mt="md" icon={<TriangleAlert size={16} />}>
          {error}
        </Alert>
      )}
      <form onSubmit={entryForm.onSubmit(handleFormSubmit)}>
        <Stack mt="md">
          {schema.fields.map(renderField)}
          <Button type="submit" loading={entryForm.submitting}>
            {entry ? 'Save changes' : 'Create entry'}
          </Button>
        </Stack>
      </form>
    </div>
  )
}
