import { createSchema, getSchemas, updateSchema } from '@/api/schemas'
import { FIELD_TYPES, type Schema, type SchemaInput } from '@shared/types'
import { useEffect, useState } from 'react'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import {
  ActionIcon,
  Button,
  Card,
  Checkbox,
  Group,
  Select,
  Stack,
  TextInput,
  Title,
  Text
} from '@mantine/core'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'

export const SchemaForm = ({
  schema,
  handleBack
}: {
  schema?: Schema
  handleBack: () => void
}) => {
  const form = useForm<SchemaInput>({
    initialValues: {
      name: schema?.name ?? '',
      fields: schema?.fields.map(
        ({ id, name, type, required, referenceTargetSchemaId }) => ({
          id,
          name,
          type,
          required,
          referenceTargetSchemaId
        })
      ) ?? [
        {
          name: '',
          type: 'text',
          required: false
        }
      ]
    }
  })

  const [availableSchemas, setAvailableSchemas] = useState<Schema[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadAvailableSchemas = async () => {
      try {
        const data = await getSchemas()
        setAvailableSchemas(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      }
    }

    loadAvailableSchemas()
  }, [])

  const handleFormSubmit = async (values: SchemaInput) => {
    setError(null)

    try {
      if (schema) {
        await updateSchema(schema.id, values)
        notifications.show({
          message: `Schema "${values.name}" updated`,
          color: 'green'
        })
      } else {
        await createSchema(values)
        notifications.show({
          message: `Schema "${values.name}" created`,
          color: 'green'
        })
      }
      handleBack()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  return (
    <form onSubmit={form.onSubmit(handleFormSubmit)}>
      <Button
        variant="subtle"
        onClick={handleBack}
        leftSection={<ArrowLeft size={16} />}
        color="gray"
      >
        Back
      </Button>
      <Title>{schema ? 'Edit Schema' : 'Create Schema'}</Title>

      <TextInput
        {...form.getInputProps('name')}
        label="Name"
        placeholder="Enter schema name"
        mb="md"
        radius="sm"
        required
      />
      <div>
        <Text size="lg" fw="semi-bold" mb="xs">
          Fields
        </Text>
        <Stack gap="md">
          {form.values.fields.map((field, index) => (
            <Card key={form.key(`fields.${index}`)} withBorder padding="md">
              <Group align="flex-end" wrap="wrap">
                <TextInput
                  label="Name"
                  placeholder="Enter field name"
                  {...form.getInputProps(`fields.${index}.name`)}
                  style={{ flex: 1 }}
                />
                <Select
                  label="Type"
                  data={[...FIELD_TYPES]}
                  {...form.getInputProps(`fields.${index}.type`)}
                  w={180}
                />
                {field.type === 'reference' && (
                  <Select
                    label="Reference"
                    placeholder="Select schema"
                    data={availableSchemas.map((availableSchema) => ({
                      value: availableSchema.id,
                      label: availableSchema.name
                    }))}
                    {...form.getInputProps(
                      `fields.${index}.referenceTargetSchemaId`
                    )}
                    w={180}
                    required
                  />
                )}
                <Checkbox
                  label="Is required"
                  mb={10}
                  {...form.getInputProps(`fields.${index}.required`, {
                    type: 'checkbox'
                  })}
                />
                <ActionIcon
                  variant="light"
                  color="red"
                  size="lg"
                  mb={4}
                  aria-label="Remove field"
                  onClick={() => form.removeListItem('fields', index)}
                >
                  <Trash2 size={18} />
                </ActionIcon>
              </Group>
            </Card>
          ))}

          <Group justify="space-between">
            <Button
              variant="light"
              leftSection={<Plus size={16} />}
              onClick={() =>
                form.insertListItem('fields', {
                  name: '',
                  type: 'text',
                  required: false
                })
              }
            >
              Add field
            </Button>
          </Group>
        </Stack>
      </div>
      {error && <p className="schema-form__error">{error}</p>}
      <Button type="submit" loading={form.submitting}>
        {schema ? 'Save changes' : 'Create schema'}
      </Button>
    </form>
  )
}
