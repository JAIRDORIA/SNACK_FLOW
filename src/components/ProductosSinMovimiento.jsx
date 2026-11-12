import { useEffect, useState } from 'react'
import { PackageX, Info } from 'lucide-react'
import useSinMovimientoStore from '@/store/useSinMovimientoStore'

const OPCIONES_DIAS = [7, 15, 30, 60, 90]

const estilos = `
  @keyframes psm-fade-up { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes psm-pulse { 0%, 100% { opacity: .45; } 50% { opacity: .9; } }
  .psm-card { animation: psm-fade-up .5s ease-out both; }
  .psm-fill { transition: width .8s cubic-bezier(.22,1,.36,1); }
  .psm-skel { animation: psm-pulse 1.2s ease-in-out infinite; }
  @media (prefers-reduced-motion: reduce) {
    .psm-card, .psm-skel { animation: none; }
    .psm-fill { transition: none; }
  }
`

const txtDias = (n) => `${n} ${n === 1 ? 'día' : 'días'}`

export default function ProductosSinMovimiento() {
  const { dias, datos, loading, error, fetchSinMovimiento } = useSinMovimientoStore()
  const [montado, setMontado] = useState(false)   // anima las barras desde 0

  useEffect(() => {
    fetchSinMovimiento()
    const raf = requestAnimationFrame(() => setMontado(true))
    return () => cancelAnimationFrame(raf)
  }, [])   // eslint-disable-line react-hooks/exhaustive-deps

  const productos = datos?.productos ?? []
  const maxDias = Math.max(1, ...productos.map(p => p.dias_sin_venta || 0))
  const primeraCarga = loading && !datos
  const sinDatos = !primeraCarga && (error || productos.length === 0)
  const total = datos?.total ?? 0

  return (
    <div className="psm-card" style={{ background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', padding: 'clamp(16px, 2.5vw, 28px)', marginTop: 'clamp(12px, 2vw, 24px)', display: 'flex', flexDirection: 'column' }}>
      <style>{estilos}</style>

      {/* encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0 }}>
          <h2 className="m-0" style={{ fontSize: 'clamp(16px, 2vw, 20px)', fontWeight: 600, color: '#1f2937' }}>
            Productos sin movimiento
          </h2>
          <p className="mt-1.5 mb-0 mx-0" style={{ fontSize: '13px', color: '#9ca3af' }}>
            Referencias con stock sin ventas en el periodo{total > 5 ? ` · ${total} en total` : ''}
          </p>
        </div>
        <div>
          <label htmlFor="psm-dias" style={{ display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#9ca3af' }}>
            Sin ventas en
          </label>
          <select
            id="psm-dias"
            value={dias}
            onChange={e => fetchSinMovimiento(Number(e.target.value))}
            className="py-2 px-3"
            style={{ border: '1px solid #e2e8f0', borderRadius: '8px', background: '#ffffff', color: '#5842ff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}
          >
            {OPCIONES_DIAS.map(n => <option key={n} value={n}>{n} días</option>)}
          </select>
        </div>
      </div>

      {/* lista */}
      <div style={{ marginTop: '20px', flex: 1, opacity: loading && datos ? 0.6 : 1, transition: 'opacity .2s' }}>
        {primeraCarga ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {[90, 75, 60, 50, 40].map((w, i) => (
              <div key={i} className="psm-skel" style={{ height: 12, width: `${w}%`, background: '#e5e7eb', borderRadius: 999, animationDelay: `${i * 80}ms` }} />
            ))}
          </div>
        ) : sinDatos ? (
          <div style={{ minHeight: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#9ca3af', textAlign: 'center' }}>
            <PackageX size={32} />
            <p className="m-0" style={{ fontSize: '14px' }}>{error || `Todos los productos con stock se vendieron en los últimos ${dias} días`}</p>
            {error && (
              <button onClick={() => fetchSinMovimiento(dias)}
                className="py-1.5 px-3" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff', color: '#5842ff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Reintentar
              </button>
            )}
          </div>
        ) : (
          <ul className="m-0 p-0" style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {productos.map((p, i) => {
              const pct = Math.max(((p.dias_sin_venta || 0) / maxDias) * 100, 6)
              return (
                <li key={p.id}
                  title={`${p.nombre}: ${p.stock_unidades} u. en stock · ${p.nunca_vendido ? 'nunca vendido' : `última venta ${p.ultima_venta}`}`}
                  style={{ display: 'grid', gridTemplateColumns: 'minmax(90px, 32%) 1fr auto', alignItems: 'center', gap: '12px' }}>
                  <div style={{ minWidth: 0 }}>
                    <p className="m-0" style={{ fontSize: '13px', color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.nombre}</p>
                    <p className="m-0" style={{ fontSize: '11px', color: '#9ca3af' }}>
                      {p.nunca_vendido ? 'Nunca vendido · ' : ''}{p.stock_unidades} u. en stock
                    </p>
                  </div>
                  <div style={{ height: 10, background: '#f1f0fb', borderRadius: 999, overflow: 'hidden' }}>
                    <div className="psm-fill" style={{ height: '100%', width: montado ? `${pct}%` : '0%', borderRadius: 999, background: 'linear-gradient(90deg, #a59bff 0%, #5842ff 100%)', transitionDelay: montado ? `${i * 60}ms` : '0ms' }} />
                  </div>
                  <span style={{ minWidth: 56, textAlign: 'right', fontSize: '13px', fontWeight: 700, color: '#5842ff' }}>{txtDias(p.dias_sin_venta)}</span>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* aviso */}
      {!sinDatos && !primeraCarga && (
        <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '8px', background: '#f1efff', borderRadius: '10px', padding: '10px 14px', color: '#4a38d6', fontSize: '12px' }}>
          <Info size={16} style={{ flexShrink: 0 }} />
          <span>Estos productos inmovilizan inventario. Considera promociones o reducir su producción.</span>
        </div>
      )}
    </div>
  )
}
