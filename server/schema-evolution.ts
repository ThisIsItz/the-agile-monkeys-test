import type { FieldInput, Schema, SchemaInput } from '@shared/types.js'
import type { FieldChange } from './schema-evolution.types.js'

export function diffSchemaFields(
  existing: Schema,
  input: SchemaInput
): FieldChange[] {
  const incomingById = new Map<string, FieldInput>()
  for (const field of input.fields) {
    if (field.id) incomingById.set(field.id, field)
  }

  const changes: FieldChange[] = []

  for (const field of existing.fields) {
    const incoming = incomingById.get(field.id)

    if (!incoming) {
      changes.push({
        fieldId: field.id,
        fieldName: field.name,
        changeType: 'deleted'
      })
      continue
    }

    if (incoming.name !== field.name) {
      changes.push({
        fieldId: field.id,
        fieldName: field.name,
        changeType: 'renamed',
        before: field.name,
        after: incoming.name
      })
    }

    if (incoming.type !== field.type) {
      changes.push({
        fieldId: field.id,
        fieldName: field.name,
        changeType: 'retyped',
        before: field.type,
        after: incoming.type
      })
    } else if (field.type === 'reference') {
      const newTarget = incoming.referenceTargetSchemaId ?? null
      if (newTarget !== field.referenceTargetSchemaId) {
        changes.push({
          fieldId: field.id,
          fieldName: field.name,
          changeType: 'reference_target_changed',
          before: field.referenceTargetSchemaId,
          after: newTarget
        })
      }
    }

    if (incoming.required && !field.required) {
      changes.push({
        fieldId: field.id,
        fieldName: field.name,
        changeType: 'made_required'
      })
    }
  }

  return changes
}
