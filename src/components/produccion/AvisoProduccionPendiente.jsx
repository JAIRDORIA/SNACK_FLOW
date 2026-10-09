import { useEffect, useState } from 'react';
import { ClipboardCheck, AlertTriangle } from 'lucide-react';
import { usePorValidarProduccionStore } from '@/store/usePorValidarProduccionStore';
import ModalValidarProduccion from '@/components/produccion/ModalValidarProduccion';

// Aviso (solo admin) de producciones registradas por empleados que todavía NO
// entraron al inventario, más el modal para validarlas.
//
// Se monta justo debajo del aviso "por confirmar" (pedidos que cocina ya
// entregó) dentro del panel admin, siguiendo el mismo patrón: banner compacto
// + modal de listado, con polling silencioso.
//
// Mismo intervalo que el aviso "por confirmar": 30 s, pausado con la pestaña
// oculta y con fallo silencioso ante errores de red.
const INTERVALO_MS = 30000;

export default function AvisoProduccionPendiente() {
  const { producciones, total, fetchProducciones } = usePorValidarProduccionStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [esAdmin, setEsAdmin] = useState(false);

  // Solo admin. Se resuelve en un efecto para no leer localStorage durante el
  // render y para que el polling ni siquiera se dispare con otro rol.
  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
    setEsAdmin(usuario?.rol === 'admin');
  }, []);

  // Carga inicial + refresco cada 30 s (silencioso, sin spinner).
  // Se pausa con la pestaña oculta para no gastar peticiones.
  useEffect(() => {
    if (!esAdmin) return;

    fetchProducciones({ silent: true });

    const intervalo = setInterval(() => {
      if (document.hidden) return;
      fetchProducciones({ silent: true });
    }, INTERVALO_MS);

    return () => clearInterval(intervalo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [esAdmin]);

  // Con otro rol no se muestra ni se consulta nada.
  if (!esAdmin) return null;

  // El modal debe sobrevivir a que el conteo llegue a 0: al aceptar o rechazar
  // la última producción, `total` pasa a 0 y el banner desaparece, pero el modal
  // sigue abierto mostrando el mensaje de éxito y el estado vacío. Por eso el
  // `return` temprano condiciona solo el banner, nunca el modal.
  const cantidad = total ?? producciones.length;

  return (
    <>
      {cantidad > 0 && (
        <div className="bg-sky-50 border border-sky-200 rounded-2xl mb-8 p-5">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={20} className="text-sky-600" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-[240px]">
              <p className="text-sky-800 font-bold text-sm m-0">
                {cantidad} {cantidad === 1 ? 'producción' : 'producciones'} por validar
              </p>
              <p className="text-sky-700/90 text-sm mt-0.5 m-0">
                Los empleados registraron bandejas que todavía no entran al inventario.
                Revisalas y aceptalas o rechazalas.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-md shadow-indigo-500/30 active:scale-95 p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 cursor-pointer"
            >
              <ClipboardCheck className="w-4 h-4" aria-hidden="true" />
              <span className="text-sm">Revisar</span>
            </button>
          </div>
        </div>
      )}

      <ModalValidarProduccion open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
