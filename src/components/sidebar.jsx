import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  ShoppingCart,
  ShoppingBag,
  Users,
  Truck,
  Scale,
  DollarSign,
  Package,
  LayoutDashboard,
  ChevronDown,
  ChevronRight,
  List,
  Grid,
  Layers,
  LogOut,
} from 'lucide-react'

const menuPrincipal = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { id: 'ventas', label: 'Ventas', icon: ShoppingCart, path: '/ventas' },
  { id: 'compras', label: 'Compras', icon: ShoppingBag, path: '/compras' },
  { id: 'clientes', label: 'Clientes', icon: Users, path: '/clientes' },
  { id: 'proveedores', label: 'Proveedores', icon: Truck, path: '/proveedores' },
  { id: 'balance', label: 'Balance', icon: Scale, path: '/balance' },
  { id: 'abonos', label: 'Abonos', icon: DollarSign, path: '/abonos' },
]

const inventarioSubMenu = [
  { id: 'inventario', label: 'Ver Inventario', icon: List, path: '/inventario/ver' },
  { id: 'inventario-productos', label: 'Productos', icon: Grid, path: '/inventario/productos' },
  { id: 'inventario-combos', label: 'Combos', icon: Layers, path: '/inventario/combos' },
]

export default function Sidebar({
  sidebarAbierto,
  setSidebarAbierto
}) {
  const location = useLocation()

  const inventarioActivo = location.pathname.startsWith('/inventario')

  const [inventarioAbierto, setInventarioAbierto] = useState(inventarioActivo)

  return (
    <aside
      className={`
    fixed lg:static
    top-0 left-0
    z-50
    w-60
    h-screen
    bg-[#1B1D2E]
    flex flex-col
    text-white
    border-r border-white/5
    transform transition-transform duration-300
    ${sidebarAbierto ? 'translate-x-0' : '-translate-x-full'}
    lg:translate-x-0
  `}
    >

      {/* Logo */}
      <div style={{

        padding: '0px',
        paddingTop: "10px",
        borderBottom: '1px solid #1f2937'
      }}>
        <div style={{ marginTop: "6px", marginLeft: "20px", display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden', borderRadius: '8px', width: '180px', height: '100px' }}>
          {/* Imagen que contiene logo + nombre + slogan */}
          <img
            src="/SNACKFLOW_LOGO_BLANCO.png"
            alt="SnacFlow"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center', // Ajusta a 'top', 'bottom' si es necesario
              display: 'block',
            }}
          />
        </div>
      </div>

      {/* Navegación */}
      <nav style={{
        flex: 1,
        padding: '12px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px'
      }}>

        {/* Dashboard y Ventas */}
        {menuPrincipal.slice(0, 2).map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 16px', borderRadius: '8px',
                textDecoration: 'none',
                background: isActive ? '#4f46e5' : 'transparent',
                color: isActive ? 'white' : '#9ca3af',
                fontSize: '17px',
                fontWeight: isActive ? 600 : 400,
                transition: 'all 0.15s',
              })}
              onMouseEnter={e => {
                const isActive = e.currentTarget.getAttribute('aria-current') === 'page'
                if (!isActive) {
                  e.currentTarget.style.background = '#1f2937'
                  e.currentTarget.style.color = 'white'
                }
              }}
              onMouseLeave={e => {
                const isActive = e.currentTarget.getAttribute('aria-current') === 'page'
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#9ca3af'
                }
              }}
            >
              <Icon size={17} />
              <span>{item.label}</span>
            </NavLink>
          )
        })}

        {/* Inventario con submenú */}
        <div>
          <button
            onClick={() => setInventarioAbierto(prev => !prev)}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              width: '100%', padding: '10px 16px', borderRadius: '8px',
              background: inventarioActivo ? '#4f46e5' : 'transparent',
              color: inventarioActivo ? 'white' : '#9ca3af',
              border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: '17px',
              fontWeight: inventarioActivo ? 600 : 400,
              textAlign: 'left', transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              if (!inventarioActivo) {
                e.currentTarget.style.background = '#1f2937'
                e.currentTarget.style.color = 'white'
              }
            }}
            onMouseLeave={e => {
              if (!inventarioActivo) {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = '#9ca3af'
              }
            }}
          >
            <Package size={17} />
            <span style={{ flex: 1 }}>Inventario</span>
            {inventarioAbierto
              ? <ChevronDown size={16} />
              : <ChevronRight size={16} />
            }
          </button>

          {/* Submenú */}
          {inventarioAbierto && (
            <div style={{
              marginTop: '4px',
              marginLeft: '12px',
              paddingLeft: '12px',
              borderLeft: '1px solid #374151',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px'
            }}>
              {inventarioSubMenu.map((sub) => {
                const SubIcon = sub.icon
                const isSubActive = location.pathname === sub.path
                return (
                  <NavLink
                    key={sub.path}
                    to={sub.path}
                    style={({ isActive }) => ({
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '8px 12px', borderRadius: '8px',
                      textDecoration: 'none',
                      background: isActive ? 'rgba(79,70,229,0.3)' : 'transparent',
                      color: isActive ? '#a5b4fc' : '#6b7280',
                      fontSize: '16px',
                      fontWeight: isActive ? 500 : 400,
                      transition: 'all 0.15s',
                    })}
                    onMouseEnter={e => {
                      if (!isSubActive) {
                        e.currentTarget.style.background = '#1f2937'
                        e.currentTarget.style.color = '#d1d5db'
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isSubActive) {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = '#6b7280'
                      }
                    }}
                  >
                    <SubIcon size={15} />
                    <span>{sub.label}</span>
                  </NavLink>
                )
              })}
            </div>
          )}
        </div>

        {/* Resto del menú */}
        {menuPrincipal.slice(2).map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 16px', borderRadius: '8px',
                textDecoration: 'none',
                background: isActive ? '#4f46e5' : 'transparent',
                color: isActive ? 'white' : '#9ca3af',
                fontSize: '17px',
                fontWeight: isActive ? 600 : 400,
                transition: 'all 0.15s',
              })}
              onMouseEnter={e => {
                const isActive = e.currentTarget.getAttribute('aria-current') === 'page'
                if (!isActive) {
                  e.currentTarget.style.background = '#1f2937'
                  e.currentTarget.style.color = 'white'
                }
              }}
              onMouseLeave={e => {
                const isActive = e.currentTarget.getAttribute('aria-current') === 'page'
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#9ca3af'
                }
              }}
            >
              <Icon size={17} />
              <span>{item.label}</span>
            </NavLink>
          )
        })}

      </nav>

      {/* Footer */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid #1f2937'
      }}>
        <p style={{
          fontSize: '12px',
          color: '#6b7280',
          textAlign: 'center',
          margin: 0
        }}>
          © 2026 SnacFlow v1.0
        </p>
      </div>

    </aside>
  )
}