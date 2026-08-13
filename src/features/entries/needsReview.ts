import type { Field, SchemaPreviewResponse } from '@shared/types'

export interface NeedsReviewItem {
  entryId: string
  fieldId?: string
  fieldName: string
}

export function getNeedsReview(state: unknown): NeedsReviewItem[] {
  return (
    (state as { needsReview?: NeedsReviewItem[] } | null)?.needsReview ?? []
  )
}

export function needsReviewFromPreview(
  preview: SchemaPreviewResponse | null
): NeedsReviewItem[] {
  return (preview?.changes ?? [])
    .filter(
      (change) =>
        change.changeType !== 'deleted' && change.affectedEntries.length > 0
    )
    .flatMap((change) =>
      change.affectedEntries.map((entry) => ({
        entryId: entry.id,
        fieldId: 'fieldId' in change ? change.fieldId : undefined,
        fieldName: change.fieldName
      }))
    )
}

// A missing fieldId means the change (e.g. added_required) targets a field
// that didn't exist yet at preview time, so it can only be matched by name.
export function isFieldFlagged(
  items: NeedsReviewItem[],
  field: Pick<Field, 'id' | 'name'>
): boolean {
  return items.some(
    (item) =>
      item.fieldId === field.id ||
      (!item.fieldId && item.fieldName === field.name)
  )
}

export function withoutEntry(
  items: NeedsReviewItem[],
  entryId: string | undefined
): NeedsReviewItem[] {
  return items.filter((item) => item.entryId !== entryId)
}
