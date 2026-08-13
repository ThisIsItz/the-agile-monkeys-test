import {
  Button,
  Collapse,
  Divider,
  Group,
  Modal,
  Stack,
  Text,
  UnstyledButton
} from '@mantine/core'
import type { FieldChangeImpact, SchemaPreviewResponse } from '@shared/types'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'

const getChangeLabel = (change: FieldChangeImpact): string => {
  switch (change.changeType) {
    case 'renamed':
      return `Field renamed from "${change.before}" to "${change.after}".`
    case 'deleted':
      return 'This field will be removed from the schema.'
    case 'retyped':
      return `Field type will change from ${change.before} to ${change.after}.`
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
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggleExpanded = (key: string) => {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

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
          {preview?.changes.map((change, index) => {
            const key = `${change.fieldName}-${change.changeType}-${index}`
            const isExpanded = expanded.has(key)

            return (
              <Stack key={key} gap={2}>
                <Text>
                  <Text span fw={600}>
                    Field:
                  </Text>{' '}
                  {change.fieldName}
                </Text>
                <Text size="sm">{getChangeLabel(change)}</Text>
                <Text
                  size="sm"
                  c={change.affectedEntries.length > 0 ? 'orange' : 'dimmed'}
                >
                  {change.affectedEntries.length === 0
                    ? 'No entries affected'
                    : `${change.affectedEntries.length} ${
                        change.affectedEntries.length === 1
                          ? 'entry'
                          : 'entries'
                      } affected`}
                </Text>
                {change.affectedEntries.length > 0 && (
                  <>
                    <UnstyledButton
                      onClick={() => toggleExpanded(key)}
                      style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      {isExpanded ? (
                        <ChevronDown size={14} />
                      ) : (
                        <ChevronRight size={14} />
                      )}
                      <Text size="xs" c="dimmed">
                        {isExpanded ? 'Hide' : 'Show'} affected entries
                      </Text>
                    </UnstyledButton>
                    <Collapse expanded={isExpanded}>
                      <Stack gap={2} pl="lg">
                        {change.affectedEntries.map((entry) => (
                          <Text key={entry.id} size="xs" c="dimmed">
                            {entry.label}
                          </Text>
                        ))}
                      </Stack>
                    </Collapse>
                  </>
                )}
                {index < preview.changes.length - 1 && <Divider my="sm" />}
              </Stack>
            )
          })}
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
