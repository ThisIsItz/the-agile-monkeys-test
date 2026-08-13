import { Button, Group, Title, type MantineSpacing } from '@mantine/core'
import { Plus } from 'lucide-react'

export const ListPageHeader = ({
  title,
  actionLabel,
  onAction,
  mt
}: {
  title: string
  actionLabel: string
  onAction: () => void
  mt?: MantineSpacing
}) => (
  <Group justify="space-between" align="center" mb="xl" mt={mt}>
    <Title>{title}</Title>
    <Button
      variant="filled"
      color="violet"
      size="md"
      leftSection={<Plus size={16} />}
      onClick={onAction}
    >
      {actionLabel}
    </Button>
  </Group>
)
