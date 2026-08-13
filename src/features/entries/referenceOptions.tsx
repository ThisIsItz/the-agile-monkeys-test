import { getEntries } from '@/api/entries'
import { getSchema } from '@/api/schemas'
import type { Field } from '@shared/types'

export type ReferenceOption = {
  value: string
  label: string
}

export async function getReferenceOptions(
  fields: Field[]
): Promise<Record<string, ReferenceOption[]>> {
  const referenceFields = fields.filter(
    (field): field is Field & { referenceTargetSchemaId: string } =>
      field.type === 'reference' && Boolean(field.referenceTargetSchemaId)
  )

  if (referenceFields.length === 0) {
    return {}
  }

  const targetSchemaIds = [
    ...new Set(referenceFields.map((field) => field.referenceTargetSchemaId))
  ]

  const optionsBySchemaId: Record<string, ReferenceOption[]> = {}

  await Promise.all(
    targetSchemaIds.map(async (targetSchemaId) => {
      const [targetSchema, targetEntries] = await Promise.all([
        getSchema(targetSchemaId),
        getEntries(targetSchemaId)
      ])

      const titleField = targetSchema.fields[0]

      optionsBySchemaId[targetSchemaId] = targetEntries.map((targetEntry) => {
        const value = titleField ? targetEntry.data[titleField.id] : undefined
        const hasLabel = value !== null && value !== undefined && value !== ''

        return {
          value: targetEntry.id,
          label: hasLabel ? String(value) : targetEntry.id
        }
      })
    })
  )

  return Object.fromEntries(
    referenceFields.map((field) => [
      field.id,
      optionsBySchemaId[field.referenceTargetSchemaId] ?? []
    ])
  )
}
