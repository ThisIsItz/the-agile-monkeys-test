import {
  getEntryById,
  listEntries
} from '@server/entries/entries.repository.js'
import { listSchemas } from '@server/schemas/schemas.repository.js'
import type {
  AffectedEntry,
  Entry,
  EntryFieldValue,
  FieldInput,
  Schema,
  SchemaInput
} from '@shared/types.js'
import type {
  FieldChange,
  FieldChangeImpact,
  SchemaDeletionImpact
} from '@shared/types.js'
import { getEntryLabel } from '@shared/entryLabel.js'
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

  const existingIds = new Set(existing.fields.map((field) => field.id))
  for (const field of input.fields) {
    const isNew = !field.id || !existingIds.has(field.id)
    if (isNew && field.required) {
      changes.push({ fieldName: field.name, changeType: 'added_required' })
    }
  }

  return changes
}

function hasValue(
  value: EntryFieldValue | undefined
): value is EntryFieldValue {
  return value !== null && value !== undefined
}

function isValueValidForField(
  field: Pick<FieldInput, 'type' | 'required' | 'referenceTargetSchemaId'>,
  value: EntryFieldValue | undefined
): boolean {
  if (!hasValue(value)) return !field.required

  if (field.type === 'reference') {
    if (typeof value !== 'string' || !field.referenceTargetSchemaId) {
      return false
    }
    return getEntryById(field.referenceTargetSchemaId, value) !== undefined
  }

  return fieldValueSchema(field).safeParse(value).success
}

export function findAffectedEntries(
  existing: Schema,
  changes: FieldChange[],
  input: SchemaInput
): FieldChangeImpact[] {
  const entries = listEntries(existing.id)

  const toAffectedEntries = (matches: Entry[]): AffectedEntry[] =>
    matches.map((entry) => ({
      id: entry.id,
      label: getEntryLabel(entry, existing)
    }))

  const incomingById = new Map<string, FieldInput>()
  for (const field of input.fields) {
    if (field.id) incomingById.set(field.id, field)
  }

  return changes.map((change) => {
    switch (change.changeType) {
      case 'renamed':
        return { ...change, affectedEntries: [] }

      case 'deleted':
        return {
          ...change,
          affectedEntries: toAffectedEntries(
            entries.filter((entry) => hasValue(entry.data[change.fieldId]))
          )
        }

      case 'retyped': {
        const incoming = incomingById.get(change.fieldId)
        const newField = {
          type: change.after,
          required: incoming?.required ?? false,
          referenceTargetSchemaId: incoming?.referenceTargetSchemaId ?? null
        }
        return {
          ...change,
          affectedEntries: toAffectedEntries(
            entries.filter(
              (entry) =>
                !isValueValidForField(newField, entry.data[change.fieldId])
            )
          )
        }
      }

      case 'made_required': {
        const incoming = incomingById.get(change.fieldId)
        const newField = {
          type: incoming?.type ?? 'text',
          required: true,
          referenceTargetSchemaId: incoming?.referenceTargetSchemaId ?? null
        }
        return {
          ...change,
          affectedEntries: toAffectedEntries(
            entries.filter(
              (entry) =>
                !isValueValidForField(newField, entry.data[change.fieldId])
            )
          )
        }
      }

      case 'reference_target_changed':
        return {
          ...change,
          affectedEntries: toAffectedEntries(
            entries.filter((entry) => {
              const value = entry.data[change.fieldId]
              if (!hasValue(value) || typeof value !== 'string') return false
              if (!change.after) return false
              return getEntryById(change.after, value) === undefined
            })
          )
        }

      case 'added_required':
        return {
          ...change,
          affectedEntries: toAffectedEntries(entries)
        }
    }
  })
}

export function previewSchemaDeletion(schemaId: string): SchemaDeletionImpact {
  const entries = listEntries(schemaId)

  const blockingReferences = listSchemas().flatMap((schema) =>
    schema.fields
      .filter((field) => field.referenceTargetSchemaId === schemaId)
      .map((field) => ({
        schemaId: schema.id,
        schemaName: schema.name,
        fieldId: field.id,
        fieldName: field.name
      }))
  )

  return {
    schemaId,
    affectedEntryIds: entries.map((entry) => entry.id),
    blockingReferences
  }
}
