import { useEffect, useState } from 'react'
import {
  Wallet, CreditCard, DollarSign, TrendingUp, Clock, Calendar, Info, AlertTriangle, Download,
  AlertCircle, CheckCircle2, Loader2, X, Trash2,Search
} from 'lucide-react'
import useBalanceStore from '@/store/useBalanceStore'
import { getVentaDetalle, anularVenta } from '@/api/ventas_api'
import { exportarAExcel } from '@/utils/exportarExcel'




export default function Balance() {
  const {
    balance, historial,
    cargandoBalance, cargandoHistorial, cerrandoCorte, error, exitoCierre,
    fetchBalance, fetchHistorial, cerrarCorteActual, resetExitoCierre, resumenFuturo, cargandoFuturo, fetchDetalleCorte, detalleCorte, cargandoDetalleCorte, errorDetalleCorte, fetchResumenFuturo, errorFuturo, fetchVentasPendientesAnteriores, ventasFuturo, ventasPendientesAnteriores, cargandoVentasPendientes, errorVentasPendientes
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
    { label: 'Total en Compras', value: total_compras, icon: DollarSign, ring: 'ring-emerald-500/40', iconCol: 'text-emerald-300' },
    { label: 'Saldo inicial', value: saldoInicial, icon: Wallet, ring: 'ring-slate-500/40', iconCol: 'text-slate-300' },
    { label: 'Efectivo en caja', value: efectivo, icon: Wallet, ring: 'ring-amber-500/40', iconCol: 'text-amber-300' },
    { label: 'Transferencias', value: transferencias, icon: CreditCard, ring: 'ring-violet-500/40', iconCol: 'text-violet-300' },

    { label: 'Ventas del corte', value: totalVentas, icon: TrendingUp, ring: 'ring-indigo-500/40', iconCol: 'text-indigo-300' },
    { label: 'Saldo pendiente', value: saldoPendiente, icon: Clock, ring: 'ring-rose-500/40', iconCol: 'text-rose-300' },
    { label: 'Deuda cortes anteriores', value: balance?.saldo_pendiente_anteriores ?? 0, icon: Clock, ring: 'ring-rose-500/40', conCol: 'text-rose-300', },
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
      <div style={{ padding: "32px" }} className="p-8 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-4 max-w-2xl">
        <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <AlertCircle size={20} className="text-rose-500" />
        </div>
        <div>
          <p style={{ marginBottom: "4px" }} className="text-rose-700 font-semibold text-sm mb-1">Error al cargar el balance</p>
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
      fetchResumenFuturo() // Refrescar la tabla de ventas futuras
      setVentaAnularId(null)
    } catch (err) {
      console.error('Error al anular venta', err)
      alert(err.response?.data?.mensaje || 'Error al anular la venta')
    } finally {
      setAnulandoVentaFuturo(false)
    }
  }

  return (
    <div style={{ padding: "32px" }} className="flex-1 bg-gray-50 p-8 overflow-auto">

      {/* Header */}
      <div style={{ marginBottom: "32px" }} className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-bold text-[#1B1D2E]">BALANCE</h1>
          <p className="text-sm text-gray-400">
            Corte #{balance?.corte_numero ?? '...'} · Iniciado: {balance?.fecha_inicio ?? '...'}
          </p>
        </div>
        {balance?.corte_id && (
          <button
            onClick={() => setModalCerrar(true)}
            disabled={cerrandoCorte}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg disabled:opacity-50 transition-all"
            style={{ padding: "10px 20px" }}
          >
            {cerrandoCorte && <Loader2 size={16} className="animate-spin" />}
            Cerrar corte
          </button>
        )}
      </div>

      {/* KPIs */}
      <div style={{ marginBottom: "32px" }} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpiCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} style={{ padding: "20px" }} className="bg-[#1B1D2E] rounded-2xl p-5 flex items-center gap-4 hover:scale-[1.02] transition-transform">
              <div className={`bg-[#13152280] ring-2 ${card.ring} w-12 h-12 rounded-xl flex items-center justify-center shrink-0`}>
                <Icon className={`w-6 h-6 ${card.iconCol}`} />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">
                  ${card.value.toLocaleString('es-CO')}
                </p>
                <p style={{ marginTop: "2px" }} className="text-xs text-white/50 mt-0.5">{card.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Resumen del próximo corte */}
      <div style={{ marginBottom: "32px" }} className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-8 overflow-hidden">
        <div style={{ padding: "16px 24px" }} className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-slate-700">
            Resumen del próximo corte
          </h2>
        </div>

        {cargandoFuturo ? (
          <div style={{ paddingTop: "40px", paddingBottom: "40px" }} className="flex justify-center py-10">
            <Loader2 size={24} className="animate-spin text-indigo-500" />
          </div>
        ) : errorFuturo ? (
          <div style={{ padding: "40px 24px" }} className="px-6 py-10 text-center text-rose-500 text-sm">
            {errorFuturo}
          </div>
        ) : resumenFuturo ? (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th style={{ padding: "12px 24px" }} className="px-6 py-3 text-left text-xs text-slate-500 uppercase tracking-wider">Concepto</th>
                <th style={{ padding: "12px 24px" }} className="px-6 py-3 text-right text-xs text-slate-500 uppercase tracking-wider">Detalle</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-gray-100">
                <td style={{ padding: "16px 24px" }} className="px-6 py-4 font-medium text-slate-700">Corte futuro</td>
                <td style={{ padding: "16px 24px" }} className="px-6 py-4 text-right font-semibold text-indigo-600">
                  #{resumenFuturo.numero}
                </td>
              </tr>

              <tr className="border-t border-gray-100">
                <td style={{ padding: "16px 24px" }} className="px-6 py-4 font-medium text-slate-700">Total de ventas registradas</td>
                <td style={{ padding: "16px 24px" }} className="px-6 py-4 text-right font-semibold text-slate-800">
                  ${resumenFuturo.total_ventas.toLocaleString('es-CO')}
                </td>
              </tr>
              <tr className="border-t border-gray-100">
                <td style={{ padding: "16px 24px" }} className="px-6 py-4 font-medium text-slate-700">Total pagado</td>
                <td style={{ padding: "16px 24px" }} className="px-6 py-4 text-right font-semibold text-emerald-600">
                  ${(resumenFuturo.total_pagado || 0).toLocaleString('es-CO')}
                </td>
              </tr>
              <tr className="border-t border-gray-100">
                <td style={{ padding: "16px 24px" }} className="px-6 py-4 font-medium text-slate-700">Pendiente de pago</td>
                <td style={{ padding: "16px 24px" }} className="px-6 py-4 text-right font-semibold text-amber-600">
                  ${((resumenFuturo.total_ventas || 0) - (resumenFuturo.total_pagado || 0)).toLocaleString('es-CO')}
                </td>
              </tr>

              <tr className="border-t border-gray-100">
                <td style={{ padding: "12px 24px" }} colSpan={2} className="px-6 py-3 text-right">
                  <button
                    onClick={() => setMostrarVentasFuturo(true)}
                    disabled={ventasFuturo.length === 0}
                    style={{ padding: "8px 16px" }}
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                  >
                    <Info size={16} />
                    Ver ventas ({ventasFuturo.length})
                  </button>
                </td>
              </tr>
              <tr className="border-t border-gray-100">
                <td style={{ padding: "16px 24px" }} className="px-6 py-4 font-medium text-slate-700">Estado</td>
                <td style={{ padding: "16px 24px" }} className="px-6 py-4 text-right">
                  <span style={{ padding: "4px 12px" }} className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-medium bg-blue-50 text-blue-600">
                    Futuro
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        ) : (
          <div style={{ padding: "16px 40px" }} className="px-6 py-10 text-center text-slate-400 text-sm">
            No hay un corte futuro configurado.
          </div>
        )}
      </div>

      {/* Ventas pendientes de cortes anteriores */}
      <div style={{ marginBottom: "32px" }} className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-8 overflow-hidden">
        <div style={{ padding: "16px 24px" }} className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-slate-700">
            Ventas pendientes de cortes anteriores
          </h2>
        </div>

        {cargandoVentasPendientes ? (
          <div style={{ paddingTop: "4px", paddingBottom: "40px" }} className="flex justify-center py-10">
            <Loader2 size={24} className="animate-spin text-indigo-500" />
          </div>
        ) : errorVentasPendientes ? (
          <div style={{ padding: "40px 24px" }} className="px-6 py-10 text-center text-rose-500 text-sm">
            {errorVentasPendientes}
          </div>
        ) : ventasPendientesAnteriores.length === 0 ? (
          <div style={{ padding: "40px 24px" }} className="px-6 py-10 text-center text-slate-400 text-sm">
            No hay ventas pendientes de cortes anteriores.
          </div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th style={{ padding: "12px 24px" }} className="px-6 py-3 text-left text-xs text-slate-500 uppercase tracking-wider">Venta</th>
                <th style={{ padding: "12px 24px" }} className="px-6 py-3 text-left text-xs text-slate-500 uppercase tracking-wider">Cliente</th>
                <th style={{ padding: "12px 24px" }} className="px-6 py-3 text-left text-xs text-slate-500 uppercase tracking-wider">Corte</th>
                <th style={{ padding: "12px 24px" }} className="px-6 py-3 text-right text-xs text-slate-500 uppercase tracking-wider">Total</th>
                <th style={{ padding: "12px 24px" }} className="px-6 py-3 text-right text-xs text-slate-500 uppercase tracking-wider">Pendiente</th>
              </tr>
            </thead>
            <tbody>
              {ventasPendientesAnteriores.map((v) => (
                <tr key={v.id_venta} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                  <td style={{ padding: "16px 24px" }} className="px-6 py-4 font-medium text-indigo-600">#{String(v.id_venta).padStart(3, '0')}</td>
                  <td style={{ padding: "16px 24px" }} className="px-6 py-4 text-slate-700">{v.nombre_cliente}</td>
                  <td style={{ padding: "16px 24px" }} className="px-6 py-4 text-slate-500">#{v.corte_id}</td>
                  <td style={{ padding: "16px 24px" }} className="px-6 py-4 text-right font-semibold text-slate-800">${v.total.toLocaleString('es-CO')}</td>
                  <td style={{ padding: "16px 24px" }} className="px-6 py-4 text-right font-semibold text-amber-600">${v.saldo_pendiente.toLocaleString('es-CO')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Historial de cortes */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div style={{ padding: "16px 24px" }} className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-slate-700">Historial de cortes</h2>
        </div>
        {cargandoHistorial ? (
          <div style={{ paddingTop: "40px", paddingBottom: "40px" }} className="flex justify-center py-10">
            <Loader2 size={24} className="animate-spin text-indigo-500" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th style={{ padding: "12px 24px" }} className="px-6 py-3 text-left text-xs text-slate-500 uppercase tracking-wider">Corte #</th>
                <th style={{ padding: "12px 24px" }} className="px-6 py-3 text-left text-xs text-slate-500 uppercase tracking-wider">Inicio</th>
                <th style={{ padding: "12px 24px" }} className="px-6 py-3 text-left text-xs text-slate-500 uppercase tracking-wider">Cierre</th>
                <th style={{ padding: "12px 24px" }} className="px-6 py-3 text-center text-xs text-slate-500 uppercase tracking-wider">Ver</th>
                <th style={{ padding: "12px 24px" }} className="px-6 py-3 text-center text-xs text-slate-500 uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody>
              {historial.length === 0 ? (
                <tr>
                  <td style={{ paddingTop: "40px", paddingBottom: "40px" }} colSpan={4} className="text-center py-10 text-gray-400">No hay cortes anteriores registrados.</td>
                </tr>
              ) : (
                historial.map((corte) => (
                  <tr key={corte.id} className="border-t border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td style={{ padding: "16px 24px" }} className="px-6 py-4 font-medium text-indigo-600">#{corte.numero}</td>
                    <td style={{ padding: "16px 24px" }} className="px-6 py-4 text-gray-500">{corte.fecha_inicio || '—'}</td>
                    <td style={{ padding: "16px 24px" }} className="px-6 py-4 text-gray-500">{corte.fecha_cierre || '—'}</td>
                    <td style={{ padding: "16px 24px" }} className="px-6 py-4 text-center">
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
                    <td style={{ padding: "16px 24px" }} className="px-6 py-4 text-center">
                      <span style={{ padding: "4px 12px" }} className={`inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-medium ${corte.estado === 'cerrado'
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
        )}
      </div>
      {/* Modal detalle de corte */}
      {detalleCorte && (
        <div style={{ padding: "16px" }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden">

            {/* Header */}
            <div style={{ padding: "16px 24px" }} className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-indigo-50">
              <h3 className="text-lg font-bold text-slate-800">
                Detalle del Corte #{detalleCorte.corteId}
              </h3>
              <button
                onClick={() => set({ detalleCorte: null })}
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                <X size={20} color="#64748b" />
              </button>
            </div>

            {/* Resumen */}
            <div style={{ padding: "24px" }} className="p-6">
              <div style={{ marginBottom: "24px" }} className="grid grid-cols-3 gap-4 mb-6">
                <div style={{ padding: "16px" }} className="bg-indigo-50 p-4 rounded-xl text-center">
                  <p style={{ marginBottom: "4px" }} className="text-xs text-slate-500 mb-1">Total Ventas</p>
                  <p className="text-xl font-bold text-indigo-600">
                    ${detalleCorte.totalVentas.toLocaleString('es-CO')}
                  </p>
                </div>
                <div style={{ padding: "16px" }} className="bg-rose-50 p-4 rounded-xl text-center">
                  <p style={{ marginBottom: "4px" }} className="text-xs text-slate-500 mb-1">Total Compras</p>
                  <p className="text-xl font-bold text-rose-600">
                    ${detalleCorte.totalCompras.toLocaleString('es-CO')}
                  </p>
                </div>
                <div style={{ padding: "16px" }} className={`p-4 rounded-xl text-center ${detalleCorte.utilidad >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                  <p style={{ marginBottom: "4px" }} className="text-xs text-slate-500 mb-1">Utilidad</p>
                  <p className={`text-xl font-bold ${detalleCorte.utilidad >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    ${detalleCorte.utilidad.toLocaleString('es-CO')}
                  </p>
                </div>
              </div>

              {/* Botones de exportación */}
              <div style={{ marginBottom: "24px" }} className="flex gap-3 mb-6">
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
                  style={{ padding: "8px 16px" }}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
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
                  style={{ padding: "8px 16px" }}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
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
        <div style={{ padding: "16px" }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div style={{ padding: "32px" }} className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-8 text-center">
            <div style={{ marginBottom: "24px", marginRight: "auto", marginLeft: "auto" }} className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={32} className="text-rose-500" />
            </div>
            <p style={{ marginBottom: "12px" }} className="font-bold text-xl text-slate-800 mb-3">¿Cerrar corte actual?</p>
            <p style={{ marginBottom: "32px" }} className="text-sm text-slate-500 mb-8 leading-relaxed">
              Se activará el corte futuro y se creará uno nuevo automáticamente.
              Los abonos pendientes del corte futuro se asignarán como saldo inicial.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setModalCerrar(false)}
                disabled={cerrandoCorte}
                style={{ paddingTop: "12px", paddingBottom: "12px" }}
                className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleCerrarCorte}
                disabled={cerrandoCorte}
                style={{ paddingTop: "12px", paddingBottom: "12px" }}
                className="flex-1 py-3 border-none rounded-xl bg-rose-500 text-white text-sm font-semibold hover:bg-rose-600 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
              >
                {cerrandoCorte ? 'Cerrando...' : 'Sí, cerrar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notificación de éxito */}
      {exitoCierre && (
        <div style={{ padding: "16px" }} className="fixed bottom-5 right-5 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 shadow-lg z-50 animate-bounce">
          <CheckCircle2 size={20} className="text-emerald-500" />
          <span className="text-sm text-emerald-700 font-medium">Corte cerrado correctamente</span>
          <button style={{ marginLeft: "8px" }} onClick={resetExitoCierre} className="ml-2 text-emerald-400 hover:text-emerald-600">
            <X size={16} />
          </button>
        </div>
      )}
      {/* Modal ventas del corte futuro */}
      {mostrarVentasFuturo && (
        <div style={{ padding: "16px" }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden">
            <div style={{ padding: "16px 24px" }} className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-indigo-50">
              <h3 className="text-lg font-bold text-slate-800">
                Ventas del corte futuro #{resumenFuturo?.numero}
              </h3>
              <button
                onClick={() => setMostrarVentasFuturo(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                <X size={20} color="#64748b" />
              </button>
            </div>
            <div style={{ padding: "24px" }} className="p-6 max-h-[70vh] overflow-y-auto">
              {ventasFuturo.length === 0 ? (
                <p className="text-center text-slate-400">No hay ventas registradas aún.</p>
              ) : (
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50">
                      <th style={{ padding: "8px 16px" }} className="px-4 py-2 text-left text-xs text-slate-500 uppercase">ID</th>
                      <th style={{ padding: "8px 16px" }} className="px-4 py-2 text-left text-xs text-slate-500 uppercase">Cliente</th>
                      <th style={{ padding: "8px 16px" }} className="px-4 py-2 text-right text-xs text-slate-500 uppercase">Total</th>
                      <th style={{ padding: "8px 16px" }} className="px-4 py-2 text-left text-xs text-slate-500 uppercase">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventasFuturo.map((v) => (
                      <tr key={v.id_venta} className="border-t border-gray-100 hover:bg-gray-50">
                        <td style={{ padding: "8px 16px" }} className="px-4 py-2 font-medium text-indigo-600">#{String(v.id_venta).padStart(3, '0')}</td>
                        <td style={{ padding: "8px 16px" }} className="px-4 py-2 text-slate-700">{v.nombre_cliente}</td>
                        <td style={{ padding: "8px 16px" }} className="px-4 py-2 text-right font-semibold">${v.total.toLocaleString('es-CO')}</td>
                        <td style={{ padding: "8px 16px" }} className="px-4 py-2">
                          <span style={{ padding: "2px 8px" }} className={`text-xs px-2 py-0.5 rounded-full ${v.estado === 'pendiente' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                            }`}>
                            {v.estado}
                          </span>
                        </td>
                        <td style={{ padding: "8px 16px" }} className="px-4 py-2">
                          <div className="flex gap-1">
                            <button
                              title="Ver detalle"
                              onClick={() => verDetalleFuturo(v.id_venta)}
                              className="w-8 h-8 rounded-lg hover:bg-indigo-100 flex items-center justify-center transition-colors"
                            >
                              <Info size={14} color="#4f46e5" />
                            </button>
                            <button
                              title="Anular"
                              onClick={() => setVentaAnularId(v.id_venta)}
                              className="w-8 h-8 rounded-lg hover:bg-rose-100 flex items-center justify-center transition-colors"
                            >
                              <Trash2 size={14} color="#ef4444" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div style={{ padding: "16px 24px" }} className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
              <button
                onClick={() => setMostrarVentasFuturo(false)}
                style={{ padding: "8px 16px" }}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 bg-white hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )


      }
      {/* Modal detalle venta futuro */}
      {detalleVentaFuturo && (
        <div style={{ padding: "16px" }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden">
            <div style={{ padding: "24px 32px" }} className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
              <div>
                <p className="font-bold text-xl text-gray-800">
                  Detalle de Venta{' '}
                  <span className="text-indigo-600">#{String(detalleVentaFuturo.id).padStart(3, '0')}</span>
                </p>
                <p style={{ marginTop: "4px" }} className="text-sm text-gray-500 mt-1">
                  Cliente: <strong className="text-gray-700">{detalleVentaFuturo.nombre_cliente}</strong>
                </p>
              </div>
              <button
                onClick={() => setDetalleVentaFuturo(null)}
                className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-100"
              >
                <X size={20} color="#64748b" />
              </button>
            </div>
            <div style={{ padding: "32px" }} className="p-8 max-h-[70vh] overflow-y-auto">
              {/* Tabla de productos */}
              <table style={{ marginBottom: "24px" }} className="w-full border-collapse mb-6">
                <thead className="bg-slate-200">
                  <tr>
                    <th style={{ padding: "8px 16px" }} className="px-4 py-2 text-left text-xs text-slate-500 uppercase">Producto</th>
                    <th style={{ padding: "8px 16px" }} className="px-4 py-2 text-center text-xs text-slate-500 uppercase">Cantidad</th>
                    <th style={{ padding: "8px 16px" }} className="px-4 py-2 text-right text-xs text-slate-500 uppercase">Precio unit.</th>
                    <th style={{ padding: "8px 16px" }} className="px-4 py-2 text-right text-xs text-slate-500 uppercase">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {detalleVentaFuturo.detalle?.map((d, i) => (
                    <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                      <td style={{ padding: "8px 16px" }} className="px-4 py-2 text-sm text-slate-700">{d.nombre_producto}</td>
                      <td style={{ padding: "8px 16px" }} className="px-4 py-2 text-sm text-center text-slate-600">{d.cantidad}</td>
                      <td style={{ padding: "8px 16px" }} className="px-4 py-2 text-sm text-right text-slate-600">${d.precio_unitario.toLocaleString('es-CO')}</td>
                      <td style={{ padding: "8px 16px" }} className="px-4 py-2 text-sm text-right font-medium text-slate-700">${d.subtotal.toLocaleString('es-CO')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Totales */}
              <div className="grid grid-cols-3 gap-4">
                <div style={{ padding: "16px" }} className="bg-indigo-50 p-4 rounded-xl text-center">
                  <p className="text-xs text-slate-500">Total</p>
                  <p className="text-xl font-bold text-indigo-600">${detalleVentaFuturo.total?.toLocaleString('es-CO')}</p>
                </div>
                <div style={{ padding: "16px" }} className="bg-emerald-50 p-4 rounded-xl text-center">
                  <p className="text-xs text-slate-500">Abonado</p>
                  <p className="text-xl font-bold text-emerald-600">${detalleVentaFuturo.total_abonado?.toLocaleString('es-CO')}</p>
                </div>
                <div style={{ padding: "16px" }} className={`p-4 rounded-xl text-center ${detalleVentaFuturo.saldo_pendiente > 0 ? 'bg-amber-50' : 'bg-emerald-50'}`}>
                  <p className="text-xs text-slate-500">Saldo pendiente</p>
                  <p className={`text-xl font-bold ${detalleVentaFuturo.saldo_pendiente > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    ${detalleVentaFuturo.saldo_pendiente?.toLocaleString('es-CO')}
                  </p>
                </div>
              </div>
            </div>
            <div style={{ padding: "16px 32px" }} className="px-8 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
              <button
                onClick={() => setDetalleVentaFuturo(null)}
                style={{ padding: "8px 16px" }}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 bg-white hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal confirmar anular venta futuro */}
      {ventaAnularId && (
        <div style={{ padding: "16px" }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div style={{ padding: "32px" }} className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-8 text-center">
            <div style={{ marginBottom: "24px", marginLeft: "auto", marginRight: "auto" }} className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} className="text-rose-500" />
            </div>
            <p style={{ marginBottom: "12px" }} className="font-bold text-xl text-gray-800 mb-3">¿Anular venta?</p>
            <p style={{ marginBottom: "32px" }} className="text-sm text-gray-500 mb-8">
              La venta <strong>#{String(ventaAnularId).padStart(3, '0')}</strong> del corte futuro será anulada.
              Si tenía pagos, el dinero se revertirá del saldo inicial del corte.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setVentaAnularId(null)}
                disabled={anulandoVentaFuturo}
                style={{ paddingTop: "12px", paddingBottom: "12px" }}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 bg-white hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAnularVentaFuturo}
                disabled={anulandoVentaFuturo}
                style={{ paddingTop: "12px", paddingBottom: "12px" }}
                className="flex-1 py-3 border-none rounded-xl bg-rose-500 text-white text-sm font-semibold hover:bg-rose-600 disabled:opacity-50"
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