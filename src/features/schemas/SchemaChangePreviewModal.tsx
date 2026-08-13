import { Button, Divider, Group, Modal, Stack, Text } from '@mantine/core'
import type { FieldChangeImpact, SchemaPreviewResponse } from '@shared/types'

const getChangeLabel = (change: FieldChangeImpact): string => {
  switch (change.changeType) {
    case 'renamed':
      return `Field renamed from "${change.before}" to "${change.after}."`
    case 'deleted':
      return 'This field will be removed from the schema.'
    case 'retyped':
      return `Field type will from ${change.before} to ${change.after}.`
    case 'made_required':
      return 'This field will become required.'
    case 'reference_target_changed':
      return 'This field will reference a different schema.'
    case 'added_required':
      return 'Existing entries do not have a value for this field yet.'
  }
}

export const SchemaChangePreviewModal = ({
  opened,
  onClose,
  onConfirm,
  preview
}: {
  opened: boolean
  onClose: () => void
  onConfirm: () => void
  preview: SchemaPreviewResponse | null
}) => {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Review schema changes"
      centered
    >
      <Stack gap="lg">
        <Text size="sm">
          Some changes may affect existing entries. Review the impact before
          applying them.
        </Text>
        <Stack gap="md">
          {preview?.changes.map((change, index) => (
            <Stack
              key={`${change.fieldName}-${change.changeType}-${index}`}
              gap={2}
            >
              <Text>
                <Text span fw={600}>
                  Field:
                </Text>{' '}
                {change.fieldName}
              </Text>
              <Text size="sm">{getChangeLabel(change)}</Text>
              <Text
                size="sm"
                c={change.affectedEntryIds.length > 0 ? 'orange' : 'dimmed'}
              >
                {change.affectedEntryIds.length === 0
                  ? 'No entries affected'
                  : `${change.affectedEntryIds.length} ${
                      change.affectedEntryIds.length === 1 ? 'entry' : 'entries'
                    } affected`}
              </Text>
              {index < preview.changes.length - 1 && <Divider my="sm" />}
            </Stack>
          ))}
        </Stack>
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Back to editing
          </Button>
          <Button onClick={onConfirm}>Apply changes</Button>
        </Group>
      </Stack>
    </Modal>
  )
}
