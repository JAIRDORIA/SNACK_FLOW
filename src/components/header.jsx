import { useEffect } from 'react'
import { User, Bell, Calendar } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import useDashboardStore from '@/store/useDashboardStore'

// mapa de rutas a nombres legibles
const nombresPagina = {
  '/':                      'Dashboard',
  '/ventas':                'Ventas',
  '/clientes':              'Clientes',
  '/compras':               'Compras',
  '/proveedores':           'Proveedores',
  '/balance':               'Balance',
  '/abonos':                'Abonos',
  '/cortes':                'Cortes',
  '/inventario/ver':        'Inventario',
  '/inventario/productos':  'Productos',
  '/inventario/combos':     'Combos',
}

export default function Header() {
  const { balance, fetchDashboard } = useDashboardStore()
  const location = useLocation()

  useEffect(() => {
    fetchDashboard()
  }, [])

  const nombreUsuario = "Admin"
  const iniciales = "AD"

  const fechaCorte = balance?.fecha_inicio
    ? new Date(balance.fecha_inicio).toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      })
    : "..."

  // obtener el nombre de la pagina actual
  const paginaActual = nombresPagina[location.pathname] ?? 'Dashboard'

  return (
    <header style={{padding: "20px 17px"}} className="bg-white border-b-2 border-gray-300 shadow-sm  flex items-center justify-between shrink-0">

      {/* Izquierda: nombre pagina + corte */}
      <div  className="flex items-center gap-4">

        {/* nombre de la pagina actual */}
        <span className="text-2xl text-indigo-600 font-bold">
          {paginaActual}
        </span>

        {/* divisor */}
        <div style={{
          width: "1px",
          height: "35px",
          background: "#8e8f94"
        }} />

        {/* info del corte */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "14px"
        }}>
          <Calendar size={16} color="#9ca3af" />
          <span style={{ color: "#6b7280" }}>Corte</span>
          <span style={{ fontWeight: 600, color: "#111827" }}>
            #{balance?.corte_numero ?? "..."}
          </span>
          <span style={{ color: "#6b7280" }}>empezó el</span>
          <span style={{ fontWeight: 600, color: "#111827" }}>
            {fechaCorte}
          </span>
        </div>
      </div>

      {/* Derecha: notificaciones + usuario */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>

        {/* campana */}
        <button style={{
          position: "relative",
          padding: "8px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background 0.15s"
        }}
          onMouseEnter={e => e.currentTarget.style.background = "#f3f4f6"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          <Bell size={20} color="#6b7280" />
          <span style={{
            position: "absolute",
            top: "6px", right: "6px",
            width: "8px", height: "8px",
            background: "#ef4444",
            borderRadius: "50%"
          }} />
        </button>

        {/* usuario */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          background: "#eef2ff",
          border: "1px solid #e0e7ff",
          padding: "6px 12px",
          borderRadius: "8px"
        }}>
          <div style={{
            width: "32px", height: "32px",
            background: "#4f46e5",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          }}>
            <span style={{
              color: "white",
              fontSize: "12px",
              fontWeight: 700
            }}>
              {iniciales}
            </span>
          </div>
          <div>
            <p style={{
              fontWeight: 600,
              color: "#111827",
              fontSize: "14px",
              margin: 0,
              lineHeight: 1
            }}>
              {nombreUsuario}
            </p>
            <p style={{
              fontSize: "12px",
              color: "#818cf8",
              margin: "3px 0 0 0"
            }}>
              Administrador
            </p>
          </div>
        </div>

      </div>
    </header>
  )
}