import {
  createSchema,
  getSchemas,
  previewSchemaChange,
  updateSchema
} from '@/api/schemas'
import { FormCard } from '@/components/FormCard'
import { needsReviewFromPreview } from '@/features/entries/needsReview'
import { entriesPath } from '@/features/routes/paths'
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
  TextInput
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import {
  FIELD_TYPES,
  type Schema,
  type SchemaInput,
  type SchemaPreviewResponse
} from '@shared/types'
import { Plus, Trash2, TriangleAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SchemaChangePreviewModal } from './SchemaChangePreviewModal'

const getSchemaInitialValues = (schema?: Schema): SchemaInput => ({
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
})

export const SchemaEditor = ({
  schema,
  handleBack
}: {
  schema?: Schema
  handleBack: () => void
}) => {
  const navigate = useNavigate()
  const [availableSchemas, setAvailableSchemas] = useState<Schema[]>([])
  const [preview, setPreview] = useState<SchemaPreviewResponse | null>(null)
  const [pendingValues, setPendingValues] = useState<SchemaInput | null>(null)
  const [error, setError] = useState<string | null>(null)

  const schemaForm = useForm<SchemaInput>({
    initialValues: getSchemaInitialValues(schema),
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

  const needsReview = needsReviewFromPreview(preview)

  const handleFormSubmit = async (values: SchemaInput) => {
    setError(null)

    try {
      if (schema) {
        const previewResult = await previewSchemaChange(schema.id, values)

        setPreview(previewResult)

        if (previewResult.changes.length > 0) {
          setPendingValues(values)
          return
        }

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

  const handleApplyChanges = async () => {
    if (!schema || !pendingValues) return

    try {
      await updateSchema(schema.id, pendingValues)

      notifications.show({
        message: `Schema "${pendingValues.name}" updated`,
        color: 'green'
      })

      setPreview(null)
      setPendingValues(null)

      if (needsReview.length > 0) {
        navigate(entriesPath(schema.id), {
          state: { needsReview }
        })
      } else {
        handleBack()
      }
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
      {error && (
        <Alert color="red" mt="md" icon={<TriangleAlert size={16} />}>
          {error}
        </Alert>
      )}
      <SchemaChangePreviewModal
        opened={Boolean(preview && pendingValues)}
        onClose={() => {
          setPreview(null)
          setPendingValues(null)
        }}
        onConfirm={handleApplyChanges}
        preview={preview}
      />
      <form onSubmit={schemaForm.onSubmit(handleFormSubmit)}>
        <FormCard title={schema ? schema.name : 'New schema'}>
          <Stack gap="lg">
            <TextInput
              {...schemaForm.getInputProps('name')}
              label="Schema Name"
              placeholder="Enter schema name"
              radius="sm"
              required
            />
            <div>
              <Text size="sm" fw={600} mb="xs">
                Fields
              </Text>
              {schemaForm.errors.fields && (
                <Text size="xs" c="red" mb="xs">
                  {schemaForm.errors.fields}
                </Text>
              )}
              <Stack gap="sm">
                {schemaForm.values.fields.map((field, index) => (
                  <Card key={schemaForm.key(`fields.${index}`)} withBorder padding="sm" radius="sm">
                    <Group align="flex-end" gap="sm" wrap="wrap">
                      <TextInput
                        label="Name"
                        placeholder="Enter field name"
                        {...schemaForm.getInputProps(`fields.${index}.name`)}
                        required
                        style={{ flex: 1, minWidth: 160 }}
                      />
                      <Select
                        label="Type"
                        data={fieldTypeOptions}
                        {...schemaForm.getInputProps(`fields.${index}.type`)}
                        w={160}
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
                          w={160}
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

                <Group justify="flex-start">
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
            <Button
              type="submit"
              size="md"
              loading={schemaForm.submitting}
              style={{ alignSelf: 'flex-end' }}
            >
              {schema ? 'Save changes' : 'Create schema'}
            </Button>
          </Stack>
        </FormCard>
      </form>
    </div>
  )
}
