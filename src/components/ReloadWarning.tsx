import { Alert, Button, Group, Stack, Text } from '@mantine/core'
import { RotateCw, TriangleAlert } from 'lucide-react'

export const ReloadWarning = ({
  title,
  message,
  onReload
}: {
  title: string
  message: string
  onReload: () => void
}) => (
  <Alert color="yellow" icon={<TriangleAlert size={16} />} title={title} mb="md">
    <Stack gap="sm">
      <Text size="sm">{message}</Text>

      <Group align="center">
        <Button
          size="xs"
          variant="outline"
          color="orange"
          onClick={onReload}
          leftSection={<RotateCw size={16} />}
        >
          Reload
        </Button>
      </Group>
    </Stack>
  </Alert>
)
