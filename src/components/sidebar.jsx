import { useState } from 'react'
import { NavLink, useLocation,Route,Routes } from 'react-router-dom'
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
  FileText,
  HandCoins,
  HardHat,
} from 'lucide-react'

import RutaAdminPrincipal from '@/components/RutaAdminPrincipal'
import Auditoria from '@/pages/auditoria/Auditoria'

<Route path="/auditoria" element={
  <RutaAdminPrincipal>
    <Auditoria />
  </RutaAdminPrincipal>
} />

const menuPrincipal = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { id: 'ventas', label: 'Ventas', icon: ShoppingCart, path: '/ventas' },
  { id: 'compras', label: 'Compras', icon: ShoppingBag, path: '/compras' },
  { id: 'clientes', label: 'Clientes', icon: Users, path: '/clientes' },
  { id: 'proveedores', label: 'Proveedores', icon: Truck, path: '/proveedores' },
  { id: 'empleados', label: 'Empleados', icon: HardHat, path: '/empleados' },
  { id: 'balance', label: 'Balance', icon: Scale, path: '/balance' },
  { id: 'abonos', label: 'Abonos', icon: DollarSign, path: '/abonos' },
  { id: 'prestamos', label: 'Prestamos', icon: HandCoins, path: '/prestamos' },
  { id: 'auditoria', label: 'Auditoría', icon: FileText, path: '/auditoria', soloAdmin: true },
]

const inventarioSubMenu = [
  { id: 'inventario', label: 'Ver Inventario', icon: List, path: '/inventario/ver' },
  { id: 'inventario-productos', label: 'Productos', icon: Grid, path: '/inventario/productos' },
  { id: 'inventario-combos', label: 'Combos', icon: Layers, path: '/inventario/combos' },
]

// ─────────────────────────────────────────────────────────────────────────────
// Barra lateral con dos estados en escritorio (lg):
//   • Colapsada: riel de solo iconos (76px) que se expande a 240px al pasar el
//     mouse por encima o al enfocar con el teclado. Se cubren las dos vías a
//     propósito: `:hover` no existe en pantallas táctiles, y los enlaces llevan
//     `aria-label` para que el modo solo-iconos conserve nombre accesible.
//   • Fijada (botón del header): siempre expandida, sin depender del hover.
// El panel se posiciona de forma absoluta sobre el contenido, así el área de
// trabajo no se reacomoda al pasar el mouse.
// ─────────────────────────────────────────────────────────────────────────────

// Scroll del menú: barra fina y discreta (WebKit + Firefox), sin CSS global.
const scrollMenu = [
  'overflow-y-auto',
  '[scrollbar-width:thin]',
  '[scrollbar-color:#ffffff33_transparent]',
  '[&::-webkit-scrollbar]:w-1.5',
  '[&::-webkit-scrollbar-track]:bg-transparent',
  '[&::-webkit-scrollbar-thumb]:rounded-full',
  '[&::-webkit-scrollbar-thumb]:bg-white/15',
  '[&::-webkit-scrollbar-thumb:hover]:bg-white/35',
].join(' ')

