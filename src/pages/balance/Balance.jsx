import { useEffect, useState } from 'react'
import {
  Wallet, CreditCard, DollarSign, TrendingUp, Clock, Calendar, Info, AlertTriangle, Download,
  AlertCircle, CheckCircle2, Loader2, X, Trash2, Search
} from 'lucide-react'
import useBalanceStore from '@/store/useBalanceStore'
import { getVentaDetalle, anularVenta } from '@/api/ventas_api'
import { exportarAExcel } from '@/utils/exportarExcel'

export default function Balance() {
  const {
    balance, historial,
    cargandoBalance, cargandoHistorial, cerrandoCorte, error, exitoCierre,
    fetchBalance, cerrarDetalleCorte, fetchHistorial, cerrarCorteActual, resetExitoCierre,
    resumenFuturo, cargandoFuturo, fetchDetalleCorte, detalleCorte, cargandoDetalleCorte,
    errorDetalleCorte, fetchResumenFuturo, errorFuturo, fetchVentasPendientesAnteriores,
    ventasFuturo, ventasPendientesAnteriores, cargandoVentasPendientes, errorVentasPendientes
  } = useBalanceStore()

  const [detalleVentaFuturo, setDetalleVentaFuturo] = useState(null)
  const [cargandoDetalleFuturo, setCargandoDetalleFuturo] = useState(false)
  const [ventaAnularId, setVentaAnularId] = useState(null)
  const [anulandoVentaFuturo, setAnulandoVentaFuturo] = useState(false)

  const [modalCerrar, setModalCerrar] = useState(false)
  const [mostrarVentasFuturo, setMostrarVentasFuturo] = useState(false)

  useEffect(() => {
    fetchBalance()
    fetchHistorial()
    fetchResumenFuturo()
    fetchVentasPendientesAnteriores()
  }, [])

  // Calcular KPIs
  const efectivo = balance?.total_efectivo ?? 0
  const transferencias = balance?.total_transferencia ?? 0
  const totalCaja = balance?.dinero_caja_real ?? 0
  const totalVentas = balance?.total_ventas ?? 0
  const saldoPendiente = balance?.saldo_pendiente_ventas ?? 0
  const saldoInicial = balance?.saldo_inicial ?? 0
  const total_compras = balance?.total_compras ?? 0

  // Tarjetas KPI
  const kpiCards = [
    { label: 'Total en caja', value: totalCaja, icon: DollarSign, ring: 'ring-emerald-500/40', iconCol: 'text-emerald-300' },
    { label: 'Total en Compras', value: total_compras, icon: ShoppingCart, ring: 'ring-fuchsia-500/40', iconCol: 'text-fuchsia-300' },
    { label: 'Saldo inicial', value: saldoInicial, icon: Wallet, ring: 'ring-slate-500/40', iconCol: 'text-slate-300' },
    { label: 'Efectivo en caja', value: efectivo, icon: Wallet, ring: 'ring-amber-500/40', iconCol: 'text-amber-300' },
    { label: 'Transferencias', value: transferencias, icon: CreditCard, ring: 'ring-violet-500/40', iconCol: 'text-violet-300' },
    { label: 'Ventas del corte', value: totalVentas, icon: TrendingUp, ring: 'ring-indigo-500/40', iconCol: 'text-indigo-300' },
    { label: 'Saldo pendiente', value: saldoPendiente, icon: Clock, ring: 'ring-rose-500/40', iconCol: 'text-rose-300' },
    { label: 'Deuda cortes anteriores', value: balance?.saldo_pendiente_anteriores ?? 0, icon: Clock, ring: 'ring-rose-500/40', iconCol: 'text-rose-300' },
  ]

  const handleCerrarCorte = async () => {
    const ok = await cerrarCorteActual()
    if (ok) {
      setModalCerrar(false)
      setTimeout(() => resetExitoCierre(), 3000)
    }
  }

  if (cargandoBalance) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Cargando balance...</p>
        </div>
      </div>
    )
  }

  if (error && !balance) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-4 max-w-2xl mx-4 sm:mx-6 lg:mx-8">
        <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <AlertCircle size={20} className="text-rose-500" />
        </div>
        <div>
          <p className="text-rose-700 font-semibold text-sm mb-1">Error al cargar el balance</p>
          <p className="text-rose-500 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  const verDetalleFuturo = async (id) => {
    setCargandoDetalleFuturo(true)
    try {
      const res = await getVentaDetalle(id)
      setDetalleVentaFuturo(res.data)
    } catch (err) {
      console.error('Error al cargar detalle', err)
    } finally {
      setCargandoDetalleFuturo(false)
    }
  }

  const handleAnularVentaFuturo = async () => {
    if (!ventaAnularId) return
    setAnulandoVentaFuturo(true)
    try {
      await anularVenta(ventaAnularId)
      fetchResumenFuturo()
      setVentaAnularId(null)
    } catch (err) {
      console.error('Error al anular venta', err)
      alert(err.response?.data?.mensaje || 'Error al anular la venta')
    } finally {
      setAnulandoVentaFuturo(false)
    }
  }

  return (
    <div style={{padding:"16px"}} className="flex-1 bg-gray-50 p-4 sm:p-6 lg:p-8 overflow-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 lg:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-[28px] font-bold text-[#1B1D2E]">BALANCE</h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Corte #{balance?.corte_numero ?? '...'} · Iniciado: {balance?.fecha_inicio ?? '...'}
          </p>
        </div>
        {balance?.corte_id && (
          <button
            onClick={() => setModalCerrar(true)}
            disabled={cerrandoCorte}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg disabled:opacity-50 transition-all whitespace-nowrap"
          >
            {cerrandoCorte && <Loader2 size={16} className="animate-spin" />}
            Cerrar corte
          </button>
        )}
      </div>

      {/* KPIs - responsive: 2 columnas en móvil, 4 en escritorio */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 lg:mb-8">
        {kpiCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="bg-[#1B1D2E] rounded-2xl p-3 sm:p-4 lg:p-5 flex items-center gap-3 sm:gap-4 hover:scale-[1.02] transition-transform">
              <div className={`bg-[#13152280] ring-2 ${card.ring} w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${card.iconCol}`} />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-white truncate">
                  ${card.value.toLocaleString('es-CO')}
                </p>
                <p className="text-[10px] sm:text-xs text-white/50 mt-0.5 truncate">{card.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Resumen del próximo corte */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6 lg:mb-8 overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100">
          <h2 className="text-sm sm:text-base font-semibold text-slate-700">
            Resumen del próximo corte
          </h2>
        </div>

        {cargandoFuturo ? (
          <div className="flex justify-center py-8 sm:py-10">
            <Loader2 size={24} className="animate-spin text-indigo-500" />
          </div>
        ) : errorFuturo ? (
          <div className="px-4 sm:px-6 py-8 sm:py-10 text-center text-rose-500 text-sm">
            {errorFuturo}
          </div>
        ) : resumenFuturo ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs text-slate-500 uppercase tracking-wider">Concepto</th>
                  <th className="px-4 sm:px-6 py-2 sm:py-3 text-right text-xs text-slate-500 uppercase tracking-wider">Detalle</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-gray-100">
                  <td className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-slate-700">Corte futuro</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-right font-semibold text-indigo-600">
                    #{resumenFuturo.numero}
                  </td>
                </tr>
                <tr className="border-t border-gray-100">
                  <td className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-slate-700">Total de ventas registradas</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-right font-semibold text-slate-800">
                    ${resumenFuturo.total_ventas.toLocaleString('es-CO')}
                  </td>
                </tr>
                <tr className="border-t border-gray-100">
                  <td className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-slate-700">Total pagado</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-right font-semibold text-emerald-600">
                    ${(resumenFuturo.total_pagado || 0).toLocaleString('es-CO')}
                  </td>
                </tr>
                <tr className="border-t border-gray-100">
                  <td className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-slate-700">Pendiente de pago</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-right font-semibold text-amber-600">
                    ${((resumenFuturo.total_ventas || 0) - (resumenFuturo.total_pagado || 0)).toLocaleString('es-CO')}
                  </td>
                </tr>
                <tr className="border-t border-gray-100">
                  <td className="px-4 sm:px-6 py-2 sm:py-3" colSpan={2}>
                    <div className="flex justify-end">
                      <button
                        onClick={() => setMostrarVentasFuturo(true)}
                        disabled={ventasFuturo.length === 0}
                        className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium disabled:opacity-50 transition-colors"
                      >
                        <Info size={14} className="sm:w-4 sm:h-4" />
                        Ver ventas ({ventasFuturo.length})
                      </button>
                    </div>
                  </td>
                </tr>
                <tr className="border-t border-gray-100">
                  <td className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-slate-700">Estado</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                    <span className="inline-flex items-center gap-1 text-xs px-2 sm:px-3 py-1 rounded-full font-medium bg-blue-50 text-blue-600">
                      Futuro
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-4 sm:px-6 py-8 sm:py-10 text-center text-slate-400 text-sm">
            No hay un corte futuro configurado.
          </div>
        )}
      </div>

      {/* Ventas pendientes de cortes anteriores */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6 lg:mb-8 overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100">
          <h2 className="text-sm sm:text-base font-semibold text-slate-700">
            Ventas pendientes de cortes anteriores
          </h2>
        </div>

        {cargandoVentasPendientes ? (
          <div className="flex justify-center py-8 sm:py-10">
            <Loader2 size={24} className="animate-spin text-indigo-500" />
          </div>
        ) : errorVentasPendientes ? (
          <div className="px-4 sm:px-6 py-8 sm:py-10 text-center text-rose-500 text-sm">
            {errorVentasPendientes}
          </div>
        ) : ventasPendientesAnteriores.length === 0 ? (
          <div className="px-4 sm:px-6 py-8 sm:py-10 text-center text-slate-400 text-sm">
            No hay ventas pendientes de cortes anteriores.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs text-slate-500 uppercase tracking-wider">Venta</th>
                  <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs text-slate-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs text-slate-500 uppercase tracking-wider">Corte</th>
                  <th className="px-4 sm:px-6 py-2 sm:py-3 text-right text-xs text-slate-500 uppercase tracking-wider">Total</th>
                  <th className="px-4 sm:px-6 py-2 sm:py-3 text-right text-xs text-slate-500 uppercase tracking-wider">Pendiente</th>
                </tr>
              </thead>
              <tbody>
                {ventasPendientesAnteriores.map((v) => (
                  <tr key={v.id_venta} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-indigo-600">#{String(v.id_venta).padStart(3, '0')}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-slate-700">{v.nombre_cliente}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-slate-500">#{v.corte_id}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-right font-semibold text-slate-800">${v.total.toLocaleString('es-CO')}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-right font-semibold text-amber-600">${v.saldo_pendiente.toLocaleString('es-CO')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Historial de cortes */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100">
          <h2 className="text-sm sm:text-base font-semibold text-slate-700">Historial de cortes</h2>
        </div>
        {cargandoHistorial ? (
          <div className="flex justify-center py-8 sm:py-10">
            <Loader2 size={24} className="animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs text-slate-500 uppercase tracking-wider">Corte #</th>
                  <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs text-slate-500 uppercase tracking-wider">Inicio</th>
                  <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs text-slate-500 uppercase tracking-wider">Cierre</th>
                  <th className="px-4 sm:px-6 py-2 sm:py-3 text-center text-xs text-slate-500 uppercase tracking-wider">Ver</th>
                  <th className="px-4 sm:px-6 py-2 sm:py-3 text-center text-xs text-slate-500 uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody>
                {historial.length === 0 ? (
                  <tr>
                    <td className="text-center py-8 sm:py-10 text-gray-400" colSpan={5}>No hay cortes anteriores registrados.</td>
                  </tr>
                ) : (
                  historial.map((corte) => (
                    <tr key={corte.id} className="border-t border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-indigo-600">#{corte.numero}</td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-gray-500 text-xs sm:text-sm">{corte.fecha_inicio || '—'}</td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-gray-500 text-xs sm:text-sm">{corte.fecha_cierre || '—'}</td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-center">
                        {corte.estado === 'cerrado' && (
                          <button
                            onClick={() => fetchDetalleCorte(corte.id)}
                            className="w-8 h-8 rounded-lg hover:bg-indigo-50 flex items-center justify-center transition-colors"
                            title="Ver detalle del corte"
                          >
                            <Search size={16} color="#4f46e5" />
                          </button>
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-center">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 sm:px-3 py-1 rounded-full font-medium ${
                          corte.estado === 'cerrado'
                            ? 'bg-gray-100 text-gray-600'
                            : corte.estado === 'abierto'
                            ? 'bg-emerald-100 text-emerald-600'
                            : 'bg-blue-100 text-blue-600'
                        }`}>
                          {corte.estado}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal detalle de corte */}
      {detalleCorte && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 bg-indigo-50">
              <h3 className="text-base sm:text-lg font-bold text-slate-800">
                Detalle del Corte #{detalleCorte.corteId}
              </h3>
              <button
                onClick={cerrarDetalleCorte}
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                <X size={20} color="#64748b" />
              </button>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="bg-indigo-50 p-3 sm:p-4 rounded-xl text-center">
                  <p className="text-xs text-slate-500 mb-1">Total Ventas</p>
                  <p className="text-lg sm:text-xl font-bold text-indigo-600">
                    ${detalleCorte.totalVentas.toLocaleString('es-CO')}
                  </p>
                </div>
                <div className="bg-rose-50 p-3 sm:p-4 rounded-xl text-center">
                  <p className="text-xs text-slate-500 mb-1">Total Compras</p>
                  <p className="text-lg sm:text-xl font-bold text-rose-600">
                    ${detalleCorte.totalCompras.toLocaleString('es-CO')}
                  </p>
                </div>
                <div className={`p-3 sm:p-4 rounded-xl text-center ${detalleCorte.utilidad >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                  <p className="text-xs text-slate-500 mb-1">Utilidad</p>
                  <p className={`text-lg sm:text-xl font-bold ${detalleCorte.utilidad >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    ${detalleCorte.utilidad.toLocaleString('es-CO')}
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => exportarAExcel(
                    detalleCorte.ventas,
                    `Ventas_Corte_${detalleCorte.corteId}`,
                    [
                      { key: 'id_venta', label: 'ID Venta' },
                      { key: 'nombre_cliente', label: 'Cliente' },
                      { key: 'fecha_entrega', label: 'Fecha' },
                      { key: 'total', label: 'Total', format: (item) => `$${item.total?.toLocaleString('es-CO')}` },
                      { key: 'estado', label: 'Estado' }
                    ]
                  )}
                  className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  <Download size={16} />
                  Exportar Ventas
                </button>
                <button
                  onClick={() => exportarAExcel(
                    detalleCorte.compras,
                    `Compras_Corte_${detalleCorte.corteId}`,
                    [
                      { key: 'id', label: 'ID Compra' },
                      { key: 'proveedor_nombre', label: 'Proveedor' },
                      { key: 'fecha', label: 'Fecha' },
                      { key: 'total', label: 'Total', format: (item) => `$${item.total?.toLocaleString('es-CO')}` },
                      { key: 'estado', label: 'Estado' }
                    ]
                  )}
                  className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  <Download size={16} />
                  Exportar Compras
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal cerrar corte */}
      {modalCerrar && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 sm:p-8 text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <AlertCircle size={28} className="sm:w-8 sm:h-8 text-rose-500" />
            </div>
            <p className="font-bold text-lg sm:text-xl text-slate-800 mb-2 sm:mb-3">¿Cerrar corte actual?</p>
            <p className="text-sm text-slate-500 mb-6 sm:mb-8 leading-relaxed">
              Se activará el corte futuro y se creará uno nuevo automáticamente.
              Los abonos pendientes del corte futuro se asignarán como saldo inicial.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setModalCerrar(false)}
                disabled={cerrandoCorte}
                className="flex-1 py-2.5 sm:py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleCerrarCorte}
                disabled={cerrandoCorte}
                className="flex-1 py-2.5 sm:py-3 border-none rounded-xl bg-rose-500 text-white text-sm font-semibold hover:bg-rose-600 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
              >
                {cerrandoCorte ? 'Cerrando...' : 'Sí, cerrar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notificación de éxito */}
      {exitoCierre && (
        <div className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 bg-emerald-50 border border-emerald-200 rounded-xl p-3 sm:p-4 flex items-center gap-3 shadow-lg z-50 animate-bounce">
          <CheckCircle2 size={20} className="text-emerald-500" />
          <span className="text-xs sm:text-sm text-emerald-700 font-medium">Corte cerrado correctamente</span>
          <button onClick={resetExitoCierre} className="ml-2 text-emerald-400 hover:text-emerald-600">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Modal ventas del corte futuro */}
      {mostrarVentasFuturo && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 bg-indigo-50">
              <h3 className="text-base sm:text-lg font-bold text-slate-800">
                Ventas del corte futuro #{resumenFuturo?.numero}
              </h3>
              <button
                onClick={() => setMostrarVentasFuturo(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                <X size={20} color="#64748b" />
              </button>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto">
              {ventasFuturo.length === 0 ? (
                <p className="text-center text-slate-400">No hay ventas registradas aún.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse min-w-[500px]">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="px-3 sm:px-4 py-2 text-left text-xs text-slate-500 uppercase">ID</th>
                        <th className="px-3 sm:px-4 py-2 text-left text-xs text-slate-500 uppercase">Cliente</th>
                        <th className="px-3 sm:px-4 py-2 text-right text-xs text-slate-500 uppercase">Total</th>
                        <th className="px-3 sm:px-4 py-2 text-left text-xs text-slate-500 uppercase">Estado</th>
                        <th className="px-3 sm:px-4 py-2 text-left text-xs text-slate-500 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ventasFuturo.map((v) => (
                        <tr key={v.id_venta} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="px-3 sm:px-4 py-2 font-medium text-indigo-600">#{String(v.id_venta).padStart(3, '0')}</td>
                          <td className="px-3 sm:px-4 py-2 text-slate-700 text-xs sm:text-sm">{v.nombre_cliente}</td>
                          <td className="px-3 sm:px-4 py-2 text-right font-semibold text-xs sm:text-sm">${v.total.toLocaleString('es-CO')}</td>
                          <td className="px-3 sm:px-4 py-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              v.estado === 'pendiente' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                            }`}>
                              {v.estado}
                            </span>
                          </td>
                          <td className="px-3 sm:px-4 py-2">
                            <div className="flex gap-1">
                              <button
                                title="Ver detalle"
                                onClick={() => verDetalleFuturo(v.id_venta)}
                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg hover:bg-indigo-100 flex items-center justify-center transition-colors"
                              >
                                <Info size={14} color="#4f46e5" />
                              </button>
                              <button
                                title="Anular"
                                onClick={() => setVentaAnularId(v.id_venta)}
                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg hover:bg-rose-100 flex items-center justify-center transition-colors"
                              >
                                <Trash2 size={14} color="#ef4444" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
              <button
                onClick={() => setMostrarVentasFuturo(false)}
                className="px-3 sm:px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 bg-white hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalle venta futuro */}
      {detalleVentaFuturo && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-6 border-b border-gray-100">
              <div>
                <p className="font-bold text-lg sm:text-xl text-gray-800">
                  Detalle de Venta{' '}
                  <span className="text-indigo-600">#{String(detalleVentaFuturo.id).padStart(3, '0')}</span>
                </p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Cliente: <strong className="text-gray-700">{detalleVentaFuturo.nombre_cliente}</strong>
                </p>
              </div>
              <button
                onClick={() => setDetalleVentaFuturo(null)}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center hover:bg-gray-100"
              >
                <X size={18} className="sm:w-5 sm:h-5" color="#64748b" />
              </button>
            </div>
            <div className="p-4 sm:p-6 lg:p-8 overflow-y-auto">
              <div className="overflow-x-auto mb-6">
                <table className="w-full border-collapse min-w-[400px]">
                  <thead className="bg-slate-200">
                    <tr>
                      <th className="px-3 sm:px-4 py-2 text-left text-xs text-slate-500 uppercase">Producto</th>
                      <th className="px-3 sm:px-4 py-2 text-center text-xs text-slate-500 uppercase">Cantidad</th>
                      <th className="px-3 sm:px-4 py-2 text-right text-xs text-slate-500 uppercase">Precio unit.</th>
                      <th className="px-3 sm:px-4 py-2 text-right text-xs text-slate-500 uppercase">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalleVentaFuturo.detalle?.map((d, i) => (
                      <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-slate-700">{d.nombre_producto}</td>
                        <td className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-center text-slate-600">{d.cantidad}</td>
                        <td className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-right text-slate-600">${d.precio_unitario.toLocaleString('es-CO')}</td>
                        <td className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-right font-medium text-slate-700">${d.subtotal.toLocaleString('es-CO')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-indigo-50 p-3 sm:p-4 rounded-xl text-center">
                  <p className="text-xs text-slate-500">Total</p>
                  <p className="text-lg sm:text-xl font-bold text-indigo-600">${detalleVentaFuturo.total?.toLocaleString('es-CO')}</p>
                </div>
                <div className="bg-emerald-50 p-3 sm:p-4 rounded-xl text-center">
                  <p className="text-xs text-slate-500">Abonado</p>
                  <p className="text-lg sm:text-xl font-bold text-emerald-600">${detalleVentaFuturo.total_abonado?.toLocaleString('es-CO')}</p>
                </div>
                <div className={`p-3 sm:p-4 rounded-xl text-center ${detalleVentaFuturo.saldo_pendiente > 0 ? 'bg-amber-50' : 'bg-emerald-50'}`}>
                  <p className="text-xs text-slate-500">Saldo pendiente</p>
                  <p className={`text-lg sm:text-xl font-bold ${detalleVentaFuturo.saldo_pendiente > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    ${detalleVentaFuturo.saldo_pendiente?.toLocaleString('es-CO')}
                  </p>
                </div>
              </div>
            </div>
            <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
              <button
                onClick={() => setDetalleVentaFuturo(null)}
                className="px-3 sm:px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 bg-white hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar anular venta futuro */}
      {ventaAnularId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 sm:p-8 text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <AlertTriangle size={28} className="sm:w-8 sm:h-8 text-rose-500" />
            </div>
            <p className="font-bold text-lg sm:text-xl text-gray-800 mb-2 sm:mb-3">¿Anular venta?</p>
            <p className="text-sm text-gray-500 mb-6 sm:mb-8">
              La venta <strong>#{String(ventaAnularId).padStart(3, '0')}</strong> del corte futuro será anulada.
              Si tenía pagos, el dinero se revertirá del saldo inicial del corte.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setVentaAnularId(null)}
                disabled={anulandoVentaFuturo}
                className="flex-1 py-2.5 sm:py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 bg-white hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAnularVentaFuturo}
                disabled={anulandoVentaFuturo}
                className="flex-1 py-2.5 sm:py-3 border-none rounded-xl bg-rose-500 text-white text-sm font-semibold hover:bg-rose-600 disabled:opacity-50"
              >
                {anulandoVentaFuturo ? 'Anulando...' : 'Sí, anular'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}