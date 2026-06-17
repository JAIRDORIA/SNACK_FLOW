import { useEffect, useState, useRef } from 'react'
import { Calendar, LogOut, Users, Plus, X, Eye, EyeOff, Trash2, Shield, Pencil, Check, Menu } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import useDashboardStore from '@/store/useDashboardStore'
import api from '@/api/axios'

const nombresPagina = {
  '/': 'Dashboard',
  '/ventas': 'Ventas',
  '/clientes': 'Clientes',
  '/compras': 'Compras',
  '/proveedores': 'Proveedores',
  '/balance': 'Balance',
  '/abonos': 'Abonos',
  '/cortes': 'Cortes',
  '/inventario/ver': 'Inventario',
  '/inventario/productos': 'Productos',
  '/inventario/combos': 'Combos',
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isMobile
}

function ModalAlerta({ tipo, titulo, mensaje, onConfirmar, onCancelar }) {
  const colores = {
    error: { bg: '#fef2f2', border: '#fecaca', titulo: '#b91c1c', btn: '#ef4444', btnHover: '#dc2626', icono: '🚫' },
    exito: { bg: '#f0fdf4', border: '#bbf7d0', titulo: '#15803d', btn: '#22c55e', btnHover: '#16a34a', icono: '✓' },
    warning: { bg: '#fffbeb', border: '#fde68a', titulo: '#b45309', btn: '#f59e0b', btnHover: '#d97706', icono: '⚠' },
  }
  const c = colores[tipo] || colores.warning

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{
        background: 'white', borderRadius: '16px',
        width: '100%', maxWidth: '380px',
        boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
        overflow: 'hidden', animation: 'popIn 0.2s ease'
      }}>
        <style>{`@keyframes popIn { from { opacity:0; transform:scale(0.92); } to { opacity:1; transform:scale(1); } }`}</style>

        {/* cabecera */}
        <div style={{ background: c.bg, borderBottom: `1px solid ${c.border}`, padding: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>{c.icono}</div>
          <h3 style={{ margin: '0 0 6px', color: c.titulo, fontSize: '17px', fontWeight: 700 }}>{titulo}</h3>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '13px', lineHeight: 1.6 }}>{mensaje}</p>
        </div>

        {/* botones */}
        <div style={{ padding: '16px 24px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          {onCancelar && (
            <button onClick={onCancelar} style={{
              background: '#f3f4f6', border: 'none', borderRadius: '8px',
              padding: '10px 20px', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', color: '#374151', fontFamily: 'inherit'
            }}>
              Cancelar
            </button>
          )}
          <button onClick={onConfirmar} style={{
            background: c.btn, border: 'none', borderRadius: '8px',
            padding: '10px 20px', fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', color: 'white', fontFamily: 'inherit',
            transition: 'background 0.15s'
          }}
            onMouseEnter={e => e.currentTarget.style.background = c.btnHover}
            onMouseLeave={e => e.currentTarget.style.background = c.btn}
          >
            {onCancelar ? 'Confirmar' : 'Entendido'}
          </button>
        </div>
      </div>
    </div>
  )
}

