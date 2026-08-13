import { Card, Title } from '@mantine/core'
import type { ReactNode } from 'react'

export const FormCard = ({
  title,
  children
}: {
  title: string
  children: ReactNode
}) => (
  <Card
    withBorder
    shadow="xs"
    radius="md"
    padding="lg"
    maw={640}
    mx="auto"
    mt="md"
  >
    <Title order={3} mb="md">
      {title}
    </Title>
    {children}
  </Card>
)
