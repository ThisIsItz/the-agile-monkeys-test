import { createEntry, updateEntry } from '@/api/entries'
import { Alert, Button, Stack, Title } from '@mantine/core'
import { useForm } from '@mantine/form'
import type { Entry, EntryInput, Field, Schema } from '@shared/types'
import { ArrowLeft, TriangleAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { EntryFieldInput } from './EntryFieldInput'
import { getReferenceOptions } from './referenceOptions'

const getEntryInitialValues = (schema: Schema, entry?: Entry): EntryInput => ({
  data: Object.fromEntries(
    schema.fields.map((field: Field) => [
      field.id,
      entry?.data[field.id] ?? (field.type === 'boolean' ? false : '')
    ])
  )
})

export const EntryEditor = ({
  entry,
  schema,
  handleBack,
  handleSaved,
  reviewFields
}: {
  entry?: Entry
  schema: Schema
  handleBack: () => void
  handleSaved: () => void
  reviewFields: {
    fieldId?: string
    fieldName: string
  }[]
}) => {
  const [error, setError] = useState<Error | null>(null)
  const [referenceOptions, setReferenceOptions] = useState<
    Record<string, { value: string; label: string }[]>
  >({})
  const entryForm = useForm<EntryInput>({
    initialValues: getEntryInitialValues(schema, entry)
  })

  const handleFormSubmit = async (values: EntryInput) => {
    setError(null)

    try {
      if (entry) {
        await updateEntry(schema.id, entry.id, values)
      } else {
        await createEntry(schema.id, values)
      }

      handleSaved()
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    }
  }

  useEffect(() => {
    const loadReferenceOptions = async () => {
      try {
        setReferenceOptions(await getReferenceOptions(schema.fields))
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      }
    }

    loadReferenceOptions()
  }, [schema])

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
          {error.message}
        </Alert>
      )}
      <form onSubmit={entryForm.onSubmit(handleFormSubmit)}>
        <Stack mt="md">
          {schema.fields.map((field) => {
            const needsReview = reviewFields.some(
              (item) =>
                item.fieldId === field.id ||
                (!item.fieldId && item.fieldName === field.name)
            )

            return (
              <EntryFieldInput
                key={field.id}
                field={field}
                form={entryForm}
                referenceOptions={referenceOptions[field.id] ?? []}
                needsReview={needsReview}
              />
            )
          })}
          <Button type="submit" loading={entryForm.submitting}>
            {entry ? 'Save changes' : 'Create entry'}
          </Button>
        </Stack>
      </form>
    </div>
  )
}