//Modal gestión de usuarios 
function ModalUsuarios({ onCerrar }) {
  const isMobile = useIsMobile()
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [verPass, setVerPass] = useState(false)
  const [form, setForm] = useState({ nombre: '', apellido: '', username: '', password: '', rol: 'admin' })
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  // modales internos
  const [alerta, setAlerta] = useState(null)

  // edición
  const [editandoId, setEditandoId] = useState(null)
  const [editForm, setEditForm] = useState({ nombre: '', apellido: '', username: '', password: '' })
  const [guardandoEdit, setGuardandoEdit] = useState(false)

  const cargarUsuarios = async () => {
    setCargando(true)
    try {
      const res = await api.get('/usuarios/')
      setUsuarios(res.data.datos ?? res.data)
    } catch { setUsuarios([]) }
    finally { setCargando(false) }
  }

  useEffect(() => { cargarUsuarios() }, [])

  const change = e => { setForm({ ...form, [e.target.name]: e.target.value }); setError('') }

  const crearUsuario = async e => {
    e.preventDefault()
    if (!form.nombre || !form.apellido || !form.username || !form.password) { setError('Completa todos los campos.'); return }
    setGuardando(true)
    try {
      const data = {
        nombre: `${form.nombre} ${form.apellido}`.replace(/\s+/g, ' ').trim(),
        username: form.username,
        password: form.password,
        rol: form.rol
      }
      await api.post('/usuarios/', data)
      setAlerta({
        tipo: 'exito',
        titulo: 'Usuario creado',
        mensaje: `El usuario @${form.username} fue creado correctamente.`,
        onConfirmar: () => setAlerta(null)
      })
      setForm({ nombre: '', apellido: '', username: '', password: '', rol: 'admin' })
      setMostrarForm(false)
      cargarUsuarios()
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al crear el usuario.')
    } finally { setGuardando(false) }
  }

  const intentarEliminar = (u) => {
    if (u.id === 1) {
      setAlerta({
        tipo: 'error',
        titulo: 'Acción no permitida',
        mensaje: 'El administrador principal no puede ser eliminado. Es necesario para el funcionamiento del sistema.',
        onConfirmar: () => setAlerta(null)
      })
      return
    }
    setAlerta({
      tipo: 'warning',
      titulo: '¿Desactivar usuario?',
      mensaje: `¿Estás seguro de que deseas desactivar a ${u.nombre}? El usuario ya no podrá iniciar sesión.`,
      onConfirmar: () => { setAlerta(null); desactivar(u.id) },
      onCancelar: () => setAlerta(null)
    })
  }

  const desactivar = async (id) => {
    try {
      await api.delete(`/usuarios/${id}`)
      setAlerta({
        tipo: 'exito',
        titulo: 'Usuario desactivado',
        mensaje: 'El usuario fue desactivado correctamente.',
        onConfirmar: () => setAlerta(null)
      })
      cargarUsuarios()
    } catch {
      setAlerta({
        tipo: 'error',
        titulo: 'Error',
        mensaje: 'No se pudo desactivar el usuario. Intenta de nuevo.',
        onConfirmar: () => setAlerta(null)
      })
    }
  }

  const iniciarEdicion = (u) => {
    const partes = u.nombre.trim().split(/\s+/)

    setEditandoId(u.id)
    setEditForm({
      nombre: partes[0] || '',
      apellido: partes.slice(1).join(' ') || '',
      username: u.username,
      password: '__sin_cambios__'
    })
  }

  const guardarEdicion = async (id) => {
    if (!editForm.nombre || !editForm.apellido || !editForm.username) return
    setGuardandoEdit(true)
    try {
      const data = {
        nombre: `${editForm.nombre} ${editForm.apellido}`
          .replace(/\s+/g, ' ')
          .trim(),
        username: editForm.username,
        password: editForm.password,
        rol: usuarios.find(u => u.id === id)?.rol
      }
      await api.put(`/usuarios/${id}`, data)
      setEditandoId(null)
      setAlerta({
        tipo: 'exito',
        titulo: 'Usuario actualizado',
        mensaje: 'Los datos del usuario fueron actualizados correctamente.',
        onConfirmar: () => setAlerta(null)
      })
      cargarUsuarios()
    } catch (err) {
      setAlerta({
        tipo: 'error',
        titulo: 'Error al actualizar',
        mensaje: err.response?.data?.mensaje || 'No se pudo actualizar el usuario.',
        onConfirmar: () => setAlerta(null)
      })
    } finally { setGuardandoEdit(false) }
  }

  return (
    <>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px'
      }}
        onClick={e => { if (e.target === e.currentTarget) onCerrar() }}
      >
        <div style={{
          background: 'white',
          borderRadius: isMobile ? '5px' : '16px',
          width: '100%',
          maxWidth: isMobile ? '100%' : '620px',
          height: isMobile ? '80vh' : 'auto',
          maxHeight: isMobile ? '100vh' : '82vh',
          display: 'flex',
          flexDirection: 'column',
        }}>

          {/* header */}
          <div style={{
            padding: isMobile ? '16px' : '20px 24px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'stretch' : 'center',
            justifyContent: 'space-between',
            gap: isMobile ? '12px' : '0',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', background: '#eef2ff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={18} color="#4f46e5" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#111827' }}>Gestión de Usuarios</h2>
                <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Administradores del sistema</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button onClick={() => { setMostrarForm(!mostrarForm); setError('') }} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: mostrarForm ? '#f3f4f6' : '#4f46e5',
                color: mostrarForm ? '#374151' : 'white',
                border: 'none', borderRadius: '8px', padding: '8px 14px',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer'
              }}>
                <Plus size={14} />{mostrarForm ? 'Cancelar' : 'Nuevo'}
              </button>
              <button onClick={onCerrar} style={{ background: '#f3f4f6', border: 'none', borderRadius: '8px', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} color="#6b7280" />
              </button>
            </div>
          </div>

          {/* contenido */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '20px 24px' }}>

            {/* formulario nuevo */}
            {mostrarForm && (
              <form onSubmit={crearUsuario} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
                <p style={{ margin: '0 0 16px', fontWeight: 600, color: '#111827', fontSize: '14px' }}>Nuevo administrador</p>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  {[
                    { name: 'nombre', label: 'Nombre', ph: 'Carlos' },
                    { name: 'apellido', label: 'Apellido', ph: 'Pérez' },
                  ].map(f => (
                    <div key={f.name}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{f.label}</label>
                      <input type="text" name={f.name} value={form[f.name]} onChange={change} placeholder={f.ph}
                        style={{ width: '100%', boxSizing: 'border-box', border: '1.5px solid #e5e7eb', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', outline: 'none', fontFamily: 'inherit', color: '#111827', transition: 'border 0.15s' }}
                        onFocus={e => e.target.style.borderColor = '#4f46e5'}
                        onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                      />
                    </div>
                  ))}

                  {/* Usuario */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Usuario</label>
                    <input type="text" name="username" value={form.username} onChange={change} placeholder="cperez"
                      style={{ width: '100%', boxSizing: 'border-box', border: '1.5px solid #e5e7eb', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', outline: 'none', fontFamily: 'inherit', color: '#111827', transition: 'border 0.15s' }}
                      onFocus={e => e.target.style.borderColor = '#4f46e5'}
                      onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                    />
                  </div>

                  {/* Contraseña — ahora en el mismo grid */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Contraseña</label>
                    <div style={{ position: 'relative' }}>
                      <input type={verPass ? 'text' : 'password'} name="password" value={form.password} onChange={change} placeholder="••••••••"
                        style={{ width: '100%', boxSizing: 'border-box', border: '1.5px solid #e5e7eb', borderRadius: '8px', padding: '10px 40px 10px 12px', fontSize: '13px', outline: 'none', fontFamily: 'inherit', color: '#111827', transition: 'border 0.15s' }}
                        onFocus={e => e.target.style.borderColor = '#4f46e5'}
                        onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                      />
                      <button type="button" onClick={() => setVerPass(!verPass)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}>
                        {verPass ? <EyeOff size={16} color="#9ca3af" /> : <Eye size={16} color="#9ca3af" />}
                      </button>
                    </div>
                  </div>
                </div>

                {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', color: '#ef4444', fontSize: '13px', marginBottom: '12px' }}>⚠ {error}</div>}

                <button type="submit" disabled={guardando} style={{ background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: 600, cursor: guardando ? 'not-allowed' : 'pointer', opacity: guardando ? 0.7 : 1 }}>
                  {guardando ? 'Creando...' : 'Crear usuario'}
                </button>
              </form>
            )}

            {/* lista */}
            {cargando ? (
              <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>Cargando...</p>
            ) : usuarios.length === 0 ? (
              <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>No hay usuarios registrados.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {usuarios.map(u => (
                  <div key={u.id} style={{
                    border: '1px solid #e5e7eb', borderRadius: '10px',
                    background: u.id === 1 ? '#fafafa' : 'white',
                    overflow: 'hidden', transition: 'border 0.15s'
                  }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#c7d2fe'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}
                  >
                    {editandoId === u.id ? (
                      // ── modo edición ──
                      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', background: '#eef2ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Pencil size={14} color="#4f46e5" />
                        </div>
                        <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ width: '100%', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '8px' }}>
                            <input value={editForm.nombre} onChange={e => setEditForm({ ...editForm, nombre: e.target.value })}
                              placeholder="Nombre"
                              style={{ border: '1.5px solid #4f46e5', borderRadius: '7px', boxSizing: 'border-box', width: '100%', padding: '8px 10px', fontSize: '13px', outline: 'none', fontFamily: 'inherit', color: '#111827', background: '#fafaff' }}
                            />
                            <input value={editForm.apellido} onChange={e => setEditForm({ ...editForm, apellido: e.target.value })}
                              placeholder="Apellido"
                              style={{ border: '1.5px solid #4f46e5', borderRadius: '7px', boxSizing: 'border-box', width: '100%', padding: '8px 10px', fontSize: '13px', outline: 'none', fontFamily: 'inherit', color: '#111827', background: '#fafaff' }}
                            />
                            <input value={editForm.username} onChange={e => setEditForm({ ...editForm, username: e.target.value })}
                              placeholder="Username"
                              style={{ border: '1.5px solid #4f46e5', borderRadius: '7px', boxSizing: 'border-box', width: '100%', padding: '8px 10px', fontSize: '13px', outline: 'none', fontFamily: 'inherit', color: '#111827', background: '#fafaff' }}
                            />
                            <input type="password" value="__sin_cambios__" disabled placeholder="••••••••"
                              style={{ border: '1.5px solid #e5e7eb', borderRadius: '7px', padding: '8px 10px', fontSize: '13px', fontFamily: 'inherit', color: '#9ca3af', background: '#f3f4f6', width: '100%', boxSizing: 'border-box', cursor: 'not-allowed', outline: 'none' }}
                            />
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                          <button onClick={() => guardarEdicion(u.id)} disabled={guardandoEdit} style={{ background: '#4f46e5', border: 'none', borderRadius: '7px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <Check size={14} color="white" />
                          </button>
                          <button onClick={() => setEditandoId(null)} style={{ background: '#f3f4f6', border: 'none', borderRadius: '7px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <X size={14} color="#6b7280" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      // modo normal
                      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', gap: isMobile ? '12px' : '0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '36px', height: '36px', background: u.id === 1 ? '#fef3c7' : '#eef2ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {u.id === 1
                              ? <Shield size={16} color="#d97706" />
                              : <span style={{ color: '#4f46e5', fontSize: '12px', fontWeight: 700 }}>{u.nombre?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}</span>
                            }
                          </div>
                          <div>
                            <p style={{ margin: 0, fontWeight: 600, color: '#111827', fontSize: '14px' }}>
                              {u.nombre}
                              {u.id === 1 && <span style={{ marginLeft: '6px', fontSize: '10px', color: '#d97706', fontWeight: 500 }}>(principal)</span>}
                            </p>
                            <p style={{ margin: 0, color: '#6b7280', fontSize: '12px' }}>@{u.username}</p>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ background: '#eef2ff', color: '#4f46e5', fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', textTransform: 'capitalize' }}>
                            {u.rol}
                          </span>

                          {/* editar */}
                          <button onClick={() => iniciarEdicion(u)} style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '6px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#e0f2fe'; e.currentTarget.style.borderColor = '#7dd3fc' }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#f0f9ff'; e.currentTarget.style.borderColor = '#bae6fd' }}
                            title="Editar usuario"
                          >
                            <Pencil size={12} color="#0284c7" />
                          </button>

                          {/* eliminar */}
                          <button onClick={() => intentarEliminar(u)} style={{
                            background: u.id === 1 ? '#f9fafb' : '#fef2f2',
                            border: `1px solid ${u.id === 1 ? '#e5e7eb' : '#fecaca'}`,
                            borderRadius: '6px', width: '30px', height: '30px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', transition: 'all 0.15s'
                          }}
                            onMouseEnter={e => {
                              if (u.id !== 1) { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.borderColor = '#fca5a5' }
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = u.id === 1 ? '#f9fafb' : '#fef2f2'
                              e.currentTarget.style.borderColor = u.id === 1 ? '#e5e7eb' : '#fecaca'
                            }}
                            title={u.id === 1 ? 'Admin principal protegido' : 'Desactivar usuario'}
                          >
                            {u.id === 1
                              ? <Shield size={12} color="#d1d5db" />
                              : <Trash2 size={12} color="#ef4444" />
                            }
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* modales de alerta */}
      {alerta && <ModalAlerta {...alerta} />}
    </>
  )
}

// Header principal
export default function Header({ setSidebarAbierto }) {
  const isMobile = useIsMobile()
  const usuario = JSON.parse(localStorage.getItem('usuario'))
  const { balance, fetchDashboard } = useDashboardStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [dropdown, setDropdown] = useState(false)
  const [modalUsuarios, setModalUsuarios] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => { fetchDashboard() }, [])

  useEffect(() => {
    const handler = e => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdown(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const cerrarSesion = () => { localStorage.removeItem('access_token'); navigate('/login') }

  const fechaCorte = balance?.fecha_inicio
    ? new Date(balance.fecha_inicio).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
    : '...'

  const paginaActual = nombresPagina[location.pathname] ?? 'Dashboard'

  return (
    <>
      <header style={{ padding: '20px 17px' }} className="bg-white border-b-2 border-gray-300 shadow-sm flex items-center justify-between shrink-0">

        <div className="flex items-center gap-4">

          {/* Botón hamburguesa */}
          <button className="block lg:hidden" onClick={() => setSidebarAbierto(true)}
            style={{
              border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex lg:hidden', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <Menu size={24} />
          </button>

          <span className="text-base md:text-lg lg:text-xl text-indigo-600 font-bold">
            {paginaActual}
          </span>

          <div className="hidden md:block" style={{ width: '1px', height: '35px', background: '#8e8f94' }} />

          <div className="hidden md:flex" style={{ alignItems: 'center', gap: '6px', fontSize: '14px' }}>
            <Calendar size={16} color="#9ca3af" />
            <span style={{ color: '#6b7280' }}>Corte</span>
            <span style={{ fontWeight: 600, color: '#111827' }}>
              #{balance?.corte_numero ?? '...'}
            </span>
            <span style={{ color: '#6b7280' }}>empezó el</span>
            <span style={{ fontWeight: 600, color: '#111827' }}>
              {fechaCorte}
            </span>
          </div>

        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button onClick={() => setDropdown(!dropdown)} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: dropdown ? '#e0e7ff' : '#eef2ff',
              border: `1px solid ${dropdown ? '#a5b4fc' : '#e0e7ff'}`,
              padding: '6px 12px', borderRadius: '8px',
              cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit'
            }}>
              <div style={{ width: '32px', height: '32px', background: '#4f46e5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: 'white', fontSize: '12px', fontWeight: 700 }}>AD</span>
              </div>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontWeight: 600, color: '#111827', fontSize: '14px', margin: 0, lineHeight: 1 }}>{usuario?.nombre || 'Admin'}</p>
                <p style={{ fontSize: '12px', color: '#818cf8', margin: '3px 0 0 0' }}>Administrador</p>
              </div>
            </button>

            {dropdown && (
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 10px 40px rgba(0,0,0,0.12)', minWidth: '200px', zIndex: 100, overflow: 'hidden', animation: 'fadeDown 0.15s ease' }}>
                <style>{`@keyframes fadeDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }`}</style>

                <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6' }}>
                  <p style={{ margin: 0, fontWeight: 600, color: '#111827', fontSize: '13px' }}>{usuario?.nombre || 'Admin'}</p>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6b7280' }}>Administrador</p>
                </div>

                <div style={{ padding: '6px' }}>
                  <button onClick={() => { setDropdown(false); setModalUsuarios(true) }}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', color: '#374151', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Users size={15} color="#4f46e5" /> Gestionar usuarios
                  </button>

                  <div style={{ height: '1px', background: '#f3f4f6', margin: '4px 0' }} />

                  <button onClick={cerrarSesion}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', color: '#ef4444', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <LogOut size={15} color="#ef4444" /> Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {modalUsuarios && <ModalUsuarios onCerrar={() => setModalUsuarios(false)} />}
    </>
  )
}
