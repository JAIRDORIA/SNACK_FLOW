import { useEffect, useState } from 'react'
import { BarChart3 } from 'lucide-react'
import useVentasPorDiaStore from '@/store/useVentasPorDiaStore'
import { formatoCompacto, formatoMoneda } from '@/utils/formatoCifras'

// $1,42 M · $890 K · $500 (formatoCompacto cubre desde millones hacia arriba)
const fmtMonto = (v) => {
  const n = Number(v) || 0
  if (Math.abs(n) >= 1_000_000) return `$${formatoCompacto(n)}`
  if (Math.abs(n) >= 1_000) return `$${Math.round(n / 1_000)} K`
  return `$${n}`
}

const fmtCompleto = (v) => `$${formatoMoneda(v)}`

const ALTO_BARRAS = 200   // px del área de barras (arriba hay espacio reservado para el tooltip)

const estilos = `
  @keyframes vpd-fade-up { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes vpd-tip { from { opacity: 0; transform: translate(-50%, 6px) scale(.92); } to { opacity: 1; transform: translate(-50%, 0) scale(1); } }
  @keyframes vpd-pulse { 0%, 100% { opacity: .45; } 50% { opacity: .9; } }
  .vpd-card { animation: vpd-fade-up .5s ease-out both; }
  .vpd-bar { transition: height .8s cubic-bezier(.22,1,.36,1), filter .2s, transform .2s; transform-origin: bottom; }
  .vpd-col:hover .vpd-bar { filter: brightness(1.08); transform: scaleX(1.04); }
  .vpd-tip { animation: vpd-tip .18s ease-out both; }
  .vpd-skel { animation: vpd-pulse 1.2s ease-in-out infinite; }
  @media (prefers-reduced-motion: reduce) {
    .vpd-card, .vpd-tip, .vpd-skel { animation: none; }
    .vpd-bar { transition: none; }
  }
`

