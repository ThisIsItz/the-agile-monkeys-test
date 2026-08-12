import { Navigate, Route, Routes } from 'react-router-dom'
import { SchemaList } from '@/features/schemas/SchemasPage.js'
import { SchemaEditorPage } from './features/schemas/SchemaEditorPage'

function App() {
  return (
    <main className="app">
      <Routes>
        <Route path="/" element={<Navigate to="/schemas" replace />} />
        <Route path="/schemas" element={<SchemaList />} />
        <Route path="/schemas/new" element={<SchemaEditorPage />} />
        <Route path="/schemas/:id/edit" element={<SchemaEditorPage />} />
      </Routes>
    </main>
  )
}

export default App
