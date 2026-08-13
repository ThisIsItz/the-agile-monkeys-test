import type { Field } from '@shared/types.js'

export type FieldChange =
  | RenamedFieldChange
  | DeletedFieldChange
  | RetypedFieldChange
  | MadeRequiredFieldChange
  | ReferenceTargetChangedFieldChange

interface RenamedFieldChange {
  fieldId: string
  fieldName: string
  changeType: 'renamed'
  before: string
  after: string
}

interface DeletedFieldChange {
  fieldId: string
  fieldName: string
  changeType: 'deleted'
}

interface RetypedFieldChange {
  fieldId: string
  fieldName: string
  changeType: 'retyped'
  before: Field['type']
  after: Field['type']
}

interface MadeRequiredFieldChange {
  fieldId: string
  fieldName: string
  changeType: 'made_required'
}

interface ReferenceTargetChangedFieldChange {
  fieldId: string
  fieldName: string
  changeType: 'reference_target_changed'
  before: string | null
  after: string | null
}

export type FieldChangeImpact = FieldChange & { affectedEntryIds: string[] }
