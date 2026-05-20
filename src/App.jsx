import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout'
import Login from '@/pages/Login/Login'
import Dashboard from '@/pages/dashboard/Dashboard'
// páginas reales
import Ventas from '@/pages/Ventas/Ventas'
import Cortes from '@/pages/cortes/Cortes'

// ── Protege rutas — si no hay token redirige al login ─────────────────────────
function RutaProtegida({ children }) {
  const token = localStorage.getItem('access_token')
  return token ? children : <Navigate to="/login" replace />
}

// páginas que aun no tienen componente real
function Placeholder({ name }) {
  return (
    <div style={{ color: '#8c7d6e', fontSize: '25px' }}>
      Página <span style={{ color: '#c9a96e' }}>{name}</span> — en construcción
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── Ruta pública — login (sin sidebar ni header) ── */}
        <Route path="/login" element={<Login />} />

        {/* ── Rutas protegidas — dentro del Layout ── */}
        <Route path="/" element={
          <RutaProtegida>
            <Layout />
          </RutaProtegida>
        }>
          <Route index                       element={<Dashboard />} />
          <Route path="ventas"               element={<Ventas />} />
          <Route path="clientes"             element={<Placeholder name="Clientes" />} />
          <Route path="inventario/productos" element={<Placeholder name="Productos" />} />
          <Route path="inventario/ver"       element={<Placeholder name="Inventario" />} />
          <Route path="inventario/combos"    element={<Placeholder name="Combos" />} />
          <Route path="compras"              element={<Placeholder name="Compras" />} />
          <Route path="balance"              element={<Placeholder name="Balance" />} />
          <Route path="cortes"               element={<Cortes />} />
          <Route path="proveedores"          element={<Placeholder name="Proveedores" />} />
        </Route>

        {/* ── Cualquier ruta desconocida → login ── */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  )
}





// Fuera del Layout (sin sidebar ni header):


// Y la ruta raíz queda dentro del Layout como siempre