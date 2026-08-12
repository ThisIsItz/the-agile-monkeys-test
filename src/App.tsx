import { Navigate, Route, Routes } from 'react-router-dom'
import { SchemaList } from '@/features/schemas/SchemasPage.js'
import { SchemaEditorPage } from './features/schemas/SchemaEditorPage'
import { NotFoundPage } from './components/NotFoundPage'
import { EntriesPage } from './features/entries/EntriesPage'
import { EntryEditorPage } from './features/entries/EntryEditorPage'

function App() {
  return (
    <main className="app">
      <Routes>
        <Route path="/" element={<Navigate to="/schemas" replace />} />
        <Route path="/schemas" element={<SchemaList />} />
        <Route path="/schemas/new" element={<SchemaEditorPage />} />
        <Route path="/schemas/:id/edit" element={<SchemaEditorPage />} />
        <Route path="/schemas/:schemaId/entries" element={<EntriesPage />} />
        <Route
          path="/schemas/:schemaId/entries/new"
          element={<EntryEditorPage />}
        />
        <Route
          path="/schemas/:schemaId/entries/:entryId/edit"
          element={<EntryEditorPage />}
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </main>
  )
}

export default App
