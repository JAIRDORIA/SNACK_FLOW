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


function RutaProtegida({ children }) {
  const token = localStorage.getItem('access_token')
  return token ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/primer-corte"
          element={
            <RutaProtegida>
              <PrimerCorte />
            </RutaProtegida>
          }
        />

        {/* Ruta principal: token + corte existente */}
        <Route
          path="/"
          element={
            <RutaProtegida>
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
          <Route path="proveedores" element={<Proveedores />} />

        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App