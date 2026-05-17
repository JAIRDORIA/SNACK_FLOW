import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout'
import Dashboard from '@/pages/dashboard/Dashboard'
// páginas reales
import Ventas from '@/pages/Ventas/Ventas'
import Cortes from '@/pages/cortes/Cortes'

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
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="ventas"      element={<Ventas />} />
          <Route path="clientes"    element={<Placeholder name="Clientes" />} />
          <Route path="inventario/productos"   element={<Placeholder name="Productos" />} />
          <Route path="inventario/ver"      element={<Placeholder name="Inventario" />} />
          <Route path="inventario/combos"      element={<Placeholder name="Inventario" />} />
          <Route path="compras"      element={<Placeholder name="compras" />} />
          <Route path="balance"      element={<Placeholder name="balance" />} />  
          <Route path="cortes"      element={<Cortes />} />
          <Route path="proveedores"      element={<Placeholder name="proveedores" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}




// Fuera del Layout (sin sidebar ni header):


// Y la ruta raíz queda dentro del Layout como siempre