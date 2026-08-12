import { SchemaList } from '@/features/schemas/SchemaList.js'
import { useState } from 'react'
import { SchemaForm } from './features/schemas/SchemaForm'

function App() {
  const [creating, setCreating] = useState(false)

  const handleAddSchema = () => {
    setCreating(true)
  }

  const handleBack = () => {
    setCreating(false)
  }

  return (
    <div>
      {creating ? (
        <SchemaForm handleBack={handleBack} />
      ) : (
        <SchemaList handleAdd={handleAddSchema} />
      )}
    </div>
  )
}

export default App
