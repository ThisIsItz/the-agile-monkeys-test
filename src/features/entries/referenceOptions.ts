import type { Field } from '@shared/types'
import {
  getReferenceFields,
  resolveReferenceEntryLabels
} from './referenceResolution'

export type ReferenceOption = {
  value: string
  label: string
}

export async function getReferenceOptions(
  fields: Field[]
): Promise<Record<string, ReferenceOption[]>> {
  const referenceFields = getReferenceFields(fields)
  if (referenceFields.length === 0) return {}

  const targetSchemaIds = [
    ...new Set(referenceFields.map((field) => field.referenceTargetSchemaId))
  ]
  const labelsBySchemaId = await resolveReferenceEntryLabels(targetSchemaIds)

  const optionsBySchemaId: Record<string, ReferenceOption[]> = {}
  for (const [schemaId, labels] of Object.entries(labelsBySchemaId)) {
    optionsBySchemaId[schemaId] = Object.entries(labels).map(
      ([value, label]) => ({ value, label })
    )
  }

  return Object.fromEntries(
    referenceFields.map((field) => [
      field.id,
      optionsBySchemaId[field.referenceTargetSchemaId] ?? []
    ])
  )
}
