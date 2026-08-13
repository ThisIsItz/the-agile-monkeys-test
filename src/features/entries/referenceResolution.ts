import { getEntries } from '@/api/entries'
import { getSchema } from '@/api/schemas'
import type { Field } from '@shared/types'

export type ReferenceField = Field & { referenceTargetSchemaId: string }

export function getReferenceFields(fields: Field[]): ReferenceField[] {
  return fields.filter(
    (field): field is ReferenceField =>
      field.type === 'reference' && Boolean(field.referenceTargetSchemaId)
  )
}

export async function resolveReferenceEntryLabels(
  targetSchemaIds: string[]
): Promise<Record<string, Record<string, string>>> {
  const labelsBySchemaId: Record<string, Record<string, string>> = {}

  await Promise.all(
    targetSchemaIds.map(async (targetSchemaId) => {
      const [targetSchema, targetEntries] = await Promise.all([
        getSchema(targetSchemaId),
        getEntries(targetSchemaId)
      ])
      const titleField = targetSchema.fields[0]

      const labels: Record<string, string> = {}
      for (const entry of targetEntries) {
        const value = titleField ? entry.data[titleField.id] : undefined
        labels[entry.id] =
          value == null || value === '' ? entry.id : String(value)
      }

      labelsBySchemaId[targetSchemaId] = labels
    })
  )

  return labelsBySchemaId
}
