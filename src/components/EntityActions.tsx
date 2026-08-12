import { Button, Group, type MantineSpacing } from '@mantine/core'
import { Pencil, Trash2 } from 'lucide-react'

export const EntityActions = ({
  onEdit,
  onDelete,
  mt
}: {
  onEdit: () => void
  onDelete: () => void
  mt?: MantineSpacing
}) => (
  <Group justify="flex-end" gap="xs" mt={mt}>
    <Button
      size="xs"
      variant="light"
      leftSection={<Pencil size={16} />}
      onClick={onEdit}
    >
      Edit
    </Button>
    <Button
      size="xs"
      variant="light"
      color="red"
      leftSection={<Trash2 size={16} />}
      onClick={onDelete}
    >
      Delete
    </Button>
  </Group>
)