export default function Sidebar({ sidebarAbierto, setSidebarAbierto, sidebarColapsado }) {
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
  const esAdminPrincipal = usuario?.id === 1
  const location = useLocation()

  const inventarioActivo = location.pathname.startsWith('/inventario')

  const [inventarioAbierto, setInventarioAbierto] = useState(inventarioActivo)

  // Ancho que reserva en el layout (el contenido no se mueve al hacer hover).
  const anchoAside = sidebarColapsado ? 'lg:w-[76px]' : 'lg:w-60'

  // Ancho real del panel: el riel crece al hover/focus solo cuando está colapsado.
  const anchoPanel = sidebarColapsado
    ? 'lg:w-[76px] lg:group-hover:w-60 lg:group-focus-within:w-60 lg:transition-[width] lg:duration-200 lg:ease-out motion-reduce:transition-none! lg:group-hover:shadow-2xl lg:group-hover:shadow-black/40'
    : 'lg:w-60'

  // Etiquetas: ocultas mientras el riel está colapsado, visibles al expandir.
  const etiquetaColapsable = sidebarColapsado
    ? 'whitespace-nowrap min-w-0 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100 lg:transition-opacity lg:duration-200'
    : 'whitespace-nowrap min-w-0'

  // Marca compacta (logo sin texto) vs logo completo con el nombre.
  const claseMarca = sidebarColapsado
    ? 'hidden w-full items-center justify-center lg:flex lg:group-hover:hidden lg:group-focus-within:hidden'
    : 'hidden'
  const claseLogo = sidebarColapsado
    ? 'flex w-full justify-start pl-5 lg:hidden lg:group-hover:flex lg:group-focus-within:flex'
    : 'flex w-full justify-start pl-5'

  // El submenú de Inventario no cabe en el riel: se muestra al expandir.
  const claseSubmenu = sidebarColapsado
    ? 'lg:hidden lg:group-hover:flex lg:group-focus-within:flex'
    : 'flex'

  return (
    <aside
      className={`
    group fixed lg:relative
    top-0 left-0
    z-50
    w-60 ${anchoAside}
    h-screen
    bg-[#1B1D2E]
    flex flex-col
    text-white
    border-r border-white/5
    transform transition-transform duration-300 motion-reduce:transition-none!
    ${sidebarAbierto ? 'translate-x-0' : '-translate-x-full'}
    lg:translate-x-0
  `}
    >

      {/* Riel/panel: en lg es absoluto y crece sobre el contenido al hover/focus */}
      <div
        className={`
    flex h-full w-full flex-col bg-[#1B1D2E]
    lg:absolute lg:inset-y-0 lg:left-0 ${anchoPanel}
    lg:overflow-hidden
  `}
      >

        {/* Logo */}
        <div className="p-0 pt-2.5 flex h-[116px] shrink-0 items-center" style={{
          borderBottom: '1px solid #1f2937'
        }}>
          {/* Marca compacta: solo mientras el riel está colapsado */}
          <div className={claseMarca}>
            <img
              src="/icono.png"
              alt="SnacFlow"
              className="h-10 w-10 object-contain"
              style={{ display: 'block' }}
            />
          </div>

          {/* Logo completo: siempre en móvil, y en lg al expandir o fijar */}
          <div className={claseLogo} style={{ overflow: 'hidden' }}>
            {/* Imagen que contiene logo + nombre + slogan */}
            <img
              src="/SNACKFLOW_LOGO_BLANCO.png"
              alt="SnacFlow"
              className="rounded-lg object-cover object-center"
              style={{ width: '180px', height: '100px', display: 'block' }}
            />
          </div>
        </div>

        {/* Navegación */}
        <nav aria-label="Menú principal" className={`p-3 flex flex-col gap-0.5 flex-1 ${scrollMenu}`}>

        {/* Dashboard y Ventas */}
        {menuPrincipal.slice(0, 2).map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              aria-label={item.label}
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
              <Icon size={17} className="shrink-0" />
              <span className={etiquetaColapsable}>{item.label}</span>
            </NavLink>
          )
        })}

        {/* Inventario con submenú */}
        <div>
          <button
            onClick={() => setInventarioAbierto(prev => !prev)}
            aria-label="Inventario"
            className="py-2.5 px-4" style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              width: '100%', borderRadius: '8px',
              background: inventarioActivo ? '#4f46e5' : 'transparent',
              color: inventarioActivo ? 'white' : '#9ca3af',
              border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: '17px',
              fontWeight: inventarioActivo ? 600 : 400,
              textAlign: 'left', transition: 'all 0.15s'
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
            <Package size={17} className="shrink-0" />
            <span className={etiquetaColapsable} style={{ flex: 1 }}>Inventario</span>
            {inventarioAbierto
              ? <ChevronDown size={16} className={`shrink-0 ${etiquetaColapsable}`} />
              : <ChevronRight size={16} className={`shrink-0 ${etiquetaColapsable}`} />
            }
          </button>

          {/* Submenú: oculto en el riel colapsado, visible al expandir */}
          {inventarioAbierto && (
            <div className={`mt-1 ml-3 pl-3 flex flex-col gap-0.5 ${claseSubmenu}`} style={{
              borderLeft: '1px solid #374151',
            }}>
              {inventarioSubMenu.map((sub) => {
                const SubIcon = sub.icon
                const isSubActive = location.pathname === sub.path
                return (
                  <NavLink
                    key={sub.path}
                    to={sub.path}
                    aria-label={sub.label}
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
                    <SubIcon size={15} className="shrink-0" />
                    <span className={etiquetaColapsable}>{sub.label}</span>
                  </NavLink>
                )
              })}
            </div>
          )}
        </div>

        {/* Resto del menú */}
        {menuPrincipal.slice(2).filter(item => !item.soloAdmin || esAdminPrincipal).map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              aria-label={item.label}
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
              <Icon size={17} className="shrink-0" />
              <span className={etiquetaColapsable}>{item.label}</span>
            </NavLink>
          )
        })}

        </nav>

        {/* Footer */}
        <div className="p-4" style={{
          borderTop: '1px solid #1f2937'
        }}>
          <p className={`m-0 ${etiquetaColapsable}`} style={{
            fontSize: '12px',
            color: '#6b7280',
            textAlign: 'center'
          }}>
            © 2026 SnacFlow v1.0
          </p>
        </div>

      </div>

    </aside>
  )
}
