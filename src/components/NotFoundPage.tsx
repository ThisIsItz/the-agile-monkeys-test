import { Button, Center, Stack, Title, Text } from '@mantine/core'
import { FileQuestion, House } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export const NotFoundPage = () => {
  const navigate = useNavigate()

  return (
    <Center mih="70vh">
      <Stack align="center" gap={32}>
        <FileQuestion size={56} strokeWidth={1.5} />

        <Stack align="center" gap={8}>
          <Title order={1} size={64}>
            404
          </Title>

          <Text size="lg" fw={600}>
            Page not found
          </Text>

          <Text c="dimmed" ta="center" maw={360}>
            The page or resource you're looking for doesn't exist.
          </Text>
        </Stack>

        <Button
          color="violet"
          mt={24}
          leftSection={<House size={18} />}
          onClick={() => navigate('/schemas')}
        >
          Back to schemas
        </Button>
      </Stack>
    </Center>
  )
}
