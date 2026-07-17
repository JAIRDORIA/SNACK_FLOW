import { useState, useEffect } from 'react'
import { usePrestamosStore } from '../store/Useprestamosstore'
import { getClientes } from '@/api/clientes_api'


export default function NuevoPrestamoModal({ isOpen, onClose, onSuccess }) {
    const { nuevoPrestamo } = usePrestamosStore()
    const usuario = JSON.parse(localStorage.getItem('usuario') || 'null')

    const [clientes, setClientes] = useState([])
    const [busquedaCliente, setBusquedaCliente] = useState('')
    const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
    const [monto, setMonto] = useState('')
    const [medioPago, setMedioPago] = useState('efectivo')
    const [observacion, setObservacion] = useState('')
    const [error, setError] = useState('')
    const [guardando, setGuardando] = useState(false)

    useEffect(() => {
        if (!isOpen) return
        getClientes().then((res) => setClientes(res.data.items || [])).catch(() => setClientes([]))
    }, [isOpen])

    if (!isOpen) return null

    const clientesFiltrados = clientes.filter((c) =>
        c.Cli_Nombre.toLowerCase().includes(busquedaCliente.toLowerCase())
    )

    const resetForm = () => {
        setClienteSeleccionado(null)
        setBusquedaCliente('')
        setMonto('')
        setMedioPago('efectivo')
        setObservacion('')
        setError('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!clienteSeleccionado) {
            setError('Selecciona un cliente')
            return
        }
        const montoNum = parseFloat(monto)
        if (!montoNum || montoNum <= 0) {
            setError('El monto debe ser mayor a 0')
            return
        }

        setGuardando(true)
        const resultado = await nuevoPrestamo({
            cliente_id: clienteSeleccionado.ID_Cliente,
            usuario_id: usuario.id,
            monto: montoNum,
            medio_pago: medioPago,
            observacion: observacion || null,
        })
        setGuardando(false)

        if (!resultado.ok) {
            setError(resultado.mensaje)
            return
        }

        resetForm()
        onSuccess?.()
        onClose()
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div style={{ padding: "24px" }} className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
                <h2 style={{ marginBottom: "16px" }} className="text-lg font-semibold mb-4">Nuevo préstamo</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label style={{ marginBottom: "4px" }} className="block text-sm font-medium mb-1">Cliente</label>
                        <input
                            type="text"
                            placeholder="Buscar cliente..."
                            style={{ padding: "8px 12px" }}
                            className="w-full border rounded px-3 py-2 text-sm"
                            value={clienteSeleccionado ? clienteSeleccionado.Cli_Nombre : busquedaCliente}
                            onChange={(e) => {
                                setClienteSeleccionado(null)
                                setBusquedaCliente(e.target.value)
                            }}
                        />
                        {busquedaCliente && !clienteSeleccionado && (
                            <div style={{ marginTop: "4px" }} className="border rounded mt-1 max-h-40 overflow-y-auto">
                                {clientesFiltrados.map((c) => (
                                    <div
                                        key={c.ID_Cliente}
                                        style={{ padding: "8px 12px" }}
                                        className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                                        onClick={() => {
                                            setClienteSeleccionado(c)
                                            setBusquedaCliente('')
                                        }}
                                    >
                                        {c.Cli_Nombre}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <label style={{ marginBottom: "4px" }} className="block text-sm font-medium mb-1">Monto</label>
                        <input
                            type="number"
                            min="1"
                            step="1"
                            style={{ padding: "8px 12px" }}
                            className="w-full border rounded px-3 py-2 text-sm"
                            value={monto}
                            onChange={(e) => setMonto(e.target.value)}
                        />
                    </div>

                    <div>
                        <label style={{ marginTop: "4px" }} className="block text-sm font-medium mb-1">Medio de pago (con el que se presta)</label>
                        <select
                            className="w-full border rounded px-3 py-2 text-sm"
                            style={{ padding: "8px 12px" }}
                            value={medioPago}
                            onChange={(e) => setMedioPago(e.target.value)}
                        >
                            <option value="efectivo">Efectivo</option>
                            <option value="transferencia">Transferencia</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ marginBottom: "4px" }} className="block text-sm font-medium mb-1">Observación (opcional)</label>
                        <textarea
                            style={{ padding: "8px 12px" }}
                            className="w-full border rounded px-3 py-2 text-sm"
                            rows={2}
                            value={observacion}
                            onChange={(e) => setObservacion(e.target.value)}
                        />
                    </div>

                    {error && <p className="text-red-600 text-sm">{error}</p>}

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            className="px-4 py-2 text-sm rounded border"
                            onClick={() => { resetForm(); onClose() }}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={guardando}
                            className="px-4 py-2 text-sm rounded bg-blue-600 text-white disabled:opacity-50"
                        >
                            {guardando ? 'Guardando...' : 'Guardar préstamo'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}