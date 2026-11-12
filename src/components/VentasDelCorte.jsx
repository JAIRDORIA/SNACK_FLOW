import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react'
import useSerieDiariaStore from '@/store/useSerieDiariaStore'
import { formatoCompacto, formatoMoneda } from '@/utils/formatoCifras'

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const ALTO = 220          // alto del área de dibujo (sin eje X)
const TOP_PAD = 14        // espacio superior para que el punto más alto no se corte
const ALTO_EJE_X = 30
const DIAS_VISIBLES = 7

// "2026-11-05" -> "5 nov."  (sin new Date: la fecha ya viene en hora Colombia)
const fechaCorta = (fecha) => {
  const partes = String(fecha || '').split('-')
  const dia = Number(partes[2])
  const mes = Number(partes[1])
  if (!dia || !mes) return fecha || ''
  return `${dia} ${MESES[mes - 1]}.`
}

const fmtEjeY = (valor) => {
  if (valor === 0) return '$0'
  if (Math.abs(valor) >= 1_000_000) return `$${formatoCompacto(valor)}`
  if (Math.abs(valor) >= 1_000) {
    const miles = valor / 1_000
    return `$${formatoMoneda(miles, Number.isInteger(miles) ? 0 : 1)}k`
  }
  return `$${formatoMoneda(valor)}`
}

// Paso "bonito" para que el eje tenga 4 intervalos (5 marcas) y el pico quede dentro.
const pasoBonito = (bruto) => {
  const exp = Math.floor(Math.log10(bruto))
  const base = 10 ** exp
  const f = bruto / base
  const nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : f <= 7.5 ? 7.5 : 10
  return nf * base
}

const SIN_DIAS = []

const yPara = (valor, techo) => {
  const ratio = Math.min(1, Math.max(0, (Number(valor) || 0) / techo))
  return TOP_PAD + (1 - ratio) * (ALTO - TOP_PAD - 6)
}

function useReducedMotion() {
  const [reducido, setReducido] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const alCambiar = () => setReducido(mq.matches)
    mq.addEventListener?.('change', alCambiar)
    return () => mq.removeEventListener?.('change', alCambiar)
  }, [])

  return reducido
}

