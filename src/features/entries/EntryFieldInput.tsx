import { Checkbox, NumberInput, Select, TextInput } from '@mantine/core'
import type { UseFormReturnType } from '@mantine/form'
import type { EntryInput, Field } from '@shared/types'
import type { ReactElement } from 'react'

type EntryFieldInputProps = {
  field: Field
  form: UseFormReturnType<EntryInput>
  referenceOptions: { value: string; label: string }[]
}

export const EntryFieldInput = ({
  field,
  form,
  referenceOptions
}: EntryFieldInputProps): ReactElement => {
  const path = `data.${field.id}`

  switch (field.type) {
    case 'text':
      return (
        <TextInput
          label={field.name}
          required={field.required}
          {...form.getInputProps(path)}
        />
      )

    case 'number':
      return (
        <NumberInput
          label={field.name}
          required={field.required}
          {...form.getInputProps(path)}
        />
      )

    case 'boolean':
      return (
        <Checkbox
          label={field.name}
          {...form.getInputProps(path, { type: 'checkbox' })}
        />
      )

    case 'date':
      return (
        <TextInput
          type="date"
          label={field.name}
          required={field.required}
          {...form.getInputProps(path)}
        />
      )

    case 'reference':
      return (
        <Select
          label={field.name}
          placeholder="Select entry"
          required={field.required}
          data={referenceOptions}
          {...form.getInputProps(path)}
        />
      )
  }
}
