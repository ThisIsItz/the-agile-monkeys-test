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
  mt,
  variant = 'light'
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
        variant={variant}
        leftSection={<Pencil size={16} />}
        onClick={onEdit}
      >
        Edit
      </Button>
      <Button
        size="xs"
        variant={variant}
        color="red"
        leftSection={<Trash2 size={16} />}
        onClick={onDelete}
      >
        Delete
      </Button>
    </Group>
  </>
)
