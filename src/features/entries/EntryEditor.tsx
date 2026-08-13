import { createEntry, updateEntry } from '@/api/entries'
import { FormCard } from '@/components/FormCard'
import { Alert, Button, Stack } from '@mantine/core'
import { useForm } from '@mantine/form'
import type { Entry, EntryInput, Field, Schema } from '@shared/types'
import { TriangleAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { EntryFieldInput } from './EntryFieldInput'
import { isFieldFlagged, type NeedsReviewItem } from './needsReview'
import { normalizeEntryData } from './normalizeEntryData'
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
  handleSaved,
  reviewFields
}: {
  entry?: Entry
  schema: Schema
  handleSaved: () => void
  reviewFields: NeedsReviewItem[]
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
    const normalizedValues: EntryInput = {
      data: normalizeEntryData(schema, values.data)
    }

    try {
      if (entry) {
        await updateEntry(schema.id, entry.id, normalizedValues)
      } else {
        await createEntry(schema.id, normalizedValues)
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
      {error && (
        <Alert color="red" mt="md" icon={<TriangleAlert size={16} />}>
          {error.message}
        </Alert>
      )}
      <form onSubmit={entryForm.onSubmit(handleFormSubmit)}>
        <FormCard title={schema.name}>
          <Stack gap="md">
            {schema.fields.map((field) => {
              const needsReview = isFieldFlagged(reviewFields, field)

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
            <Button
              type="submit"
              loading={entryForm.submitting}
              style={{ alignSelf: 'flex-end' }}
            >
              {entry ? 'Save changes' : 'Create entry'}
            </Button>
          </Stack>
        </FormCard>
      </form>
    </div>
  )
}
