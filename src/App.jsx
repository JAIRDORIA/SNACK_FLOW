import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout'
import Login from '@/pages/Login/Login'
import Dashboard from '@/pages/dashboard/Dashboard'
import Ventas from '@/pages/Ventas/Ventas'
import Cortes from '@/pages/cortes/Cortes'
import Inventario from '@/pages/inventario/Inventario'
import CustomersManager from './components/CustomersManager'
import ProductsManager from './components/ProductsManager'
import Balance from './pages/balance/Balance'
import Compras from '@/pages/compras/Compras'
import Proveedores from '@/pages/proveedores/Proveedores'

function Placeholder({ name }) {
  return <div style={{ padding: '2rem' }}><h2>{name} — Próximamente</h2></div>
}

function RutaProtegida({ children }) {
  const token = localStorage.getItem('access_token')
  return token ? children : <Navigate to="/Login" replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<RutaProtegida><Layout /></RutaProtegida>}>
          <Route index element={<Dashboard />} />
          <Route path="ventas"               element={<Ventas />} />
          <Route path="clientes"             element={<Placeholder name="Clientes" />} />
          <Route path="inventario/productos" element={<Placeholder name="Productos" />} />
          <Route path="inventario/ver"       element={<Inventario />} />
          <Route path="inventario/combos"    element={<Placeholder name="Combos" />} />
          <Route path="compras"              element={<Compras />} />
          <Route path="balance"              element={<Balance />} />
          <Route path="cortes"               element={<Cortes />} />
          <Route path="abonos"               element={<Placeholder name="Abonos" />} />
          <Route path="proveedores"          element={<Proveedores />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App