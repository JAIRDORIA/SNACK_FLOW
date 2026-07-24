import { useState, useEffect,useMemo } from 'react'
import {
  Search, AlertTriangle, Package,
  TrendingDown, CheckCircle, Layers,
  Pencil, X, RefreshCw, Plus, ClipboardList, Boxes
} from 'lucide-react'
import useInventarioStore from '@/store/useInventarioStore'
import { putInventario, putInventarioCantidades } from '@/api/inventario_api'
import { postProduccion, getProducciones } from '@/api/producciones_api'
import { getProductos } from '@/api/productos_api'
import { formatearFechaColombia, formatearFechaCorta } from '@/utils/formatearFecha'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isMobile
}

function normalizar(stockActual, unidadesSueltas, unidadesPorBandeja) {
  if (!unidadesPorBandeja) return { bandejas: stockActual, sueltas: unidadesSueltas }
  const total = stockActual * unidadesPorBandeja + unidadesSueltas
  const bandejas = Math.trunc(total / unidadesPorBandeja)
  const sueltas = total - bandejas * unidadesPorBandeja
  return { bandejas, sueltas }
}

export  function ModalEditarCantidades({ item, onCerrar, onGuardado }) {
  // item debe traer: id, nombre_producto, stock_actual, unidades_sueltas, unidades_por_bandeja
  const usuario = JSON.parse(localStorage.getItem('usuario') || 'null')

  const [stockActual, setStockActual] = useState(String(item.stock_actual))
  const [unidadesSueltas, setUnidadesSueltas] = useState(String(item.unidades_sueltas))
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const stockNum = parseInt(stockActual)
  const sueltasNum = parseInt(unidadesSueltas)
  const valoresValidos = !isNaN(stockNum) && !isNaN(sueltasNum)

  const preview = useMemo(() => {
    if (!valoresValidos) return null
    return normalizar(stockNum, sueltasNum, item.unidades_por_bandeja)
  }, [stockNum, sueltasNum, valoresValidos, item.unidades_por_bandeja])

  const seNormaliza = preview && (preview.bandejas !== stockNum || preview.sueltas !== sueltasNum)

  const submit = async (e) => {
    e.preventDefault()
    setError('')

    if (!valoresValidos) {
      setError('Ingresa números enteros válidos.')
      return
    }
    if (stockNum === item.stock_actual && sueltasNum === item.unidades_sueltas) {
      setError('Los valores son iguales a los actuales.')
      return
    }
    if (!usuario?.id) {
      setError('No se pudo identificar el usuario actual.')
      return
    }

    setGuardando(true)
    try {
      await putInventarioCantidades(item.id, {
        stock_actual: stockNum,
        unidades_sueltas: sueltasNum,
        usuario_id: usuario.id,
      })
      onGuardado()
      onCerrar()
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al actualizar.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
      onClick={e => { if (e.target === e.currentTarget) onCerrar() }}
    >
      <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '420px', boxShadow: '0 24px 60px rgba(0,0,0,0.25)', overflow: 'hidden' }}>

        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', background: '#eef2ff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Pencil size={16} color="#4f46e5" />
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: '#0f172a', fontSize: '15px' }}>Editar cantidades</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{item.nombre_producto}</p>
            </div>
          </div>
          <button onClick={onCerrar} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={15} color="#64748b" />
          </button>
        </div>

        <form onSubmit={submit} style={{ padding: '24px' }}>
          <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '14px 16px', marginBottom: '18px', fontSize: '12px', color: '#64748b' }}>
            {item.unidades_por_bandeja} unidades por bandeja
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                Bandejas
              </label>
              <input type="number" value={stockActual}
                onChange={e => { setStockActual(e.target.value); setError('') }}
                style={{ width: '100%', boxSizing: 'border-box', border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px', fontSize: '15px', fontWeight: 600, outline: 'none', fontFamily: 'inherit', color: '#0f172a' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                Sueltas
              </label>
              <input type="number" value={unidadesSueltas}
                onChange={e => { setUnidadesSueltas(e.target.value); setError('') }}
                style={{ width: '100%', boxSizing: 'border-box', border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px', fontSize: '15px', fontWeight: 600, outline: 'none', fontFamily: 'inherit', color: '#0f172a' }}
              />
            </div>
          </div>

          {seNormaliza && (
            <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: '10px', padding: '12px 14px', marginBottom: '14px', fontSize: '13px', color: '#4338ca' }}>
              Se guardará normalizado como <strong>{preview.bandejas} bandejas</strong> y <strong>{preview.sueltas} sueltas</strong>.
            </div>
          )}

          {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', color: '#ef4444', fontSize: '13px', marginBottom: '12px' }}>⚠ {error}</div>}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={onCerrar} style={{ flex: 1, background: '#f1f5f9', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#475569', fontFamily: 'inherit' }}>
              Cancelar
            </button>
            <button type="submit" disabled={guardando} style={{ flex: 1, background: guardando ? 'rgba(79,70,229,0.5)' : '#4f46e5', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '13px', fontWeight: 600, cursor: guardando ? 'not-allowed' : 'pointer', color: 'white', fontFamily: 'inherit' }}>
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


// MODAL EDITAR STOCK MINIMO
function ModalEditarStockMinimo({ item, onCerrar, onGuardado }) {
  const [valor, setValor] = useState(String(item.stock_minimo))
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const submit = async e => {
    e.preventDefault()
    const num = parseInt(valor)
    if (isNaN(num) || num < 0) { setError('Ingresa un número mayor o igual a 0.'); return }
    if (num === item.stock_minimo) { setError('El valor es igual al actual.'); return }
    setGuardando(true)
    try {
      await putInventario(item.id, { stock_minimo: num })
      onGuardado()
      onCerrar()
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al actualizar.')
    } finally { setGuardando(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
      onClick={e => { if (e.target === e.currentTarget) onCerrar() }}
    >
      <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '400px', boxShadow: '0 24px 60px rgba(0,0,0,0.25)', overflow: 'hidden', animation: 'popIn 0.2s ease' }}>
        <style>{`@keyframes popIn { from { opacity:0; transform:scale(0.93); } to { opacity:1; transform:scale(1); } }`}</style>

        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', background: '#eef2ff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Pencil size={16} color="#4f46e5" />
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: '#0f172a', fontSize: '15px' }}>Editar stock mínimo</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{item.nombre_producto}</p>
            </div>
          </div>
          <button onClick={onCerrar} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={15} color="#64748b" />
          </button>
        </div>

        <form onSubmit={submit} style={{ padding: '24px' }}>
          <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: '0 0 2px', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Stock actual</p>
              <p style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>{item.stock_actual}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: '0 0 2px', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Stock mínimo actual</p>
              <p style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#4f46e5' }}>{item.stock_minimo}</p>
            </div>
          </div>

          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
            Nuevo stock mínimo
          </label>
          <input type="number" min="0" value={valor}
            onChange={e => { setValor(e.target.value); setError('') }}
            style={{ width: '100%', boxSizing: 'border-box', border: `1.5px solid ${error ? '#fca5a5' : '#e2e8f0'}`, borderRadius: '10px', padding: '12px 14px', fontSize: '15px', fontWeight: 600, outline: 'none', fontFamily: 'inherit', color: '#0f172a', transition: 'border 0.15s', marginBottom: '12px' }}
            onFocus={e => { if (!error) e.target.style.borderColor = '#4f46e5' }}
            onBlur={e => { if (!error) e.target.style.borderColor = '#e2e8f0' }}
            autoFocus
          />

          {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', color: '#ef4444', fontSize: '13px', marginBottom: '12px' }}>⚠ {error}</div>}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={onCerrar} style={{ flex: 1, background: '#f1f5f9', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#475569', fontFamily: 'inherit' }}>
              Cancelar
            </button>
            <button type="submit" disabled={guardando} style={{ flex: 1, background: guardando ? 'rgba(79,70,229,0.5)' : '#4f46e5', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '13px', fontWeight: 600, cursor: guardando ? 'not-allowed' : 'pointer', color: 'white', fontFamily: 'inherit', transition: 'background 0.15s' }}>
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// MODAL REGISTRAR PRODUCCION
function ModalProduccion({ onCerrar, onGuardado }) {
  const hoy = formatearFechaColombia(new Date().toISOString(), false).split('/').reverse().join('-')
  const isMobile = useIsMobile()
  const [productos, setProductos] = useState([])
  const [cargandoProd, setCargandoProd] = useState(true)
  const [form, setForm] = useState({
    producto_id: '',
    cantidad: '',
    unidades_sueltas: '',
    fecha: hoy,
    observacion: ''
  })
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [upb, setUpb] = useState(0)

  useEffect(() => {
    getProductos(1, 100)
      .then(res => setProductos(res.data.datos ?? res.data))
      .catch(() => setProductos([]))
      .finally(() => setCargandoProd(false))
  }, [])

  const change = e => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
    setError('')
    if (name === 'producto_id') {
      const prod = productos.find(p => String(p.id) === String(value))
      setUpb(prod?.unidades_por_bandeja || 0)
    }
  }

  const submit = async e => {
    e.preventDefault()
    if (!form.producto_id) { setError('Selecciona un producto.'); return }
    if (!form.cantidad || parseInt(form.cantidad) <= 0) { setError('La cantidad debe ser mayor a 0.'); return }
    if (form.unidades_sueltas === '' || parseInt(form.unidades_sueltas) < 0) {
      setError('Las unidades sueltas deben ser un número no negativo.')
      return
    }
    if (!form.fecha) { setError('La fecha es requerida.'); return }

    const [y, m, d] = form.fecha.split('-')
    const fechaBackend = `${d}/${m}/${y}`

    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
    if (!usuario.id) { setError('No se pudo obtener el usuario. Inicia sesión de nuevo.'); return }

    setGuardando(true)
    try {
      await postProduccion({
        producto_id: parseInt(form.producto_id),
        cantidad: parseInt(form.cantidad) + bandejasExtra,
        unidades_sueltas: sueltasResiduo,
        usuario_id: usuario.id,
        fecha: fechaBackend,
        observacion: form.observacion || null
      })
      setExito('Producción registrada correctamente. El stock se actualizó.')
      setTimeout(() => {
        onGuardado()
        onCerrar()
      }, 1500)
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al registrar la producción.')
    } finally { setGuardando(false) }
  }

  const inputCss = {
    width: '100%', boxSizing: 'border-box',
    border: '1.5px solid #e2e8f0', borderRadius: '10px',
    padding: '11px 14px', fontSize: '14px', outline: 'none',
    fontFamily: 'inherit', color: '#0f172a', transition: 'border 0.15s',
    background: 'white'
  }

  const sueltasNum = parseInt(form.unidades_sueltas) || 0
  const bandejasExtra = upb > 0 ? Math.floor(sueltasNum / upb) : 0
  const sueltasResiduo = upb > 0 ? sueltasNum % upb : sueltasNum
  const hayConversion = bandejasExtra > 0

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
      onClick={e => { if (e.target === e.currentTarget) onCerrar() }}
    >
      <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '460px', boxShadow: '0 24px 60px rgba(0,0,0,0.25)', overflow: 'hidden', animation: 'popIn 0.2s ease' }}>

        {/* header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', background: '#eef2ff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ClipboardList size={16} color="#4f46e5" />
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: '#0f172a', fontSize: '15px' }}>Registrar producción</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>El stock se actualizará automáticamente</p>
            </div>
          </div>
          <button onClick={onCerrar} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={15} color="#64748b" />
          </button>
        </div>

        {/* body */}
        <form onSubmit={submit} style={{ padding: '24px' }}>

          {/* producto */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              Producto
            </label>
            <select name="producto_id" value={form.producto_id} onChange={change}
              disabled={cargandoProd}
              style={{ ...inputCss, cursor: cargandoProd ? 'not-allowed' : 'pointer' }}
              onFocus={e => e.target.style.borderColor = '#4f46e5'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            >
              <option value="">{cargandoProd ? 'Cargando productos...' : 'Selecciona un producto'}</option>
              {productos.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>

          {/* cantidad y fecha en grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                Cantidad (bandejas)
              </label>
              <input type="number" name="cantidad" value={form.cantidad} onChange={change}
                min="1" placeholder="Ej: 10" maxLength={5}
                style={inputCss}
                onFocus={e => e.target.style.borderColor = '#4f46e5'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                Unidades sueltas
              </label>
              <input type="number" name="unidades_sueltas" value={form.unidades_sueltas} onChange={change}
                min="0" placeholder="Ej: 5" maxLength={5}
                style={inputCss}
                onFocus={e => e.target.style.borderColor = '#4f46e5'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
              {hayConversion && (
                <div style={{
                  marginTop: '6px', padding: '8px 12px',
                  background: '#fffbeb', border: '1px solid #fde68a',
                  borderRadius: '8px', fontSize: '12px', color: '#b45309'
                }}>
                  ⚠ Se convertirán en {bandejasExtra} bandeja{bandejasExtra > 1 ? 's' : ''} + {sueltasResiduo} suelta{sueltasResiduo !== 1 ? 's' : ''}
                </div>
              )}
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                Fecha
              </label>
              <input type="date" name="fecha" value={form.fecha} onChange={change}
                style={inputCss}
                onFocus={e => e.target.style.borderColor = '#4f46e5'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>
          </div>

          {/* observacion */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              Observación <span style={{ color: '#94a3b8', fontWeight: 400 }}>(opcional)</span>
            </label>
            <textarea name="observacion" value={form.observacion} onChange={change}
              placeholder="Ej: Producción del lunes..." maxLength={100}
              rows={3}
              style={{ ...inputCss, resize: 'vertical', lineHeight: '1.5' }}
              onFocus={e => e.target.style.borderColor = '#4f46e5'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          {/* errores y exito */}
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', color: '#ef4444', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ⚠ {error}
            </div>
          )}
          {exito && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 14px', color: '#15803d', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ✓ {exito}
            </div>
          )}

          {/* botones */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={onCerrar} style={{ flex: 1, background: '#f1f5f9', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#475569', fontFamily: 'inherit' }}>
              Cancelar
            </button>
            <button type="submit" disabled={guardando || !!exito} style={{ flex: 1, background: guardando ? 'rgba(79,70,229,0.5)' : '#4f46e5', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '13px', fontWeight: 600, cursor: guardando ? 'not-allowed' : 'pointer', color: 'white', fontFamily: 'inherit', transition: 'background 0.15s' }}>
              {guardando ? 'Registrando...' : 'Registrar producción'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// MODAL HISTORIAL DE PRODUCCIONES
function ModalHistorialProduccion({ onCerrar }) {
  const isMobile = useIsMobile()
  const [producciones, setProducciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)

  const cargarProducciones = async (page = 1) => {
    setCargando(true)
    try {
      const response = await getProducciones(page, 10)
      const data = response.data || response
      setProducciones(data.datos || data.data || data)
      setTotalPaginas(data.total_paginas || Math.ceil((data.total || 0) / 10) || 1)
      setPagina(page)
    } catch (err) {
      console.error('Error:', err)
      setError(err.response?.data?.mensaje || 'Error al cargar el historial')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarProducciones()
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
      onClick={e => { if (e.target === e.currentTarget) onCerrar() }}
    >
      <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '900px', maxHeight: '80vh', boxShadow: '0 24px 60px rgba(0,0,0,0.25)', overflow: 'hidden', display: 'flex', flexDirection: 'column', animation: 'popIn 0.2s ease' }}>

        {/* header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', background: '#eef2ff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ClipboardList size={16} color="#4f46e5" />
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: '#0f172a', fontSize: '15px' }}>Historial de producciones</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Registro de todas las producciones realizadas</p>
            </div>
          </div>
          <button onClick={onCerrar} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={15} color="#64748b" />
          </button>
        </div>

        {/* contenido */}
        <div style={{ overflow: 'auto', flex: 1 }}>
          {cargando ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" style={{ margin: '0 auto' }} />
              <p style={{ marginTop: '16px', color: '#64748b' }}>Cargando historial...</p>
            </div>
          ) : error ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>
              <AlertTriangle size={32} style={{ margin: '0 auto 12px' }} />
              <p>{error}</p>
            </div>
          ) : producciones.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
              <Package size={48} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p>No hay producciones registradas</p>
            </div>
          ) : (
            <>
              <table style={{ minWidth: '1100px', width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <th style={{ padding: '16px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>ID</th>
                    <th style={{ padding: '16px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Producto</th>
                    <th style={{ padding: '16px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Cantidad (bandejas)</th>
                    <th style={{ padding: '16px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Unidades sueltas</th>
                    <th style={{ padding: '16px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Usuario</th>
                    <th style={{ padding: '16px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Fecha</th>
                    <th style={{ padding: '16px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Observación</th>
                  </tr>
                </thead>
                <tbody>
                  {producciones.map(prod => (
                    <tr key={prod.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 12px', fontSize: '13px', fontWeight: 500, color: '#4f46e5' }}>#{prod.id}</td>
                      <td style={{ padding: '14px 12px', fontSize: '13px', color: '#0f172a' }}> {prod.nombre_producto}</td>
                      <td style={{ padding: '14px 12px', fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{prod.cantidad}</td>
                      <td style={{ padding: '14px 12px', fontSize: '13px', color: '#475569' }}>{prod.unidades_sueltas || 0}</td>
                      <td style={{ padding: '14px 12px', fontSize: '13px', color: '#475569' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', padding: '4px 10px', borderRadius: '20px' }}>
                          👤 {prod.nombre_usuario || `Usuario #${prod.usuario_id}`}
                        </span>
                      </td>
                      <td style={{ padding: '14px 12px', fontSize: '13px', color: '#475569' }}>{formatearFechaCorta(prod.fecha)}</td>
                      <td style={{ padding: '14px 12px', fontSize: '13px', color: '#64748b', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {prod.observacion || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* paginación */}
              {totalPaginas > 1 && (
                <div style={{ padding: '16px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    onClick={() => cargarProducciones(pagina - 1)}
                    disabled={pagina === 1}
                    style={{ padding: '8px 16px', background: pagina === 1 ? '#f1f5f9' : 'white', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: pagina === 1 ? 'not-allowed' : 'pointer', color: pagina === 1 ? '#94a3b8' : '#475569' }}>
                    ← Anterior
                  </button>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Página {pagina} de {totalPaginas}</span>
                  <button
                    onClick={() => cargarProducciones(pagina + 1)}
                    disabled={pagina === totalPaginas}
                    style={{ padding: '8px 16px', background: pagina === totalPaginas ? '#f1f5f9' : 'white', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: pagina === totalPaginas ? 'not-allowed' : 'pointer', color: pagina === totalPaginas ? '#94a3b8' : '#475569' }} >
                    Siguiente →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// COMPONENTE PRINCIPAL
export default function Inventario() {

  const {
    inventario, total, pagina, total_paginas,
    bajoStock, cargando, error,
    fetchInventario, fetchBajoStock
  } = useInventarioStore()

  const [busqueda, setBusqueda] = useState('')
  const [editando, setEditando] = useState(null)
  const [editandoCantidades, setEditandoCantidades] = useState(null)
  const [modalProduccion, setModalProduccion] = useState(false)
  const [modalHistorial, setModalHistorial] = useState(false)
  const isMobile = useIsMobile()

  useEffect(() => {
    fetchInventario()
    fetchBajoStock()
  }, [])

  const cargar = (p = 1) => {
    fetchInventario(p)
    fetchBajoStock()
  }

  const lista = inventario.filter(i => {
    const q = busqueda.toLowerCase()
    return String(i.id).includes(q) || i.nombre_producto?.toLowerCase().includes(q)
  })

  const totalProductos = total
  const bajoStockCount = bajoStock.length
  const stockOk = inventario.filter(i => i.stock_actual > i.stock_minimo).length
  const sinStock = inventario.filter(i => i.stock_actual === 0).length

  if (cargando) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Cargando inventario...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="p-8 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-4 max-w-2xl">
      <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
        <AlertTriangle size={20} className="text-red-500" />
      </div>
      <div>
        <p className="text-red-700 font-semibold text-sm mb-1">Error al cargar inventario</p>
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    </div>
  )

  return (
    <div style={{ padding: '32px' }} className="flex-1 bg-gray-50">

      {/* título */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '16px' : '0' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#000000', margin: 0, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
          Gestión de Inventario
        </h1>
        <div style={{ display: 'flex', gap: '10px', flexWrap: isMobile ? 'wrap' : 'nowrap', width: isMobile ? '100%' : 'auto' }}>
          <button
            onClick={() => setModalProduccion(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-md shadow-indigo-500/30 active:scale-95"
            style={{ padding: '8px 16px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, border: 'none', flex: isMobile ? 1 : undefined }}
          >
            <Plus size={15} />
            Registrar producción
          </button>
          <button
            onClick={() => setModalHistorial(true)}
            className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-all"
            style={{ padding: '8px 16px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, border: 'none', flex: isMobile ? 1 : undefined }}
          >
            <ClipboardList size={14} />
            Ver historial
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ marginBottom: '30px' }} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: isMobile ? 'Productos' : 'Total productos', val: totalProductos, icon: <Layers size={isMobile ? 16 : 22} color="#818cf8" />, ring: 'ring-indigo-500/40' },
          { label: isMobile ? 'Stock OK' : 'Total stock OK', val: stockOk, icon: <CheckCircle size={isMobile ? 16 : 22} color="#34d399" />, ring: 'ring-emerald-400/40' },
          { label: isMobile ? 'Bajo stock' : 'Total bajo stock', val: bajoStockCount, icon: <TrendingDown size={isMobile ? 16 : 22} color="#fbbf24" />, ring: 'ring-amber-400/40' },
          { label: isMobile ? 'Sin stock' : 'Total sin stock', val: sinStock, icon: <Package size={isMobile ? 16 : 22} color="#f87171" />, ring: 'ring-red-400/40' },
        ].map((card, i) => (
          <div
            key={i}
            className="bg-[#1B1D2E] rounded-2xl flex items-center"
            style={{ gap: isMobile ? '10px' : '16px', padding: isMobile ? '16px' : '20px' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none' }} >
            <div className={`bg-[#13152280] ring-2 ${card.ring} rounded-xl flex items-center justify-center shrink-0`} style={{ width: isMobile ? '48px' : '56px', height: isMobile ? '48px' : '56px' }}>
              {card.icon}
            </div>
            <div>
              <p style={{ fontSize: isMobile ? '24px' : '30px', color: 'white', fontWeight: 700, margin: 0, lineHeight: 1 }} >{card.val} </p>
              <p style={{ fontSize: isMobile ? '11px' : '12px', color: 'rgba(255,255,255,0.5)', margin: '4px 0 0', lineHeight: 1.2, wordBreak: 'break-word' }}>{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* alerta bajo stock */}
      {bajoStock.length > 0 && (
        <div style={{ marginBottom: '24px', padding: '16px 20px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '14px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <AlertTriangle size={18} color="#d97706" style={{ flexShrink: 0, marginTop: '1px' }} />
          <div>
            <p style={{ margin: '0 0 4px', fontWeight: 600, color: '#92400e', fontSize: '13px' }}>
              {bajoStock.length} producto{bajoStock.length > 1 ? 's' : ''} bajo el stock mínimo
            </p>
            <p style={{ margin: 0, color: '#b45309', fontSize: '12px' }}>
              {bajoStock.map(b => b.nombre).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* tabla */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-visible">

        <div className="border-b border-slate-100 flex gap-4 items-center flex-wrap" style={{ padding: '12px' }}>
          <div className="relative flex-1 max-w-md" style={{ minWidth: isMobile ? '100%' : '280px' }}>
            <input type="text" placeholder="Buscar por ID o producto..."
              value={busqueda} onChange={e => setBusqueda(e.target.value)} maxLength={50}
              style={{ paddingLeft: '48px', paddingRight: '16px', paddingTop: '12px', paddingBottom: '12px' }}
              className="w-full border border-slate-200 rounded-xl text-sm outline-none text-slate-700 bg-white focus:border-indigo-400 focus:ring-3 focus:ring-indigo-50 transition-all placeholder:text-slate-400"
            />
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="border-collapse" style={{ minWidth: '900px', width: '100%' }}>
            <thead>
              <tr className="bg-slate-50/80">
                {['ID', 'Producto', 'Stock actual', 'Unidades sueltas', 'Stock mínimo', 'Estado', 'Acciones'].map((h, i) => (
                  <th key={h} style={{ padding: '4px 8px' }} className={`text-left text-xs font-semibold text-slate-400 uppercase tracking-wider ${i === 0 ? 'pl-8' : ''}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '20px 0' }} className="text-center text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
                        <Search size={28} className="text-slate-300" />
                      </div>
                      <p className="text-sm font-medium">No se encontraron productos</p>
                    </div>
                  </td>
                </tr>
              ) : lista.map(item => {
                const sinStockItem = item.stock_actual === 0
                const bajStockItem = item.stock_actual <= item.stock_minimo && item.stock_actual > 0
                const estadoCfg = sinStockItem
                  ? { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', label: 'Sin stock' }
                  : bajStockItem
                    ? { bg: '#fffbeb', color: '#b45309', border: '#fde68a', label: 'Bajo stock' }
                    : { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0', label: 'Disponible' }

                return (
                  <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                    <td style={{ padding: '4px 6px', paddingLeft: '32px' }}>
                      <span className="font-semibold text-sm text-indigo-600">#{String(item.id).padStart(3, '0')}</span>
                    </td>
                    <td style={{ padding: '4px 6px' }} className="text-slate-700 font-medium text-sm">{item.nombre_producto}</td>
                    <td style={{ padding: '4px 6px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: sinStockItem ? '#dc2626' : bajStockItem ? '#b45309' : '#0f172a' }}>
                        {item.stock_actual}
                      </span>
                    </td>
                    <td style={{ padding: '4px 6px' }} className="text-slate-500 text-sm">{item.unidades_sueltas}</td>
                    <td style={{ padding: '4px 6px' }} className="text-slate-500 text-sm">{item.stock_minimo}</td>
                    <td style={{ padding: '4px 6px' }}>
                      <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium border"
                        style={{ padding: "6px 12px", background: estadoCfg.bg, color: estadoCfg.color, borderColor: estadoCfg.border }}>
                        {estadoCfg.label}
                      </span>
                    </td>
                    <td style={{ padding: '4px 6px' }}>
                      <button title="Editar stock mínimo" onClick={() => setEditando(item)}
                        className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-indigo-50"
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                      >
                        <Pencil size={15} color="#4f46e5" />
                      </button>
                      <button title="Editar cantidades (bandejas/sueltas)" onClick={() => setEditandoCantidades(item)}
                        className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-emerald-50"
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                      >
                        <Boxes size={15} color="#059669" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* pie tabla */}
        <div style={{ padding: '5px 8px' }} className="border-t border-slate-100 flex justify-between items-center text-sm text-slate-500 bg-slate-50/30">
          <span className="text-sm">
            Mostrando <strong className="text-slate-700 font-semibold">{lista.length}</strong> de{' '}
            <strong className="text-slate-700 font-semibold">{total}</strong> productos
          </span>
          {total_paginas > 1 && (
            <div className="flex items-center gap-2">
              <button onClick={() => fetchInventario(pagina - 1)} disabled={pagina === 1}
                className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white disabled:opacity-40 hover:bg-slate-50 transition-all font-medium text-slate-600"
                style={{ cursor: pagina === 1 ? 'not-allowed' : 'pointer' }}>
                ← Anterior
              </button>
              <span className="text-sm text-slate-500 px-3 font-medium">{pagina} / {total_paginas}</span>
              <button onClick={() => fetchInventario(pagina + 1)} disabled={pagina === total_paginas}
                className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white disabled:opacity-40 hover:bg-slate-50 transition-all font-medium text-slate-600"
                style={{ cursor: pagina === total_paginas ? 'not-allowed' : 'pointer' }}>
                Siguiente →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* modales */}
      {editando && (
        <ModalEditarStockMinimo
          item={editando}
          onCerrar={() => setEditando(null)}
          onGuardado={() => cargar(pagina)}
        />
      )}
      {editandoCantidades && (
        <ModalEditarCantidades
          item={editandoCantidades}
          onCerrar={() => setEditandoCantidades(null)}
          onGuardado={() => cargar(pagina)}
        />
      )}
      {modalProduccion && (
        <ModalProduccion
          onCerrar={() => setModalProduccion(false)}
          onGuardado={() => cargar(pagina)}
        />
      )}
      {modalHistorial && (
        <ModalHistorialProduccion
          onCerrar={() => setModalHistorial(false)}
        />
      )}

    </div>
  )
}
