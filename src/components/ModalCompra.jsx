import { useState, useRef, useEffect } from 'react'
import {
  X, AlertTriangle, ShoppingBag, DollarSign, Calendar, Truck,
  ChevronDown, CheckCircle2, FileText, Info, Bike, Search,
} from 'lucide-react'
import useMediosPagoStore from '@/store/useMediosPagoStore'
import MedioPagoSelector, { medioPagoValido } from '@/components/MedioPagoSelector'
import { getVentasConDomicilio } from '@/api/ventas_api'

// Estilos mínimos del modal (antes vivían en la página de Compras; ahora el modal
// también se abre desde Ventas, donde esas clases no existían).
const estilosModal = `
  @media (max-width: 768px) {
    .modal-footer { flex-direction: column-reverse !important; }
    .form-grid    { grid-template-columns: 1fr !important; }
  }
  @media (max-width: 480px) {
    .modal-inner       { padding: 20px 16px !important; }
    .modal-header      { padding: 18px 18px 14px !important; }
    .modal-body        { padding: 18px 18px !important; }
    .modal-footer-wrap { padding: 12px 18px 18px !important; }
  }
`

const fmtCOP = (v) => `$${Number(v || 0).toLocaleString('es-CO')}`

// Selector de la venta a la que se liga una compra de domicilio.
// Busca en el servidor (con debounce) y descarta respuestas viejas.
function SelectorVentaDomicilio({ value, onChange, disabled }) {
  const [q, setQ] = useState('')
  const [lista, setLista] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const reqRef = useRef(0)

  useEffect(() => {
    if (value) return undefined
    const id = ++reqRef.current
    const t = setTimeout(async () => {
      setCargando(true); setError('')
      try {
        const res = await getVentasConDomicilio(1, 20, q, true)
        if (id !== reqRef.current) return
        setLista(res.data?.datos ?? [])
      } catch (err) {
        if (id !== reqRef.current) return
        setError(err.response?.data?.mensaje || err.response?.data?.error || 'No se pudieron cargar las ventas.')
      } finally {
        if (id === reqRef.current) setCargando(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [q, value])

  if (value) {
    return (
      <div className="py-2.5 px-3.5" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f5f3ff', border: '1.5px solid #ddd6fe', borderRadius: '10px' }}>
        <Bike size={16} color="#7c3aed" style={{ flexShrink: 0 }} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <p className="m-0" style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
            Venta #{String(value.id_venta).padStart(3, '0')} · {value.nombre_cliente || 'Sin cliente'}
          </p>
          {value.valor_domicilio != null && (
            <p className="m-0" style={{ fontSize: '12px', color: '#64748b' }}>
              Domicilio cobrado {fmtCOP(value.valor_domicilio)}
              {value.domicilio_pendiente_compra != null && ` · falta pagar ${fmtCOP(value.domicilio_pendiente_compra)}`}
            </p>
          )}
        </div>
        {!disabled && (
          <button type="button" onClick={() => onChange(null)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#7c3aed', fontFamily: 'inherit' }}>
            Cambiar
          </button>
        )}
      </div>
    )
  }

  return (
    <div>
      <div style={{ position: 'relative' }}>
        <Search size={15} color="#cbd5e1" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar venta por cliente o número..."
          style={{ width: '100%', boxSizing: 'border-box', padding: '11px 16px 11px 40px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', color: '#0f172a', background: '#fafafa', outline: 'none', fontFamily: 'inherit' }} />
      </div>
      <div style={{ marginTop: '6px', maxHeight: '160px', overflowY: 'auto', border: '1px solid #f1f5f9', borderRadius: '10px', opacity: cargando ? 0.6 : 1 }}>
        {error ? (
          <p className="m-0 p-3" style={{ fontSize: '12px', color: '#e11d48' }}>{error}</p>
        ) : lista.length === 0 ? (
          <p className="m-0 p-3" style={{ fontSize: '12px', color: '#94a3b8' }}>
            {cargando ? 'Buscando...' : 'No hay ventas con domicilio pendiente de pagar.'}
          </p>
        ) : lista.map(v => (
          <button key={v.id_venta} type="button" onClick={() => onChange(v)}
            className="py-2 px-3" style={{ display: 'flex', width: '100%', justifyContent: 'space-between', gap: '8px', background: 'white', border: 'none', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
            <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: 600 }}>
              #{String(v.id_venta).padStart(3, '0')} · {v.nombre_cliente || 'Sin cliente'}
            </span>
            <span style={{ fontSize: '12px', color: '#7c3aed', fontWeight: 600, whiteSpace: 'nowrap' }}>
              Falta {fmtCOP(v.domicilio_pendiente_compra)}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

// `ventaFija`: venta ya elegida (botón de moto en Ventas). Bloquea la categoría en
// "domicilio" y la venta; el monto sugerido es lo que falta por pagar.
export default function ModalCompra({ compra, proveedores, ventaFija = null, onClose, onGuardar }) {
  const { cuentas, cargado: cuentasCargadas, cargarCuentas } = useMediosPagoStore()

  const [form, setForm] = useState({
    id_proveedor: compra?.id_proveedor || '',
    descripcion: compra?.descripcion || '',
    costo_total: compra?.costo_total || '',
    fecha_compra: compra?.fecha_compra
      ? compra.fecha_compra.slice(0, 10)
      : new Date().toISOString().slice(0, 10),
  })

  const [categoria, setCategoria] = useState(
    ventaFija ? 'domicilio' : (compra?.categoria === 'domicilio' ? 'domicilio' : 'insumo'),
  )
  const [ventaSel, setVentaSel] = useState(() => {
    if (ventaFija) return ventaFija
    if (compra?.categoria === 'domicilio' && compra?.venta_id) {
      return { id_venta: compra.venta_id, nombre_cliente: compra.venta_cliente, valor_domicilio: null, domicilio_pendiente_compra: null }
    }
    return null
  })
  const esDomicilio = categoria === 'domicilio'
  // Monto sugerido (lo que falta por pagar): solo se aplica si el usuario no lo escribió.
  const costoTocadoRef = useRef(Boolean(compra))
  const sugerirDesdeVenta = (v) => {
    if (!v || costoTocadoRef.current) return
    const falta = Number(v.domicilio_pendiente_compra)
    setForm(prev => ({
      ...prev,
      costo_total: falta > 0 ? falta : prev.costo_total,
      descripcion: prev.descripcion || `Domicilio venta #${v.id_venta}`,
    }))
  }
  useEffect(() => {
    if (ventaFija) sugerirDesdeVenta(ventaFija)
  }, [ventaFija])

  const elegirVenta = (v) => {
    setVentaSel(v)
    sugerirDesdeVenta(v)
    setErrForm(null)
  }

  // Medio de pago separado del resto del formulario.
  const [medio, setMedio] = useState(() => {
    if (compra?.medio_pago !== 'transferencia') {
      return { medio_pago: 'efectivo', medio_pago_id: null }
    }
    const idOriginal = compra?.medio_pago_id ?? null
    const existe = idOriginal != null && cuentas.some(c => Number(c.id) === Number(idOriginal))
    // Cuenta de sistema o inactiva: se deja sin cuenta (histórico).
    if (cuentasCargadas && !existe) return { medio_pago: 'transferencia', medio_pago_id: null }
    return { medio_pago: 'transferencia', medio_pago_id: idOriginal }
  })
  const [guardando, setGuardando] = useState(false)
  const [errForm, setErrForm] = useState(null)
  const [errorMedio, setErrorMedio] = useState('')
  // Evita que la normalización del histórico pise una elección del usuario.
  const medioTocadoRef = useRef(false)

  useEffect(() => {
    cargarCuentas()
  }, [cargarCuentas])

  const esTransferenciaOriginal = compra?.medio_pago === 'transferencia'
  const idOriginal = compra?.medio_pago_id ?? null
  const cuentaAsignable =
    idOriginal != null && cuentas.some(c => Number(c.id) === Number(idOriginal))
  // Cuenta de sistema "sin asignar" o cuenta ahora inactiva. Mientras las
  // cuentas no hayan cargado solo se puede afirmar si la compra no trae id.
  const esHistorico =
    Boolean(compra) &&
    esTransferenciaOriginal &&
    !cuentaAsignable &&
    (idOriginal == null || cuentasCargadas)

  useEffect(() => {
    if (!esHistorico || medioTocadoRef.current) return
    setMedio({ medio_pago: 'transferencia', medio_pago_id: null })
  }, [esHistorico])

  const cambiarMedio = (value) => {
    medioTocadoRef.current = true
    setMedio(value)
    if (errorMedio) setErrorMedio('')
  }

  const handleChange = (e) => {
    if (e.target.name === 'costo_total') costoTocadoRef.current = true
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleGuardar = async () => {
    if (!form.id_proveedor) { setErrForm('Selecciona un proveedor.'); return }
    if (!form.costo_total || isNaN(Number(form.costo_total)) || Number(form.costo_total) <= 0) {
      setErrForm('Ingresa un costo total válido.'); return
    }
    if (esDomicilio && !ventaSel?.id_venta) {
      setErrForm('Selecciona la venta a la que corresponde el domicilio.'); return
    }
    if (!medioPagoValido(medio, esHistorico)) {
      setErrorMedio('Selecciona la cuenta de transferencia.'); return
    }
    setGuardando(true); setErrForm(null); setErrorMedio('')
    try {
      await onGuardar(
        {
          ...form,
          id_proveedor: Number(form.id_proveedor),
          costo_total: Number(form.costo_total),
          categoria,
          venta_id: esDomicilio ? Number(ventaSel.id_venta) : null,
        },
        medio,
      )
      onClose()
    } catch (err) {
      setErrForm(
        err.response?.data?.mensaje ||
        err.response?.data?.error ||
        'Error al guardar la compra.'
      )
    } finally { setGuardando(false) }
  }

  const inputBase = {
    width: '100%', boxSizing: 'border-box', padding: '11px 16px 11px 40px',
    border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px',
    color: '#0f172a', background: '#fafafa', outline: 'none', transition: 'all 0.15s', fontFamily: 'inherit'
  }
  const focusIn = (e) => { e.target.style.border = '1.5px solid #5842ff'; e.target.style.background = '#ffffff' }
  const focusOut = (e) => { e.target.style.border = '1.5px solid #e2e8f0'; e.target.style.background = '#fafafa' }

  return (
    <div className="p-4" style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <style>{estilosModal}</style>
      <div className="modal-inner modal-card" style={{ background: '#ffffff', borderRadius: '20px', width: '100%', maxWidth: '480px', boxShadow: '0 24px 64px rgba(0,0,0,0.14)', fontFamily: "'Montserrat','Poppins',sans-serif" }}>

        {/* Header */}
        <div className="modal-header pt-6 pr-7 pb-5 pl-7" style={{ borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(88,66,255,0.08)', border: '1px solid rgba(88,66,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShoppingBag size={20} color="#5842ff" />
            </div>
            <div>
              <p className="m-0" style={{ fontWeight: 700, fontSize: '17px', color: '#0f172a' }}>
                {compra ? 'Editar Compra' : 'Nueva Compra'}
              </p>
              <p className="mt-0.5 mr-0 mb-0 ml-0" style={{ fontSize: '13px', color: '#94a3b8' }}>
                {compra ? 'Modifica los datos de la compra' : 'Registra una nueva adquisición'}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <X size={15} color="#94a3b8" />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body py-6 px-7" style={{ display: 'flex', flexDirection: 'column', gap: '16px', minHeight: 0 }}>

          {/* Categoría */}
          <div>
            <label className="mb-1.5" style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Categoría <span style={{ color: '#f43f5e' }}>*</span>
            </label>
            <div role="radiogroup" aria-label="Categoría de la compra" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { v: 'insumo', t: 'Insumo', Icon: ShoppingBag },
                { v: 'domicilio', t: 'Domicilio', Icon: Bike },
              ].map((op) => {
                const { v, t } = op
                const Icon = op.Icon
                const activo = categoria === v
                return (
                  <button key={v} type="button" role="radio" aria-checked={activo}
                    disabled={Boolean(ventaFija)}
                    onClick={() => { setCategoria(v); setErrForm(null) }}
                    className="py-2.5 px-3"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, fontFamily: 'inherit', cursor: ventaFija ? 'not-allowed' : 'pointer', border: activo ? '1.5px solid #5842ff' : '1.5px solid #e2e8f0', background: activo ? 'rgba(88,66,255,0.08)' : 'white', color: activo ? '#5842ff' : '#64748b', opacity: ventaFija && !activo ? 0.5 : 1 }}>
                    <Icon size={16} /> {t}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Venta (solo domicilio) */}
          {esDomicilio && (
            <div>
              <label className="mb-1.5" style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Venta del domicilio <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <SelectorVentaDomicilio value={ventaSel} onChange={elegirVenta} disabled={Boolean(ventaFija)} />
            </div>
          )}

          {/* Proveedor */}
          <div>
            <label className="mb-1.5" style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Proveedor <span style={{ color: '#f43f5e' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <Truck size={15} color="#cbd5e1" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <ChevronDown size={14} color="#cbd5e1" style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <select name="id_proveedor" value={form.id_proveedor} onChange={handleChange}
                style={{ ...inputBase, appearance: 'none', cursor: 'pointer', paddingRight: '36px' }}
                onFocus={focusIn} onBlur={focusOut}>
                <option value="">Seleccionar proveedor...</option>
                {proveedores.map(p => (
                  <option key={p.id_proveedor} value={p.id_proveedor}>{p.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="mb-1.5" style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {esDomicilio ? 'Descripción' : 'Descripción / Insumos'}
            </label>
            <div style={{ position: 'relative' }}>
              <FileText size={15} color="#cbd5e1" style={{ position: 'absolute', left: '14px', top: '14px', pointerEvents: 'none' }} />
              <textarea name="descripcion" value={form.descripcion} onChange={handleChange}
                placeholder={esDomicilio ? 'Ej: Pago al domiciliario' : '¿Qué se compró? Ej: Insumos, empaques...'} rows={2}
                style={{ ...inputBase, resize: 'none', lineHeight: '1.5' }}
                onFocus={focusIn} onBlur={focusOut} />
            </div>
          </div>

          {/* Costo + Fecha */}
          <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label className="mb-1.5" style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Costo Total <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <DollarSign size={15} color="#cbd5e1" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input type="number" inputMode="numeric" step="1" name="costo_total" value={form.costo_total} onChange={handleChange}
                  placeholder="0" min="0" style={inputBase} onFocus={focusIn} onBlur={focusOut} />
              </div>
            </div>
            <div>
              <label className="mb-1.5" style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Fecha de Compra
              </label>
              <div style={{ position: 'relative' }}>
                <Calendar size={15} color="#cbd5e1" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input type="date" name="fecha_compra" value={form.fecha_compra} onChange={handleChange}
                  style={inputBase} onFocus={focusIn} onBlur={focusOut} />
              </div>
            </div>
          </div>
          {/* Medio de pago */}
          <div>
            <label className="mb-1.5" style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Medio de pago <span style={{ color: '#f43f5e' }}>*</span>
            </label>
            {esHistorico && (
              <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 6px' }}>
                Cuenta actual:{' '}
                <strong style={{ color: '#0f172a' }}>
                  {compra?.medio_pago_nombre || '—'}
                </strong>
              </p>
            )}
            <MedioPagoSelector
              value={medio}
              onChange={cambiarMedio}
              disabled={guardando}
              error={errorMedio}
              permitirHistorico={esHistorico}
            />
          </div>


          <div className="py-3 px-3.5" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '10px' }}>
            <Info size={15} color="#94a3b8" style={{ flexShrink: 0 }} />
            <p className="m-0" style={{ fontSize: '12px', color: '#64748b' }}>La compra se asociará al corte activo automáticamente.</p>
          </div>

          {errForm && (
            <div className="py-3 px-3.5" style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: '#fff1f2', border: '1.5px solid #fecdd3', borderRadius: '10px' }}>
              <AlertTriangle size={15} color="#f43f5e" className="mt-0" style={{ flexShrink: 0 }} />
              <p className="m-0" style={{ fontSize: '13px', color: '#e11d48' }}>{errForm}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer modal-footer-wrap safe-bottom pt-4 pr-7 pl-7" style={{ borderTop: '1px solid #f1f5f9', display: 'flex', gap: '10px', flexShrink: 0 }}>
          <button onClick={onClose} className="p-2.5" style={{ flex: 1, borderRadius: '10px', border: '1.5px solid #e2e8f0', background: 'white', fontSize: '14px', fontWeight: 600, color: '#64748b', cursor: 'pointer', fontFamily: 'inherit' }}>
            Cancelar
          </button>
          <button onClick={handleGuardar} disabled={guardando}
            className="p-2.5" style={{ flex: 1, borderRadius: '10px', border: 'none', background: guardando ? '#a5b4fc' : '#5842ff', color: 'white', fontSize: '14px', fontWeight: 600, cursor: guardando ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px' }}>
            <CheckCircle2 size={15} />
            {guardando ? 'Guardando...' : compra ? 'Guardar Cambios' : 'Crear Compra'}
          </button>
        </div>
      </div>
    </div>
  )
}
