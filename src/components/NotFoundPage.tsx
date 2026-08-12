import { Center, Stack, Title, Text } from '@mantine/core'

export const NotFoundPage = () => {
  return (
    <Center>
      <Stack align="center">
        <Title order={1}>404</Title>
        <Text size="lg">Page not found</Text>
      </Stack>
    </Center>
  )
}
