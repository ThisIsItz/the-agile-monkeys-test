import { Alert, Button, Group, Modal, Stack, Text } from '@mantine/core'
import type { Schema, SchemaDeletionImpact } from '@shared/types'
import { TriangleAlert } from 'lucide-react'

export const SchemaDeletePreviewModal = ({
  opened,
  schema,
  impact,
  onClose,
  onConfirm
}: {
  opened: boolean
  schema: Schema | null
  impact: SchemaDeletionImpact | null
  onClose: () => void
  onConfirm: () => void
}) => {
  if (!schema || !impact) return null

  const isBlocked = impact.blockingReferences.length > 0

  return (
    <Modal opened={opened} onClose={onClose} title="Delete schema" centered>
      <Stack gap="lg">
        <Text>
          You are about to delete the schema <strong>{schema.name}</strong>.
        </Text>

        <Stack gap="xs">
          <Text
            size="sm"
            c={impact.affectedEntryIds.length === 0 ? 'dimmed' : 'orange'}
          >
            {impact.affectedEntryIds.length === 0
              ? 'This schema has no entries.'
              : `${impact.affectedEntryIds.length} ${
                  impact.affectedEntryIds.length === 1 ? 'entry' : 'entries'
                } will also be deleted.`}
          </Text>
          {!isBlocked && (
            <Text size="sm" c="dimmed">
              This action cannot be undone.
            </Text>
          )}
        </Stack>
        {isBlocked && (
          <Alert
            color="red"
            icon={<TriangleAlert size={16} />}
            title="This schema cannot be deleted"
          >
            <Stack gap="xs">
              <Text size="sm">Other schema fields still reference it:</Text>
              {impact.blockingReferences.map((reference) => (
                <Text
                  key={`${reference.schemaId}-${reference.fieldId}`}
                  size="sm"
                >
                  <strong>{reference.schemaName}</strong>
                </Text>
              ))}
            </Stack>
          </Alert>
        )}

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>

          <Button color="red" onClick={onConfirm} disabled={isBlocked}>
            Delete schema
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
