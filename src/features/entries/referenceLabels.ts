import type { Field } from '@shared/types'
import {
  getReferenceFields,
  resolveReferenceEntryLabels
} from './referenceResolution'

export async function getReferenceLabels(
  fields: Field[]
): Promise<Record<string, string>> {
  const targetSchemaIds = [
    ...new Set(
      getReferenceFields(fields).map((field) => field.referenceTargetSchemaId)
    )
  ]

  if (targetSchemaIds.length === 0) return {}

  const labelsBySchemaId = await resolveReferenceEntryLabels(targetSchemaIds)
  return Object.assign({}, ...Object.values(labelsBySchemaId))
}
