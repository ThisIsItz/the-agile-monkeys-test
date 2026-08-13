import {
  getEntryById,
  listEntries
} from '@server/entries/entries.repository.js'
import type {
  EntryFieldValue,
  FieldInput,
  FieldType,
  Schema,
  SchemaInput
} from '@shared/types.js'
import type { FieldChange, FieldChangeImpact } from '@shared/types.js'
import { fieldValueSchema } from './validation.js'

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

function hasValue(
  value: EntryFieldValue | undefined
): value is EntryFieldValue {
  return value !== null && value !== undefined
}

function isValueValidForShape(
  shape: { type: FieldType; required: boolean },
  value: EntryFieldValue | undefined
): boolean {
  if (!hasValue(value)) return !shape.required
  return fieldValueSchema(shape).safeParse(value).success
}

export function findAffectedEntries(
  schemaId: string,
  changes: FieldChange[],
  input: SchemaInput
): FieldChangeImpact[] {
  const entries = listEntries(schemaId)

  const incomingRequiredById = new Map<string, boolean>()
  for (const field of input.fields) {
    if (field.id) incomingRequiredById.set(field.id, field.required)
  }

  return changes.map((change) => {
    switch (change.changeType) {
      case 'renamed':
        return { ...change, affectedEntryIds: [] }

      case 'deleted':
        return {
          ...change,
          affectedEntryIds: entries
            .filter((entry) => hasValue(entry.data[change.fieldId]))
            .map((entry) => entry.id)
        }

      case 'retyped': {
        const required = incomingRequiredById.get(change.fieldId) ?? false
        return {
          ...change,
          affectedEntryIds: entries
            .filter(
              (entry) =>
                !isValueValidForShape(
                  { type: change.after, required },
                  entry.data[change.fieldId]
                )
            )
            .map((entry) => entry.id)
        }
      }

      case 'made_required':
        return {
          ...change,
          affectedEntryIds: entries
            .filter((entry) => !hasValue(entry.data[change.fieldId]))
            .map((entry) => entry.id)
        }

      case 'reference_target_changed':
        return {
          ...change,
          affectedEntryIds: entries
            .filter((entry) => {
              const value = entry.data[change.fieldId]
              if (!hasValue(value) || typeof value !== 'string') return false
              if (!change.after) return false
              return getEntryById(change.after, value) === undefined
            })
            .map((entry) => entry.id)
        }
    }
  })
}