export default function VentasPorDiaSemana() {
  const { semanas, datos, loading, error, fetchVentasPorDia } = useVentasPorDiaStore()
  const [activo, setActivo] = useState(null)
  const [montado, setMontado] = useState(false)   // para animar las barras desde 0

  useEffect(() => {
    fetchVentasPorDia()
    const raf = requestAnimationFrame(() => setMontado(true))
    return () => cancelAnimationFrame(raf)
  }, [])   // eslint-disable-line react-hooks/exhaustive-deps

  const dias = datos?.dias ?? []
  const mejor = datos?.mejor_dia ?? null
  const max = Math.max(0, ...dias.map(d => d.total || 0))
  const primeraCarga = loading && !datos
  const sinDatos = !primeraCarga && (error || dias.length === 0)

  const subtitulo = `Compara qué días concentran más pedidos · ${semanas === 1 ? 'última semana' : `últimas ${semanas} semanas`}`

  return (
    <div className="vpd-card" style={{ background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', padding: 'clamp(16px, 2.5vw, 28px)', marginTop: 'clamp(12px, 2vw, 24px)' }}>
      <style>{estilos}</style>

      {/* encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0 }}>
          <h2 className="m-0" style={{ fontSize: 'clamp(16px, 2vw, 20px)', fontWeight: 600, color: '#1f2937' }}>
            Ventas por día de la semana
          </h2>
          <p className="mt-1.5 mb-0 mx-0" style={{ fontSize: '13px', color: '#9ca3af' }}>{subtitulo}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <label htmlFor="vpd-semanas" style={{ display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#9ca3af' }}>
              Últimas semanas
            </label>
            <select
              id="vpd-semanas"
              value={semanas}
              onChange={e => { setActivo(null); fetchVentasPorDia(Number(e.target.value)) }}
              className="py-2 px-3"
              style={{ border: '1px solid #e2e8f0', borderRadius: '8px', background: '#ffffff', color: '#475569', fontSize: '13px', fontWeight: 500, cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                <option key={n} value={n}>{n === 1 ? '1 semana' : `${n} semanas`}</option>
              ))}
            </select>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p className="m-0" style={{ fontSize: '12px', color: '#9ca3af' }}>Mejor día</p>
            <p className="mt-1 mb-0 mx-0" style={{ fontSize: 'clamp(15px, 2vw, 18px)', fontWeight: 700, color: '#5842ff' }}>
              {mejor ? `${mejor.nombre} · ${fmtCompleto(mejor.total)}` : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* gráfica */}
      <div style={{ position: 'relative', marginTop: '16px', paddingTop: '52px', opacity: loading && datos ? 0.6 : 1, transition: 'opacity .2s' }}>
        {primeraCarga ? (
          <div style={{ height: ALTO_BARRAS, display: 'flex', alignItems: 'flex-end', gap: 'clamp(6px, 1.5vw, 20px)', padding: '0 clamp(8px, 2vw, 32px)' }}>
            {[45, 60, 40, 70, 85, 100, 35].map((h, i) => (
              <div key={i} className="vpd-skel" style={{ flex: 1, height: `${h}%`, background: '#e5e7eb', borderRadius: '10px 10px 0 0', animationDelay: `${i * 80}ms` }} />
            ))}
          </div>
        ) : sinDatos ? (
          <div style={{ height: ALTO_BARRAS, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#9ca3af', textAlign: 'center' }}>
            <BarChart3 size={32} />
            <p className="m-0" style={{ fontSize: '14px' }}>{error || 'Sin datos para mostrar'}</p>
            {error && (
              <button onClick={() => fetchVentasPorDia(semanas)}
                className="py-1.5 px-3" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff', color: '#5842ff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Reintentar
              </button>
            )}
          </div>
        ) : (
          <>
            {/* líneas guía */}
            {[0, 50, 100].map(p => (
              <div key={p} style={{ position: 'absolute', left: 0, right: 0, bottom: `${(ALTO_BARRAS * p) / 100 + 28}px`, borderTop: `1px solid ${p === 0 ? '#e5e7eb' : '#f3f4f6'}` }} />
            ))}
            <div style={{ display: 'flex', gap: 'clamp(6px, 1.5vw, 20px)', padding: '0 clamp(8px, 2vw, 32px)', position: 'relative' }}>
              {dias.map((d, i) => {
                const esMejor = mejor && d.dia === mejor.dia
                const pct = max > 0 ? Math.max((d.total / max) * 100, d.total > 0 ? 4 : 1.5) : 1.5
                const alto = montado ? `${pct}%` : '0%'
                return (
                  <div key={d.dia} className="vpd-col"
                    onMouseEnter={() => setActivo(d.dia)} onMouseLeave={() => setActivo(null)}
                    onFocus={() => setActivo(d.dia)} onBlur={() => setActivo(null)}
                    onClick={() => setActivo(a => (a === d.dia ? null : d.dia))}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setActivo(a => (a === d.dia ? null : d.dia))
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`${d.nombre}: ${fmtCompleto(d.total)}, ${d.cantidad} ${d.cantidad === 1 ? 'venta' : 'ventas'}`}
                    style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                    <div style={{ position: 'relative', height: ALTO_BARRAS, width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                      {activo !== d.dia && (
                        <span aria-hidden="true" style={{ position: 'absolute', left: '50%', bottom: `calc(${pct}% + 6px)`, transform: 'translateX(-50%)', fontSize: '11px', fontWeight: 600, color: esMejor ? '#5842ff' : '#6b7280', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
                          {fmtMonto(d.total)}
                        </span>
                      )}
                      {activo === d.dia && (
                        <div className="vpd-tip" style={{ position: 'absolute', left: '50%', bottom: `calc(${pct}% + 8px)`, background: '#1f2437', color: 'white', borderRadius: '8px', padding: '6px 12px', textAlign: 'center', whiteSpace: 'nowrap', zIndex: 5, boxShadow: '0 6px 16px rgba(0,0,0,0.2)', pointerEvents: 'none' }}>
                          <p className="m-0" style={{ fontSize: '12px', fontWeight: 700 }}>{fmtCompleto(d.total)}</p>
                          <p className="m-0" style={{ fontSize: '10px', color: '#cbd5e1' }}>{d.cantidad} {d.cantidad === 1 ? 'venta' : 'ventas'}</p>
                        </div>
                      )}
                      <div className="vpd-bar" style={{
                        width: 'min(56px, 80%)', height: alto, borderRadius: '10px 10px 4px 4px',
                        transitionDelay: montado ? `${i * 60}ms` : '0ms',
                        background: esMejor ? 'linear-gradient(180deg, #7c6cff 0%, #5842ff 100%)' : 'linear-gradient(180deg, #a59bff 0%, #8577ee 100%)',
                        boxShadow: esMejor ? '0 8px 20px rgba(88,66,255,0.35)' : 'none',
                      }} />
                    </div>
                    <span style={{ marginTop: '10px', fontSize: '12px', fontWeight: 600, color: esMejor ? '#5842ff' : '#6b7280' }}>{d.nombre}</span>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
