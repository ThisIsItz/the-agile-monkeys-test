import { Navigate, Route, Routes } from 'react-router-dom'
import { SchemaList } from '@/features/schemas/SchemasPage.js'
import { SchemaEditorPage } from './features/schemas/SchemaEditorPage'
import { NotFoundPage } from './components/NotFoundPage'
import { EntriesPage } from './features/entries/EntriesPage'
import { EntryEditorPage } from './features/entries/EntryEditorPage'
import {
  ENTRIES_ROUTE,
  ENTRY_EDIT_ROUTE,
  NEW_ENTRY_ROUTE,
  NEW_SCHEMA_ROUTE,
  SCHEMAS_ROUTE,
  SCHEMA_EDIT_ROUTE
} from './features/routes/paths'

function App() {
  return (
    <main className="app">
      <Routes>
        <Route path="/" element={<Navigate to={SCHEMAS_ROUTE} replace />} />
        <Route path={SCHEMAS_ROUTE} element={<SchemaList />} />
        <Route path={NEW_SCHEMA_ROUTE} element={<SchemaEditorPage />} />
        <Route path={SCHEMA_EDIT_ROUTE} element={<SchemaEditorPage />} />
        <Route path={ENTRIES_ROUTE} element={<EntriesPage />} />
        <Route path={NEW_ENTRY_ROUTE} element={<EntryEditorPage />} />
        <Route path={ENTRY_EDIT_ROUTE} element={<EntryEditorPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </main>
  )
}

export default App
