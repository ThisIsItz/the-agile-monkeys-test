import { createEntry, getEntries, updateEntry } from '@/api/entries'
import { getSchema } from '@/api/schemas'
import { Alert, Button, Stack, Title } from '@mantine/core'
import { useForm } from '@mantine/form'
import type { Entry, EntryInput, Field, Schema } from '@shared/types'
import { ArrowLeft, TriangleAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { EntryFieldInput } from './EntryFieldInput'

export const EntryEditor = ({
  entry,
  schema,
  handleBack
}: {
  entry?: Entry
  schema: Schema
  handleBack: () => void
}) => {
  const [error, setError] = useState<Error | null>(null)
  const [referenceOptions, setReferenceOptions] = useState<
    Record<string, { value: string; label: string }[]>
  >({})
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

  useEffect(() => {
    const referenceFields = schema.fields.filter(
      (field) => field.type === 'reference' && field.referenceTargetSchemaId
    )
    if (referenceFields.length === 0) return

    const targetSchemaIds = [
      ...new Set(
        referenceFields.map((field) => field.referenceTargetSchemaId as string)
      )
    ]

    const loadReferenceOptions = async () => {
      try {
        const optionsBySchemaId: Record<
          string,
          { value: string; label: string }[]
        > = {}

        await Promise.all(
          targetSchemaIds.map(async (targetSchemaId) => {
            const [targetSchema, targetEntries] = await Promise.all([
              getSchema(targetSchemaId),
              getEntries(targetSchemaId)
            ])
            const titleField = targetSchema.fields[0]

            optionsBySchemaId[targetSchemaId] = targetEntries.map(
              (targetEntry) => {
                const value = titleField
                  ? targetEntry.data[titleField.id]
                  : undefined
                const label =
                  value === null || value === undefined || value === ''
                    ? targetEntry.id
                    : String(value)
                return { value: targetEntry.id, label }
              }
            )
          })
        )

        const optionsByFieldId: Record<
          string,
          { value: string; label: string }[]
        > = {}
        for (const field of referenceFields) {
          optionsByFieldId[field.id] =
            optionsBySchemaId[field.referenceTargetSchemaId as string] ?? []
        }

        setReferenceOptions(optionsByFieldId)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      }
    }

    loadReferenceOptions()
  }, [schema])

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
      setError(err instanceof Error ? err : new Error('Unknown error'))
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
          {error.message}
        </Alert>
      )}
      <form onSubmit={entryForm.onSubmit(handleFormSubmit)}>
        <Stack mt="md">
          {schema.fields.map((field) => (
            <EntryFieldInput
              key={field.id}
              field={field}
              form={entryForm}
              referenceOptions={referenceOptions[field.id] ?? []}
            />
          ))}
          <Button type="submit" loading={entryForm.submitting}>
            {entry ? 'Save changes' : 'Create entry'}
          </Button>
        </Stack>
      </form>
    </div>
  )
}
