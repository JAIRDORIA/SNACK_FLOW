import { useEffect, useState, useRef } from 'react'
import { Wallet, TrendingUp, ShoppingCart, DollarSign, CreditCard, ChevronLeft, ChevronRight } from 'lucide-react'
import useDashboardStore from '@/store/useDashboardStore'

export default function Dashboard() {
  const { balance, clientesTop, productosTop, cargando, error, fetchDashboard } = useDashboardStore()
  const [currentSlide, setCurrentSlide] = useState(0)
  const carouselRef = useRef(null)
  const autoSlideRef = useRef(null)

  useEffect(() => {
    fetchDashboard()
  }, [])

  // Auto-slide cada 3 segundos
  useEffect(() => {
    if (typeof window === 'undefined') return

    const isMobile = window.innerWidth < 768
    if (!isMobile) return

    autoSlideRef.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % statsCards.length)
    }, 3000)

    return () => {
      if (autoSlideRef.current) clearInterval(autoSlideRef.current)
    }
  }, [])

  // Pausar auto-slide al interactuar
  const pauseAutoSlide = () => {
    if (autoSlideRef.current) clearInterval(autoSlideRef.current)
  }

  const resumeAutoSlide = () => {
    autoSlideRef.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % statsCards.length)
    }, 3000)
  }

  if (cargando) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
      <div style={{ 
        width: 40, height: 40, 
        border: '3px solid #4f46e5', 
        borderTopColor: 'transparent', 
        borderRadius: '50%', 
        animation: 'spin 0.8s linear infinite' 
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: '#6b7280', fontSize: '16px', marginLeft: '12px' }}>Cargando dashboard...</p>
    </div>
  )

  if (error) return (
    <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px' }}>
      <p style={{ color: '#ef4444' }}>{error}</p>
    </div>
  )

  const statsCards = [
    {
      title: 'Total de Dinero en Caja del corte actual',
      value: balance?.dinero_caja ?? 0,
      icon: Wallet,
      iconColor: '#22d3ee',
      ringColor: 'rgba(34,211,238,0.4)'
    },
    {
      title: 'Total de Dinero en Venta del corte actual',
      value: balance?.total_ventas ?? 0,
      icon: TrendingUp,
      iconColor: '#34d399',
      ringColor: 'rgba(52,211,153,0.4)'
    },
    {
      title: 'Total de Dinero en Compras',
      value: balance?.total_compras ?? 0,
      icon: ShoppingCart,
      iconColor: '#e879f9',
      ringColor: 'rgba(232,121,249,0.4)'
    },
    {
      title: 'Total de Dinero en Efectivo',
      value: balance?.total_efectivo ?? 0,
      icon: DollarSign,
      iconColor: '#fb923c',
      ringColor: 'rgba(251,146,60,0.4)'
    },
    {
      title: 'Dinero en Transferencia',
      value: balance?.total_transferencia ?? 0,
      icon: CreditCard,
      iconColor: '#fb7185',
      ringColor: 'rgba(251,113,133,0.4)'
    }
  ]

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % statsCards.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + statsCards.length) % statsCards.length)
  }

  return (
    <div style={{ background: '#f9fafb', padding: 'clamp(16px, 3vw, 32px)', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* título */}
      <div style={{ marginBottom: 'clamp(16px, 3vw, 32px)' }}>
        <h1 style={{
          fontSize: 'clamp(18px, 4vw, 28px)',
          fontWeight: 700,
          color: '#000000',
          margin: 0,
          textTransform: 'uppercase',
          letterSpacing: '0.02em',
          wordBreak: 'break-word'
        }}>
          Información General del Corte #{balance?.corte_numero ?? '...'}
        </h1>
      </div>

      {/* tarjetas - responsive */}
      <style>{`
        @media (min-width: 1024px) {
          .kpi-grid {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 16px;
          }
          .carousel-controls { display: none; }
          .carousel-dots { display: none; }
        }
        @media (max-width: 1023px) and (min-width: 768px) {
          .kpi-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
          }
          .carousel-controls { display: none; }
          .carousel-dots { display: none; }
        }
        @media (max-width: 767px) {
          .kpi-grid {
            display: block;
            overflow: hidden;
            position: relative;
          }
          .kpi-track {
            display: flex;
            transition: transform 0.4s ease;
          }
          .kpi-card {
            min-width: 100%;
            flex-shrink: 0;
            padding: 0 4px;
          }
          .carousel-controls { 
            display: flex; 
            justify-content: center; 
            gap: 16px; 
            margin-top: 12px; 
          }
          .carousel-dots { 
            display: flex; 
            justify-content: center; 
            gap: 8px; 
            margin-top: 8px; 
          }
        }
      `}</style>

      <div 
        className="kpi-grid" 
        style={{ marginBottom: '32px' }}
        ref={carouselRef}
        onMouseEnter={pauseAutoSlide}
        onMouseLeave={resumeAutoSlide}
        onTouchStart={pauseAutoSlide}
        onTouchEnd={resumeAutoSlide}
      >
        {/* Vista escritorio/tablet: grid normal */}
        <div className="kpi-track-desktop" style={{ display: 'contents' }}>
          {statsCards.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div
                key={index}
                className="kpi-card-desktop"
                style={{
                  background: '#1B1D2E',
                  borderRadius: '12px',
                  padding: 'clamp(16px, 2.5vw, 28px) clamp(12px, 2vw, 24px)',
                  cursor: 'default',
                  transition: 'all 0.2s',
                  display: window.innerWidth < 768 ? 'none' : 'block'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'scale(1.05)'
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{ marginBottom: 'clamp(12px, 2vw, 20px)' }}>
                  <div style={{
                    width: 'clamp(40px, 6vw, 56px)',
                    height: 'clamp(40px, 6vw, 56px)',
                    background: 'rgba(19,21,34,0.5)',
                    border: `2px solid ${stat.ringColor}`,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Icon size={window.innerWidth < 1024 ? 22 : 26} color={stat.iconColor} />
                  </div>
                </div>
                <p style={{
                  color: 'rgba(255,255,255,0.85)',
                  fontSize: 'clamp(13px, 1.8vw, 18px)',
                  margin: '0 0 10px 0'
                }}>
                  {stat.title}
                </p>
                <p style={{
                  color: 'white',
                  fontSize: 'clamp(20px, 3.5vw, 28px)',
                  fontWeight: 600,
                  margin: 0
                }}>
                  ${stat.value.toLocaleString('es-CO')}
                </p>
              </div>
            )
          })}
        </div>

        {/* Vista móvil: carrusel */}
        <div className="kpi-track" style={{ 
          transform: `translateX(-${currentSlide * 100}%)`,
          display: window.innerWidth >= 768 ? 'none' : 'flex'
        }}>
          {statsCards.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div
                key={index}
                className="kpi-card"
                style={{
                  background: '#1B1D2E',
                  borderRadius: '12px',
                  padding: 'clamp(20px, 4vw, 28px) clamp(16px, 3vw, 24px)',
                  cursor: 'default',
                }}
              >
                <div style={{ marginBottom: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: 'rgba(19,21,34,0.5)',
                    border: `2px solid ${stat.ringColor}`,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Icon size={24} color={stat.iconColor} />
                  </div>
                </div>
                <p style={{
                  color: 'rgba(255,255,255,0.85)',
                  fontSize: '15px',
                  margin: '0 0 10px 0'
                }}>
                  {stat.title}
                </p>
                <p style={{
                  color: 'white',
                  fontSize: '24px',
                  fontWeight: 600,
                  margin: 0
                }}>
                  ${stat.value.toLocaleString('es-CO')}
                </p>
              </div>
            )
          })}
        </div>

        {/* Controles del carrusel (solo móvil) */}
        <div className="carousel-controls">
          <button 
            onClick={prevSlide}
            style={{
              background: '#1B1D2E',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}
          >
            <ChevronLeft size={20} color="white" />
          </button>
          <button 
            onClick={nextSlide}
            style={{
              background: '#1B1D2E',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}
          >
            <ChevronRight size={20} color="white" />
          </button>
        </div>

        {/* Dots indicadores */}
        <div className="carousel-dots">
          {statsCards.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                border: 'none',
                background: currentSlide === index ? '#4f46e5' : '#d1d5db',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
            />
          ))}
        </div>
      </div>

      {/* tablas - responsive */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 'clamp(12px, 2vw, 24px)'
      }}>

        {/* productos mas vendidos */}
        <div style={{
          background: 'white',
          borderRadius: '8px',
          border: '2px solid #d1d5db',
          overflow: 'hidden',
          minWidth: 0
        }}>
          <div style={{
            padding: 'clamp(12px, 2vw, 16px) clamp(12px, 2vw, 24px)',
            borderBottom: '2px solid #d1d5db'
          }}>
            <h2 style={{ fontSize: 'clamp(14px, 2vw, 18px)', margin: 0, color: '#111827' }}>
              Productos Más Vendidos
            </h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '400px' }}>
              <thead style={{ background: '#f9fafb' }}>
                <tr>
                  <th style={{ padding: 'clamp(8px, 1.5vw, 12px) clamp(8px, 2vw, 24px)', textAlign: 'left', fontSize: 'clamp(11px, 1.4vw, 13px)', color: '#6b7280', fontWeight: 500 }}>ID</th>
                  <th style={{ padding: 'clamp(8px, 1.5vw, 12px) clamp(8px, 2vw, 24px)', textAlign: 'left', fontSize: 'clamp(11px, 1.4vw, 13px)', color: '#6b7280', fontWeight: 500 }}>Nombre</th>
                  <th style={{ padding: 'clamp(8px, 1.5vw, 12px) clamp(8px, 2vw, 24px)', textAlign: 'left', fontSize: 'clamp(11px, 1.4vw, 13px)', color: '#6b7280', fontWeight: 500 }}>Unidades</th>
                  <th style={{ padding: 'clamp(8px, 1.5vw, 12px) clamp(8px, 2vw, 24px)', textAlign: 'left', fontSize: 'clamp(11px, 1.4vw, 13px)', color: '#6b7280', fontWeight: 500 }}>Ingresos</th>
                </tr>
              </thead>
              <tbody>
                {productosTop.map((p, i) => (
                  <tr
                    key={p.id}
                    style={{ borderTop: '2px solid #e5e7eb' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: 'clamp(10px, 1.5vw, 16px) clamp(8px, 2vw, 24px)', fontSize: 'clamp(11px, 1.4vw, 13px)', color: '#4f46e5' }}>
                      P{String(p.id).padStart(3, '0')}
                    </td>
                    <td style={{ padding: 'clamp(10px, 1.5vw, 16px) clamp(8px, 2vw, 24px)', fontSize: 'clamp(11px, 1.4vw, 13px)', color: '#111827' }}>{p.nombre}</td>
                    <td style={{ padding: 'clamp(10px, 1.5vw, 16px) clamp(8px, 2vw, 24px)', fontSize: 'clamp(11px, 1.4vw, 13px)', color: '#374151' }}>{p.unidades_vendidas}</td>
                    <td style={{ padding: 'clamp(10px, 1.5vw, 16px) clamp(8px, 2vw, 24px)', fontSize: 'clamp(11px, 1.4vw, 13px)', color: '#374151' }}>
                      ${p.total_ingresos.toLocaleString('es-CO')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* clientes que mas compran */}
        <div style={{
          background: 'white',
          borderRadius: '8px',
          border: '2px solid #d1d5db',
          overflow: 'hidden',
          minWidth: 0
        }}>
          <div style={{
            padding: 'clamp(12px, 2vw, 16px) clamp(12px, 2vw, 24px)',
            borderBottom: '2px solid #d1d5db'
          }}>
            <h2 style={{ fontSize: 'clamp(14px, 2vw, 18px)', margin: 0, color: '#111827' }}>
              Clientes Que Más Compran
            </h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '400px' }}>
              <thead style={{ background: '#f9fafb' }}>
                <tr>
                  <th style={{ padding: 'clamp(8px, 1.5vw, 12px) clamp(8px, 2vw, 24px)', textAlign: 'left', fontSize: 'clamp(11px, 1.4vw, 13px)', color: '#6b7280', fontWeight: 500 }}>ID</th>
                  <th style={{ padding: 'clamp(8px, 1.5vw, 12px) clamp(8px, 2vw, 24px)', textAlign: 'left', fontSize: 'clamp(11px, 1.4vw, 13px)', color: '#6b7280', fontWeight: 500 }}>Nombre</th>
                  <th style={{ padding: 'clamp(8px, 1.5vw, 12px) clamp(8px, 2vw, 24px)', textAlign: 'left', fontSize: 'clamp(11px, 1.4vw, 13px)', color: '#6b7280', fontWeight: 500 }}>Compras</th>
                  <th style={{ padding: 'clamp(8px, 1.5vw, 12px) clamp(8px, 2vw, 24px)', textAlign: 'left', fontSize: 'clamp(11px, 1.4vw, 13px)', color: '#6b7280', fontWeight: 500 }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {clientesTop.map((c, i) => (
                  <tr
                    key={c.id}
                    style={{ borderTop: '2px solid #e5e7eb' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: 'clamp(10px, 1.5vw, 16px) clamp(8px, 2vw, 24px)', fontSize: 'clamp(11px, 1.4vw, 13px)', color: '#4f46e5' }}>
                      C{String(c.id).padStart(3, '0')}
                    </td>
                    <td style={{ padding: 'clamp(10px, 1.5vw, 16px) clamp(8px, 2vw, 24px)', fontSize: 'clamp(11px, 1.4vw, 13px)', color: '#111827' }}>{c.nombre}</td>
                    <td style={{ padding: 'clamp(10px, 1.5vw, 16px) clamp(8px, 2vw, 24px)', fontSize: 'clamp(11px, 1.4vw, 13px)', color: '#374151' }}>{c.total_ventas}</td>
                    <td style={{ padding: 'clamp(10px, 1.5vw, 16px) clamp(8px, 2vw, 24px)', fontSize: 'clamp(11px, 1.4vw, 13px)', color: '#374151' }}>
                      ${c.total_comprado.toLocaleString('es-CO')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}