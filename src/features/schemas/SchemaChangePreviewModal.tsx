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
import type {
  Entry,
  FieldChangeImpact,
  Schema,
  SchemaPreviewResponse
} from '@shared/types'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getEntries } from '@/api/entries'
import { getEntryLabel } from '@/features/entries/entryUtils'

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
  preview,
  schema
}: {
  opened: boolean
  onClose: () => void
  onConfirm: () => void
  preview: SchemaPreviewResponse | null
  schema: Schema | null
}) => {
  const [entries, setEntries] = useState<Entry[]>([])
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!opened || !schema) return

    getEntries(schema.id)
      .then(setEntries)
      .catch(() => setEntries([]))
  }, [opened, schema])

  const labelFor = (entryId: string): string => {
    const entry = entries.find((e) => e.id === entryId)
    if (!entry || !schema) return entryId
    return getEntryLabel(entry, schema)
  }

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
                  c={change.affectedEntryIds.length > 0 ? 'orange' : 'dimmed'}
                >
                  {change.affectedEntryIds.length === 0
                    ? 'No entries affected'
                    : `${change.affectedEntryIds.length} ${
                        change.affectedEntryIds.length === 1
                          ? 'entry'
                          : 'entries'
                      } affected`}
                </Text>
                {change.affectedEntryIds.length > 0 && (
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
                        {change.affectedEntryIds.map((entryId) => (
                          <Text key={entryId} size="xs" c="dimmed">
                            {labelFor(entryId)}
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
