import {
  Button,
  Divider,
  Group,
  type ButtonVariant,
  type MantineSpacing
} from '@mantine/core'
import { Pencil, Trash2 } from 'lucide-react'

export const EntityActions = ({
  onEdit,
  onDelete,
  mt
}: {
  onEdit: () => void
  onDelete: () => void
  mt?: MantineSpacing
  variant?: ButtonVariant
}) => (
  <>
    <Divider my="sm" />
    <Group justify="flex-end" gap="xs" mt={mt}>
      <Button
        size="xs"
        variant="subtle"
        leftSection={<Pencil size={16} />}
        onClick={onEdit}
      >
        Edit
      </Button>
      <Button
        size="xs"
        variant="subtle"
        color="red"
        leftSection={<Trash2 size={16} />}
        onClick={onDelete}
      >
        Delete
      </Button>
    </Group>
  </>
)