function useCountUp(valor, reducido) {
  const [animado, setAnimado] = useState(valor)
  const anterior = useRef(valor)

  useEffect(() => {
    if (reducido) {
      anterior.current = valor
      const t = setTimeout(() => setAnimado(valor), 0)
      return () => clearTimeout(t)
    }

    const desde = anterior.current
    const hasta = Number(valor) || 0
    if (desde === hasta) return

    let raf
    const inicio = performance.now()
    const duracion = 620

    const tick = (t) => {
      const p = Math.min(1, (t - inicio) / duracion)
      const eased = 1 - (1 - p) ** 3
      const actual = desde + (hasta - desde) * eased
      anterior.current = actual
      setAnimado(actual)
      if (p < 1) raf = requestAnimationFrame(tick)
      else anterior.current = hasta
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [valor, reducido])

  return reducido ? valor : animado
}

const estilos = `
  @keyframes vdc-fade-up { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes vdc-tip { from { opacity: 0; transform: translate(-50%, 4px) scale(.96); } to { opacity: 1; transform: translate(-50%, 0) scale(1); } }
  @keyframes vdc-pulse { 0%, 100% { opacity: .45; } 50% { opacity: .9; } }
  .vdc-card { animation: vdc-fade-up .45s ease-out both; }
  .vdc-tip { animation: vdc-tip .16s ease-out both; }
  .vdc-skel { animation: vdc-pulse 1.2s ease-in-out infinite; }
  .vdc-focus:focus-visible { outline: 2px solid #5842ff; outline-offset: 2px; }
  .vdc-scroll { scrollbar-width: none; -ms-overflow-style: none; scroll-snap-type: x proximity; overscroll-behavior-x: contain; }
  .vdc-scroll::-webkit-scrollbar { display: none; }
  @media (prefers-reduced-motion: reduce) {
    .vdc-card, .vdc-tip, .vdc-skel { animation: none; }
  }
`

export default function VentasDelCorte() {
  const { modo, datos, loading, error, fetchSerieDiaria } = useSerieDiariaStore()

  const [anchoPlot, setAnchoPlot] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [puedeIzq, setPuedeIzq] = useState(false)
  const [puedeDer, setPuedeDer] = useState(false)
  const [activo, setActivo] = useState(null)
  const [fijado, setFijado] = useState(null)
  const [interactuado, setInteractuado] = useState(false)
  const [arrastrando, setArrastrando] = useState(false)
  const [serieAnimada, setSerieAnimada] = useState(null)

  const viewportRef = useRef(null)
  const scrollerRef = useRef(null)
  const dragRef = useRef({ activo: false, startX: 0, startScroll: 0, movido: false })
  const suppressClickRef = useRef(false)

  const reducido = useReducedMotion()
  const totalAnimado = useCountUp(Number(datos?.total) || 0, reducido)

  const dias = datos?.dias ?? SIN_DIAS
  const n = dias.length
  const ancho = anchoPlot || 560
  const anchoDia = ancho / DIAS_VISIBLES
  const anchoTotal = Math.max(n, DIAS_VISIBLES) * anchoDia
  const hayScroll = n > DIAS_VISIBLES
  const medido = anchoPlot > 0
  const serieKey = datos ? `${datos.modo}-${datos.desde}-${datos.hasta}-${n}` : null
  const animado = reducido || serieAnimada === serieKey

  const actualizarScroll = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    setScrollLeft(el.scrollLeft)
    setPuedeIzq(el.scrollLeft > 2)
    setPuedeDer(el.scrollLeft < el.scrollWidth - el.clientWidth - 2)
  }, [])

  const marcarInteraccion = useCallback(() => setInteractuado(true), [])

  // carga inicial (siempre en "Este corte")
  useEffect(() => {
    fetchSerieDiaria('corte')
  }, [])   // eslint-disable-line react-hooks/exhaustive-deps

  // ancho real del viewport (7 días exactos)
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const medir = () => setAnchoPlot(el.clientWidth)
    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // al cambiar de serie: limpiar punto activo e interacción
  useEffect(() => {
    const t = setTimeout(() => {
      setActivo(null)
      setFijado(null)
      setInteractuado(false)
    }, 0)
    return () => clearTimeout(t)
  }, [datos])

  // dibuja la línea y hace el stagger de puntos al entrar la serie
  useEffect(() => {
    if (!serieKey || !medido || reducido) return
    const t = setTimeout(() => setSerieAnimada(serieKey), 50)
    return () => clearTimeout(t)
  }, [serieKey, reducido, medido])

  // abrir siempre en el día más reciente
  useEffect(() => {
    const el = scrollerRef.current
    if (!el || !datos) return
    const raf = requestAnimationFrame(() => {
      el.scrollLeft = el.scrollWidth - el.clientWidth
      actualizarScroll()
    })
    return () => cancelAnimationFrame(raf)
  }, [serieKey, anchoPlot, datos, actualizarScroll])

  // rueda / trackpad: convierte el desplazamiento vertical en horizontal
  useEffect(() => {
    const el = scrollerRef.current
    if (!el || !datos) return

    const onWheel = (e) => {
      const max = el.scrollWidth - el.clientWidth
      if (max <= 0) return
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
      if (Math.abs(delta) < 1) return
      const enInicio = el.scrollLeft <= 0
      const enFin = el.scrollLeft >= max - 1
      if ((delta < 0 && enInicio) || (delta > 0 && enFin)) return
      e.preventDefault()
      el.scrollLeft += delta
      marcarInteraccion()
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [datos, medido, marcarInteraccion])

  const { techo, ticks } = useMemo(() => {
    const valores = dias.map((d) => Number(d.total) || 0)
    const maximo = Math.max(0, ...valores)
    const base = maximo > 0 ? maximo : 100_000
    const paso = pasoBonito(base / 4)
    return {
      techo: paso * 4,
      ticks: [0, 1, 2, 3, 4].map((i) => i * paso),
    }
  }, [dias])

  const puntos = useMemo(
    () => dias.map((d, i) => ({
      ...d,
      x: (i + 0.5) * anchoDia,
      y: yPara(Number(d.total) || 0, techo),
    })),
    [dias, anchoDia, techo]
  )

  const linea = useMemo(() => {
    if (puntos.length === 0) return ''
    if (puntos.length === 1) {
      const p = puntos[0]
      return `M${(p.x - 1).toFixed(2)} ${p.y.toFixed(2)} L${(p.x + 1).toFixed(2)} ${p.y.toFixed(2)}`
    }
    return puntos.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')
  }, [puntos])

  const area = useMemo(() => {
    if (puntos.length < 2) return ''
    const primero = puntos[0]
    const ultimo = puntos[puntos.length - 1]
    return `${linea} L${ultimo.x.toFixed(2)} ${ALTO} L${primero.x.toFixed(2)} ${ALTO} Z`
  }, [puntos, linea])

  const puntoActivo = activo != null ? puntos[activo] : null
  const textoActivo = puntoActivo
    ? `${fechaCorta(puntoActivo.fecha)}: $${formatoMoneda(puntoActivo.total)}, ${puntoActivo.cantidad} ${puntoActivo.cantidad === 1 ? 'venta' : 'ventas'}`
    : ''

  let tooltipLeft = 0
  let tooltipTop = 0
  if (puntoActivo) {
    const x = puntoActivo.x - scrollLeft
    const mitad = 62
    tooltipLeft = Math.min(Math.max(x, mitad + 4), Math.max(mitad + 4, ancho - mitad - 4))
    tooltipTop = puntoActivo.y < 64 ? puntoActivo.y + 14 : puntoActivo.y - 56
    tooltipTop = Math.min(Math.max(tooltipTop, 4), ALTO - 60)
  }

  const activarPunto = (i) => {
    if (suppressClickRef.current) { suppressClickRef.current = false; return }
    setActivo(i)
    setFijado((prev) => (prev === i ? null : i))
  }

  const irAPunto = (i) => {
    const el = scrollerRef.current
    if (!el) return
    const x = (i + 0.5) * anchoDia
    const margen = 10
    const posicion = x - el.scrollLeft
    if (posicion < margen || posicion > el.clientWidth - margen) {
      const destino = Math.max(0, Math.min(x - el.clientWidth / 2, el.scrollWidth - el.clientWidth))
      el.scrollTo({ left: destino, behavior: reducido ? 'auto' : 'smooth' })
    }
  }

  const moverPunto = (siguiente) => {
    if (n === 0) return
    const i = Math.max(0, Math.min(n - 1, siguiente))
    setActivo(i)
    marcarInteraccion()
    irAPunto(i)
  }

  const manejarTeclado = (e) => {
    if (n === 0) return
    const actual = activo == null ? n - 1 : activo

    if (e.key === 'ArrowRight') { e.preventDefault(); moverPunto(actual + 1) }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); moverPunto(actual - 1) }
    else if (e.key === 'Home') { e.preventDefault(); moverPunto(0) }
    else if (e.key === 'End') { e.preventDefault(); moverPunto(n - 1) }
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setActivo(actual)
      setFijado((prev) => (prev === actual ? null : actual))
    } else if (e.key === 'Escape') {
      setFijado(null)
      setActivo(null)
    }
  }

  const paginaScroll = (direccion) => {
    const el = scrollerRef.current
    if (!el) return
    marcarInteraccion()
    el.scrollBy({ left: direccion * el.clientWidth, behavior: reducido ? 'auto' : 'smooth' })
  }

  const onPointerDown = (e) => {
    marcarInteraccion()
    if (e.pointerType === 'touch' || e.button !== 0) return
    const el = scrollerRef.current
    if (!el) return
    dragRef.current = { activo: true, startX: e.clientX, startScroll: el.scrollLeft, movido: false }
    setArrastrando(true)
    el.setPointerCapture?.(e.pointerId)
  }

  const onPointerMove = (e) => {
    if (!dragRef.current.activo) return
    const el = scrollerRef.current
    if (!el) return
    const dx = e.clientX - dragRef.current.startX
    if (Math.abs(dx) > 4) dragRef.current.movido = true
    el.scrollLeft = dragRef.current.startScroll - dx
  }

  const onPointerUp = (e) => {
    if (!dragRef.current.activo) return
    const el = scrollerRef.current
    dragRef.current.activo = false
    setArrastrando(false)
    try { el?.releasePointerCapture?.(e.pointerId) } catch { /* el puntero ya se liberó */ }
    if (dragRef.current.movido) {
      suppressClickRef.current = true
      setTimeout(() => { suppressClickRef.current = false }, 120)
    }
  }

  const cargandoInicial = (loading && !datos) || (datos && !medido)
  const atenuado = loading && datos
  const totalTexto = `$${formatoMoneda(Math.round(totalAnimado))}`
  const opciones = [
    { valor: 'corte', etiqueta: 'Este corte' },
    { valor: 'dias', etiqueta: '30 días' },
  ]

  return (
    <div
      className="vdc-card"
      style={{
        background: 'white',
        borderRadius: '16px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        padding: 'clamp(16px, 2.5vw, 28px)',
        marginTop: 'clamp(12px, 2vw, 24px)',
        height: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <style>{estilos}</style>

      {/* encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ minWidth: '180px', flex: '1 1 200px' }}>
          <h2 className="m-0" style={{ fontSize: 'clamp(17px, 2vw, 20px)', fontWeight: 600, color: '#1f2937' }}>
            Ventas del corte
          </h2>
          <p className="mt-1.5 mb-0 mx-0" style={{ fontSize: '13px', color: '#6b7280' }}>
            Explora cada punto para consultar el ingreso del día
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '14px', flexWrap: 'wrap' }}>
          <div
            role="group"
            aria-label="Rango de la serie de ventas"
            style={{ display: 'inline-flex', padding: '4px', background: '#f1f3f7', border: '1px solid #e9edf3', borderRadius: '12px' }}
          >
            {opciones.map((op) => {
              const seleccionado = modo === op.valor
              return (
                <button
                  key={op.valor}
                  type="button"
                  aria-pressed={seleccionado}
                  onClick={() => { if (!seleccionado) fetchSerieDiaria(op.valor) }}
                  className="vdc-focus"
                  style={{
                    border: 'none',
                    borderRadius: '9px',
                    padding: '0 14px',
                    minHeight: '44px',
                    background: seleccionado ? '#ffffff' : 'transparent',
                    color: seleccionado ? '#5842ff' : '#475569',
                    boxShadow: seleccionado ? '0 1px 3px rgba(15,23,42,0.12)' : 'none',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    transition: reducido ? 'none' : 'background .2s, color .2s, box-shadow .2s',
                  }}
                >
                  {op.etiqueta}
                </button>
              )
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
            <span aria-hidden="true" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#5842ff', flexShrink: 0 }} />
            <span style={{ fontSize: '12.5px', color: '#6b7280' }}>Ventas</span>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#1f2937', minWidth: '58px', textAlign: 'right' }}>
              {totalTexto}
            </span>
          </div>
        </div>
      </div>

      {/* gráfica */}
      <div style={{ display: 'flex', marginTop: '16px', opacity: atenuado ? 0.4 : 1, transition: reducido ? 'none' : 'opacity .2s' }}>
        {/* eje Y fijo */}
        <div style={{ width: '52px', flexShrink: 0, position: 'relative', height: ALTO }}>
          {datos && medido && ticks.map((t) => (
            <span
              key={t}
              style={{
                position: 'absolute',
                top: `${yPara(t, techo) - 7}px`,
                right: '10px',
                fontSize: '11px',
                color: '#6b7280',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {fmtEjeY(t)}
            </span>
          ))}
        </div>

        <div ref={viewportRef} style={{ position: 'relative', flex: 1, minWidth: 0, height: ALTO + ALTO_EJE_X }}>
          {/* rejilla fija */}
          {datos && medido && (
            <div aria-hidden="true" style={{ position: 'absolute', inset: 0, height: ALTO, pointerEvents: 'none' }}>
              {ticks.map((t) => (
                <div
                  key={t}
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: `${yPara(t, techo)}px`,
                    borderTop: `1px solid ${t === 0 ? '#e5e7eb' : '#f1f3f7'}`,
                  }}
                />
              ))}
            </div>
          )}

          {datos && medido && (
            <div
              ref={scrollerRef}
              className="vdc-scroll vdc-focus"
              role="group"
              tabIndex={0}
              aria-label={`Serie de ventas de ${n} ${n === 1 ? 'día' : 'días'}. Usa las flechas izquierda y derecha para explorar cada día.`}
              aria-describedby="vdc-instr"
              aria-busy={loading}
              onScroll={actualizarScroll}
              onKeyDown={manejarTeclado}
              onFocus={(e) => {
                if (!e.currentTarget.matches(':focus-visible')) return
                if (fijado != null) setActivo(fijado)
                else if (activo == null && n > 0) setActivo(n - 1)
              }}
              onBlur={() => setActivo(fijado)}
              onMouseLeave={() => setActivo(fijado)}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onTouchStart={marcarInteraccion}
              style={{
                position: 'absolute',
                inset: 0,
                overflowX: 'auto',
                overflowY: 'hidden',
                cursor: arrastrando ? 'grabbing' : 'grab',
                touchAction: 'pan-x pan-y',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              <div style={{ position: 'relative', width: anchoTotal, height: ALTO + ALTO_EJE_X }}>
                <svg width={anchoTotal} height={ALTO} style={{ display: 'block' }}>
                  <defs>
                    <linearGradient id="vdc-area" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#5842ff" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#5842ff" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {area && (
                    <path
                      d={area}
                      fill="url(#vdc-area)"
                      style={{
                        opacity: animado ? 1 : 0,
                        transition: reducido ? 'none' : 'opacity .35s ease',
                        transitionDelay: reducido ? '0ms' : '650ms',
                      }}
                    />
                  )}

                  {linea && (
                    <path
                      d={linea}
                      fill="none"
                      stroke="#5842ff"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      pathLength="1"
                      style={{
                        strokeDasharray: 1,
                        strokeDashoffset: animado ? 0 : 1,
                        transition: reducido ? 'none' : 'stroke-dashoffset .8s cubic-bezier(.22,1,.36,1)',
                      }}
                    />
                  )}

                  {puntos.map((p, i) => {
                    const esActivo = activo === i
                    const escala = !animado ? 0.4 : esActivo ? 1.5 : 1
                    return (
                      <g
                        key={p.fecha}
                        role="img"
                        aria-label={`${fechaCorta(p.fecha)}: $${formatoMoneda(p.total)}, ${p.cantidad} ${p.cantidad === 1 ? 'venta' : 'ventas'}`}
                      >
                        <rect
                          x={p.x - anchoDia / 2}
                          y={0}
                          width={anchoDia}
                          height={ALTO}
                          fill="transparent"
                          pointerEvents="all"
                          style={{ cursor: 'pointer' }}
                          onMouseEnter={() => { if (!arrastrando) { setActivo(i); marcarInteraccion() } }}
                          onClick={() => activarPunto(i)}
                        />
                        <g
                          style={{
                            opacity: animado ? 1 : 0,
                            transform: `translateY(${animado ? 0 : 6}px)`,
                            transition: reducido ? 'none' : 'opacity .25s ease, transform .25s ease',
                            transitionDelay: reducido ? '0ms' : `${Math.min(i * 45, 540)}ms`,
                            pointerEvents: 'none',
                          }}
                        >
                          {esActivo && (
                            <circle
                              cx={p.x}
                              cy={p.y}
                              r="11"
                              fill="rgba(88,66,255,0.12)"
                              style={{ opacity: animado ? 1 : 0, transition: reducido ? 'none' : 'opacity .18s' }}
                            />
                          )}
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r="5"
                            fill="#ffffff"
                            stroke="#5842ff"
                            strokeWidth="2.5"
                            style={{
                              transform: `scale(${escala})`,
                              transformBox: 'fill-box',
                              transformOrigin: 'center',
                              transition: reducido ? 'none' : 'transform .18s ease',
                            }}
                          />
                        </g>
                      </g>
                    )
                  })}
                </svg>

                {/* eje X: acompaña el scroll */}
                <div style={{ position: 'absolute', top: ALTO, left: 0, width: anchoTotal, height: ALTO_EJE_X, display: 'flex' }} aria-hidden="true">
                  {dias.map((d, i) => (
                    <span
                      key={d.fecha}
                      style={{
                        flex: `0 0 ${anchoDia}px`,
                        textAlign: 'center',
                        paddingTop: '6px',
                        fontSize: '11px',
                        fontWeight: activo === i ? 600 : 500,
                        color: activo === i ? '#5842ff' : '#6b7280',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {fechaCorta(d.fecha)}
                    </span>
                  ))}
                </div>

                {/* puntos de snap (día) */}
                <div aria-hidden="true" style={{ position: 'absolute', inset: 0, display: 'flex', pointerEvents: 'none' }}>
                  {dias.map((d) => (
                    <div key={d.fecha} style={{ flex: `0 0 ${anchoDia}px`, scrollSnapAlign: 'start' }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* máscaras laterales */}
          {datos && medido && puedeIzq && (
            <div aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, width: '34px', height: ALTO, background: 'linear-gradient(to right, #ffffff, rgba(255,255,255,0))', pointerEvents: 'none', zIndex: 4 }} />
          )}
          {datos && medido && puedeDer && (
            <div aria-hidden="true" style={{ position: 'absolute', top: 0, right: 0, width: '34px', height: ALTO, background: 'linear-gradient(to left, #ffffff, rgba(255,255,255,0))', pointerEvents: 'none', zIndex: 4 }} />
          )}

          {/* skeleton / vacío / error */}
          {cargandoInicial && (
            <div aria-hidden="true" style={{ position: 'absolute', inset: 0, height: ALTO + ALTO_EJE_X, display: 'flex', alignItems: 'stretch', gap: '10px', padding: '8px 0' }}>
              <div style={{ flex: 1, position: 'relative', borderRadius: '12px', background: '#f3f4f6', overflow: 'hidden' }}>
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="vdc-skel" style={{ position: 'absolute', left: 0, right: 0, top: `${14 + i * 58}px`, height: '1px', background: '#e5e7eb' }} />
                ))}
                <div className="vdc-skel" style={{ position: 'absolute', left: '8%', right: '8%', bottom: '18px', height: '46%', borderRadius: '12px 12px 0 0', background: 'linear-gradient(180deg, #e9e5ff 0%, #f3f4f6 100%)' }} />
              </div>
            </div>
          )}

          {!cargandoInicial && !datos && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', textAlign: 'center', padding: '0 12px' }}>
              {error ? (
                <>
                  <AlertCircle size={28} color="#b91c1c" aria-hidden="true" />
                  <p className="m-0" style={{ fontSize: '13px', color: '#374151' }}>{error}</p>
                  <button
                    type="button"
                    onClick={() => fetchSerieDiaria(modo)}
                    className="vdc-focus"
                    style={{ marginTop: '2px', minHeight: '44px', padding: '0 16px', border: '1px solid #e2e8f0', borderRadius: '9px', background: '#ffffff', color: '#5842ff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    Reintentar
                  </button>
                </>
              ) : (
                <>
                  <TrendingUp size={30} color="#9ca3af" aria-hidden="true" />
                  <p className="m-0" style={{ fontSize: '13px', color: '#6b7280' }}>Sin ventas en este rango</p>
                </>
              )}
            </div>
          )}

          {/* tooltip */}
          {datos && medido && puntoActivo && (
            <div
              className="vdc-tip"
              style={{
                position: 'absolute',
                left: `${tooltipLeft}px`,
                top: `${tooltipTop}px`,
                background: '#1f2437',
                color: '#ffffff',
                borderRadius: '10px',
                padding: '7px 12px',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                zIndex: 12,
                boxShadow: '0 8px 20px rgba(15,23,42,0.22)',
                pointerEvents: 'none',
              }}
            >
              <p className="m-0" style={{ fontSize: '10.5px', color: '#cbd5e1' }}>{fechaCorta(puntoActivo.fecha)}</p>
              <p className="m-0" style={{ fontSize: '15px', fontWeight: 700 }}>${formatoMoneda(puntoActivo.total)}</p>
            </div>
          )}

          {/* indicador de desplazamiento */}
          {datos && medido && hayScroll && !interactuado && (
            <div
              style={{
                position: 'absolute',
                top: '4px',
                right: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                padding: '5px 8px',
                borderRadius: '999px',
                background: 'rgba(255,255,255,0.94)',
                border: '1px solid #e9edf3',
                boxShadow: '0 2px 6px rgba(15,23,42,0.06)',
                fontSize: '11px',
                color: '#475569',
                pointerEvents: 'none',
                zIndex: 6,
              }}
            >
              Desliza para ver más
              <ChevronRight size={12} aria-hidden="true" />
            </div>
          )}

          {/* chevrons (escritorio) */}
          {datos && medido && hayScroll && (
            <>
              <button
                type="button"
                onClick={() => paginaScroll(-1)}
                disabled={!puedeIzq}
                aria-label="Ver 7 días anteriores"
                className="hidden lg:flex vdc-focus"
                style={{
                  position: 'absolute', top: ALTO / 2 - 22, left: '4px',
                  width: '44px', height: '44px', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '50%', border: '1px solid #e5e7eb', background: '#ffffff',
                  color: '#475569', boxShadow: '0 4px 12px rgba(15,23,42,0.10)',
                  cursor: puedeIzq ? 'pointer' : 'default', opacity: puedeIzq ? 1 : 0.35, zIndex: 8,
                }}
              >
                <ChevronLeft size={19} />
              </button>
              <button
                type="button"
                onClick={() => paginaScroll(1)}
                disabled={!puedeDer}
                aria-label="Ver 7 días siguientes"
                className="hidden lg:flex vdc-focus"
                style={{
                  position: 'absolute', top: ALTO / 2 - 22, right: '4px',
                  width: '44px', height: '44px', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '50%', border: '1px solid #e5e7eb', background: '#ffffff',
                  color: '#475569', boxShadow: '0 4px 12px rgba(15,23,42,0.10)',
                  cursor: puedeDer ? 'pointer' : 'default', opacity: puedeDer ? 1 : 0.35, zIndex: 8,
                }}
              >
                <ChevronRight size={19} />
              </button>
            </>
          )}
        </div>
      </div>

      <span id="vdc-instr" className="sr-only">
        Usa las flechas izquierda y derecha para moverte entre los días, Enter o Espacio para fijar el detalle y Escape para cerrarlo.
      </span>
      <span className="sr-only" aria-live="polite">{textoActivo}</span>
    </div>
  )
}
