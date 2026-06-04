import { useEffect } from 'react'
import { Wallet, TrendingUp, ShoppingCart, DollarSign, CreditCard } from 'lucide-react'
import useDashboardStore from '@/store/useDashboardStore'

export default function Dashboard() {
  const { balance, clientesTop, productosTop, cargando, error, fetchDashboard } = useDashboardStore()

  useEffect(() => {
    fetchDashboard()
  }, [])

  if (cargando) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
      <p style={{ color: '#6b7280', fontSize: '16px' }}>Cargando dashboard...</p>
    </div>
  )

  if (error) return (
    <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px' }}>
      <p style={{ color: '#ef4444' }}>{error}</p>
    </div>
  )

  const statsCards = [
    {
      title: 'Total de Dinero en Caja del corte actual y el proximo',
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
      title: 'Total de Dinero en  Compras',
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

  return (
    <div style={{ background: '#f9fafb', padding: '32px', minHeight: '100vh' }}>

      {/* titulo */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 700,
          color: '#000000',
          margin: 0,
          textTransform: 'uppercase',
          letterSpacing: '0.02em'
        }}>
          Información General del Corte #{balance?.corte_numero ?? '...'}
        </h1>
      </div>

      {/* tarjetas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '16px',
        marginBottom: '32px'
      }}>
        {statsCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div
              key={index}
              style={{
                background: '#1B1D2E',
                borderRadius: '12px',
                padding: '28px 24px',
                cursor: 'default',
                transition: 'all 0.2s',
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
              {/* icono */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{
                  width: '56px', height: '56px',
                  background: 'rgba(19,21,34,0.5)',
                  border: `2px solid ${stat.ringColor}`,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon size={26} color={stat.iconColor} />
                </div>
              </div>

              {/* texto */}
              <p style={{
                color: 'rgba(255,255,255,0.85)',
                fontSize: '18px',
                margin: '0 0 10px 0'
              }}>
                {stat.title}
              </p>
              <p style={{
                color: 'white',
                fontSize: '28px',
                fontWeight: 600,
                margin: 0
              }}>
                ${stat.value.toLocaleString('es-CO')}
              </p>
            </div>
          )
        })}
      </div>

      {/* tablas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px'
      }}>

        {/* productos mas vendidos */}
        <div style={{
          background: 'white',
          borderRadius: '8px',
          border: '2px solid #d1d5db',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '16px 24px',
            borderBottom: '2px solid #d1d5db'
          }}>
            <h2 style={{ fontSize: '18px', margin: 0, color: '#111827' }}>
              Productos Más Vendidos
            </h2>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f9fafb' }}>
              <tr>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>ID</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>Nombre</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>Unidades</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>Ingresos</th>
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
                  <td style={{ padding: '16px 24px', fontSize: '13px', color: '#4f46e5' }}>
                    P{String(p.id).padStart(3, '0')}
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: '13px', color: '#111827' }}>{p.nombre}</td>
                  <td style={{ padding: '16px 24px', fontSize: '13px', color: '#374151' }}>{p.unidades_vendidas}</td>
                  <td style={{ padding: '16px 24px', fontSize: '13px', color: '#374151' }}>
                    ${p.total_ingresos.toLocaleString('es-CO')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* clientes que mas compran */}
        <div style={{
          background: 'white',
          borderRadius: '8px',
          border: '2px solid #d1d5db',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '16px 24px',
            borderBottom: '2px solid #d1d5db'
          }}>
            <h2 style={{ fontSize: '18px', margin: 0, color: '#111827' }}>
              Clientes Que Más Compran
            </h2>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f9fafb' }}>
              <tr>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>ID</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>Nombre</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>Compras</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>Total</th>
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
                  <td style={{ padding: '16px 24px', fontSize: '13px', color: '#4f46e5' }}>
                    C{String(c.id).padStart(3, '0')}
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: '13px', color: '#111827' }}>{c.nombre}</td>
                  <td style={{ padding: '16px 24px', fontSize: '13px', color: '#374151' }}>{c.total_ventas}</td>
                  <td style={{ padding: '16px 24px', fontSize: '13px', color: '#374151' }}>
                    ${c.total_comprado.toLocaleString('es-CO')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}