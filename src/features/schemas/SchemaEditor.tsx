import { createSchema, getSchemas, updateSchema } from '@/api/schemas'
import {
  ActionIcon,
  Alert,
  Button,
  Card,
  Checkbox,
  Group,
  Select,
  Stack,
  Text,
  TextInput,
  Title
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { FIELD_TYPES, type Schema, type SchemaInput } from '@shared/types'
import { ArrowLeft, Plus, Trash2, TriangleAlert } from 'lucide-react'
import { useEffect, useState } from 'react'

export const SchemaEditor = ({
  schema,
  handleBack
}: {
  schema?: Schema
  handleBack: () => void
}) => {
  const [availableSchemas, setAvailableSchemas] = useState<Schema[]>([])
  const [error, setError] = useState<string | null>(null)
  const schemaForm = useForm<SchemaInput>({
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
    },
    validate: {
      fields: (value) =>
        value.length === 0 ? 'At least one field is required' : null
    }
  })

  const referenceTargetOptions = availableSchemas.filter(
    (availableSchema) => availableSchema.id !== schema?.id
  )
  const hasReferenceTargets = referenceTargetOptions.length > 0
  const fieldTypeOptions = FIELD_TYPES.map((type) => ({
    value: type,
    label:
      type === 'reference' && !hasReferenceTargets
        ? 'reference (no schemas available)'
        : type,
    disabled: type === 'reference' && !hasReferenceTargets
  }))

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

  return (
    <div>
      <Button
        variant="subtle"
        onClick={handleBack}
        leftSection={<ArrowLeft size={16} />}
        color="gray"
      >
        Back
      </Button>
      <Title>{schema ? 'Edit Schema' : 'Create Schema'}</Title>
      {error && (
        <Alert color="red" mt="md" icon={<TriangleAlert size={16} />}>
          {error}
        </Alert>
      )}
      <form onSubmit={schemaForm.onSubmit(handleFormSubmit)}>
        <TextInput
          {...schemaForm.getInputProps('name')}
          label="Schema Name"
          placeholder="Enter schema name"
          mt="md"
          mb="xs"
          radius="sm"
          maw={400}
          required
        />
        <div>
          <Text size="sm" fw={600}>
            Fields
          </Text>
          {schemaForm.errors.fields && (
            <Text size="xs" c="red">
              {schemaForm.errors.fields}
            </Text>
          )}
          <Stack gap="md">
            {schemaForm.values.fields.map((field, index) => (
              <Card
                key={schemaForm.key(`fields.${index}`)}
                withBorder
                padding="md"
                w="fit-content"
              >
                <Group align="flex-end" wrap="wrap">
                  <TextInput
                    label="Name"
                    placeholder="Enter field name"
                    {...schemaForm.getInputProps(`fields.${index}.name`)}
                    required
                    w={400}
                  />
                  <Select
                    label="Type"
                    data={fieldTypeOptions}
                    {...schemaForm.getInputProps(`fields.${index}.type`)}
                    w={180}
                  />
                  {field.type === 'reference' && (
                    <Select
                      label="Reference"
                      placeholder="Select schema"
                      data={referenceTargetOptions.map((availableSchema) => ({
                        value: availableSchema.id,
                        label: availableSchema.name
                      }))}
                      disabled={!hasReferenceTargets}
                      {...schemaForm.getInputProps(
                        `fields.${index}.referenceTargetSchemaId`
                      )}
                      w={180}
                      required
                    />
                  )}
                  <Checkbox
                    label="Is required"
                    mb={10}
                    {...schemaForm.getInputProps(`fields.${index}.required`, {
                      type: 'checkbox'
                    })}
                  />
                  <ActionIcon
                    variant="light"
                    color="red"
                    size="lg"
                    mb={4}
                    aria-label="Remove field"
                    disabled={schemaForm.values.fields.length === 1}
                    onClick={() => schemaForm.removeListItem('fields', index)}
                  >
                    <Trash2 size={18} />
                  </ActionIcon>
                </Group>
              </Card>
            ))}

            <Group justify="text-start">
              <Button
                size="xs"
                variant="subtle"
                leftSection={<Plus size={14} />}
                onClick={() =>
                  schemaForm.insertListItem('fields', {
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
        <Group justify="flex-end" mt="xl">
          <Button type="submit" size="md" loading={schemaForm.submitting}>
            {schema ? 'Save changes' : 'Create schema'}
          </Button>
        </Group>
      </form>
    </div>
  )
}
