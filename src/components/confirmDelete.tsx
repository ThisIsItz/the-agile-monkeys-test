import { modals } from '@mantine/modals'
import type { ReactNode } from 'react'

export function confirmDelete({
  title,
  message,
  onConfirm
}: {
  title: string
  message: ReactNode
  onConfirm: () => void
}) {
  modals.openConfirmModal({
    title,
    children: <p>{message}</p>,
    labels: { confirm: 'Delete', cancel: 'Cancel' },
    confirmProps: { color: 'red' },
    onConfirm
  })
}
