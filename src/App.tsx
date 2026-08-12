import { SchemaList } from '@/features/schemas/SchemaList.js'
import { useState } from 'react'
import { SchemaForm } from './features/schemas/SchemaForm'
import type { Schema } from '@shared/types'

type View = { type: 'list' } | { type: 'form'; schema?: Schema }

function App() {
  const [view, setView] = useState<View>({ type: 'list' })

  const handleAddSchema = () => {
    setView({ type: 'form' })
  }

  const handleEditSchema = (schema: Schema) => {
    setView({ type: 'form', schema })
  }

  const handleBack = () => {
    setView({ type: 'list' })
  }

  return (
    <div>
      {view.type === 'form' ? (
        <SchemaForm schema={view.schema} handleBack={handleBack} />
      ) : (
        <SchemaList handleAdd={handleAddSchema} handleEdit={handleEditSchema} />
      )}
    </div>
  )
}

export default App
