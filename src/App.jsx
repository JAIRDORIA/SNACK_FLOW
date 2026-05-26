import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/sidebar';     // Ajusta la ruta si es sidebar.jsx
import Dashboard from './pages/dashboard/Dashboard';
import Ventas from './pages/Ventas/Ventas';     // Asumo que dentro de Ventas hay un Ventas.jsx
import Compras from './pages/compras/Compras';   // Compras.jsx (con C mayúscula)
import Proveedores from './pages/proveedores/proveedores'; // archivo en minúscula
import Cortes from './pages/cortes/Cortes';

function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex' }}>
        <Sidebar />
        <main style={{ flex: 1, padding: '20px' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/ventas" element={<Ventas />} />
            <Route path="/compras" element={<Compras />} />
            <Route path="/proveedores" element={<Proveedores />} />
            <Route path="/cortes" element={<Cortes />} />
            {/* Las siguientes rutas no existen, pero las comentas o las omites */}
            {/* <Route path="/clientes" element={<Clientes />} /> */}
            {/* <Route path="/balance" element={<Balance />} /> */}
            {/* <Route path="/abonos" element={<Abonos />} /> */}
            {/* <Route path="/inventario/ver" ... etc */}
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;