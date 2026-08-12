import { SchemaList } from '@/features/schemas/SchemaList.js'
import { useState } from 'react'
import { SchemaForm } from './features/schemas/SchemaForm'

function App() {
  const [creating, setCreating] = useState(false)

  const handleAddSchema = () => {
    setCreating(true)
  }

  return (
    <div>
      {creating ? <SchemaForm /> : <SchemaList handleAdd={handleAddSchema} />}
    </div>
  )
}

export default App
