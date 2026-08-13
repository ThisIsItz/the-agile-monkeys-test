import { Checkbox, NumberInput, Select, TextInput } from '@mantine/core'
import type { UseFormReturnType } from '@mantine/form'
import type { EntryInput, Field } from '@shared/types'
import type { ReactElement } from 'react'

type EntryFieldInputProps = {
  field: Field
  form: UseFormReturnType<EntryInput>
  referenceOptions: { value: string; label: string }[]
  needsReview?: boolean
}

export const EntryFieldInput = ({
  field,
  form,
  referenceOptions,
  needsReview
}: EntryFieldInputProps): ReactElement => {
  const path = `data.${field.id}`
  const description = needsReview
    ? 'Needs review after schema change'
    : undefined
  const classNames = needsReview
    ? {
        input: 'entry-field-input__control--needs-review',
        description: 'entry-field-input__review-note'
      }
    : undefined

  switch (field.type) {
    case 'text':
      return (
        <TextInput
          label={field.name}
          description={description}
          required={field.required}
          classNames={classNames}
          {...form.getInputProps(path)}
        />
      )

    case 'number':
      return (
        <NumberInput
          label={field.name}
          description={description}
          required={field.required}
          classNames={classNames}
          {...form.getInputProps(path)}
        />
      )

    case 'boolean':
      return (
        <Checkbox
          label={field.name}
          description={description}
          classNames={classNames}
          styles={{ label: { fontWeight: 500 } }}
          {...form.getInputProps(path, { type: 'checkbox' })}
        />
      )

    case 'date':
      return (
        <TextInput
          type="date"
          label={field.name}
          description={description}
          required={field.required}
          classNames={classNames}
          {...form.getInputProps(path)}
        />
      )

    case 'reference':
      return (
        <Select
          label={field.name}
          description={description}
          placeholder="Select entry"
          required={field.required}
          data={referenceOptions}
          classNames={classNames}
          {...form.getInputProps(path)}
        />
      )
  }
}
