import { Button, Group, Title } from '@mantine/core'
import { Plus } from 'lucide-react'

export const ListPageHeader = ({
  title,
  actionLabel,
  onAction
}: {
  title: string
  actionLabel: string
  onAction: () => void
}) => (
  <Group justify="space-between" align="center" mb="xl">
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
