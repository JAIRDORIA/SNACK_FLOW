import { create } from 'zustand'
import { listarMediosPago } from '@/api/medios_pago_api'

// Cuentas de transferencia asignables (GET /medios-pago/?asignables=1).
// Se comparten entre todos los módulos que usen MedioPagoSelector para no
// repetir la petición en cada modal.
const useMediosPagoStore = create((set, get) => ({
  cuentas: [],
  cargando: false,
  // Distingue "todavía no se pidió" de "se pidió y no hay cuentas", para no
  // mostrar el aviso de "sin cuentas" durante el primer render.
  cargado: false,
  error: null,

  // Carga las cuentas asignables.
  // - No vuelve a pedir si ya hay datos en el store.
  // - force = true ignora esa caché y vuelve a consultar.
  // - Si ya hay una petición en curso, no lanza otra.
  cargarCuentas: async (force = false) => {
    const { cuentas, cargando } = get()

    if (cargando) return
    if (!force && cuentas.length > 0) return

    set({ cargando: true, error: null })
    try {
      const res = await listarMediosPago({ asignables: 1 })
      const data = res.data
      const lista = Array.isArray(data) ? data : data?.datos || []
      set({ cuentas: lista, cargando: false, cargado: true })
    } catch (err) {
      set({
        error:
          err.response?.data?.mensaje ||
          err.response?.data?.error ||
          'Error al cargar las cuentas de transferencia',
        cargando: false,
        cargado: true,
      })
    }
  },
}))

export default useMediosPagoStore
