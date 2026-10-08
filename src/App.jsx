import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout'
import Dashboard from '@/pages/dashboard/Dashboard'
import Login from '@/pages/login/Login'
import Ventas from '@/pages/Ventas/Ventas'
import Cortes from '@/pages/cortes/Cortes'
import Inventario from '@/pages/Inventario/Inventario'
import CustomersManager from './components/CustomersManager'
import ProductsManager from './components/ProductsManager'
import Balance from './pages/balance/Balance'
import Compras from '@/pages/compras/Compras'
import Proveedores from '@/pages/proveedores/proveedores'
import Abonos from './pages/abonos/Abonos'
import CombosManager from './components/combosmanager'
import PrimerCorte from './pages/pcorte/PrimerCorte'
import RequireCorte from './components/RequireCortes'
import useInactivityTimer from './hooks/useInactivityTimer'
import Auditoria from '@/pages/auditoria/Auditoria'
import Prestamos from './pages/prestamos/prestamos'
import PanelCocina from './pages/pedidos/panelcocina'
import PanelProduccion from '@/pages/produccion/panelproduccion'

function RutaProtegida({ children, rolesPermitidos }) {
  const token = localStorage.getItem('access_token')
  // El rol se lee SIEMPRE (antes del hook, para respetar las reglas de hooks).
  // Sin usuario o con rol desconocido el temporizador queda activo; se desactiva
  // para 'cocina' y 'produccion', que mantienen su pantalla abierta todo el turno.
  const rol = JSON.parse(localStorage.getItem('usuario') || 'null')?.rol
  useInactivityTimer(undefined, rol !== 'cocina' && rol !== 'produccion')

  if (!token) return <Navigate to="/login" replace />

  if (rolesPermitidos) {
  if (!rol) {
    localStorage.removeItem('access_token')
    localStorage.removeItem('usuario')
    return <Navigate to="/login" replace />
  }

  if (!rolesPermitidos.includes(rol)) {
    if (rol === 'cocina') return <Navigate to="/cocina" replace />
    if (rol === 'produccion') return <Navigate to="/produccion" replace />
    return <Navigate to="/" replace />
  }
}

  return children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/primer-corte"
          element={
            <RutaProtegida rolesPermitidos={['admin']}>
              <PrimerCorte />

            </RutaProtegida>
          }
        />

        {/* Panel de cocina: sin Layout, sin sidebar, sin modulos de SnackFlow */}
        <Route
          path="/cocina"
          element={
            <RutaProtegida rolesPermitidos={['cocina']}>
              <PanelCocina />
            </RutaProtegida>
          }
        />

        {/* Panel de producción: sin Layout, sin sidebar, sin modulos de SnackFlow */}
        <Route
          path="/produccion"
          element={
            <RutaProtegida rolesPermitidos={['produccion']}>
              <PanelProduccion />
            </RutaProtegida>
          }
        />

        <Route
          path="/"
          element={
            <RutaProtegida rolesPermitidos={['admin']}>
              <RequireCorte>
                <Layout />
              </RequireCorte>
            </RutaProtegida>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="ventas" element={<Ventas />} />
          <Route path="clientes" element={<CustomersManager />} />
          <Route path="inventario/productos" element={<ProductsManager />} />
          <Route path="inventario/ver" element={<Inventario />} />
          <Route path="inventario/combos" element={<CombosManager />} />
          <Route path="compras" element={<Compras />} />
          <Route path="balance" element={<Balance />} />
          <Route path="cortes" element={<Cortes />} />
          <Route path="abonos" element={<Abonos />} />
          <Route path="prestamos" element={<Prestamos />} />
          <Route path="proveedores" element={<Proveedores />} />
          <Route path="auditoria" element={<Auditoria />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App