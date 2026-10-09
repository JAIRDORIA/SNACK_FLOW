import { formatoMoneda, formatoCompacto, clasesPorLongitud } from '@/utils/formatoCifras';

// Tarjeta KPI compartida por los módulos del panel (Balance, Ventas, etc.).
//
// El problema que resuelve: con cifras grandes (p. ej. $12.345.678) el número se
// salía de la tarjeta o se recortaba con puntos suspensivos. La guía del skill
// lo marca como crítico ("no clip text in fixed-width or fixed-height boxes"),
// así que aquí el número:
//
//   1. Se formatea con separadores de miles (Intl.NumberFormat, locale es-CO).
//   2. Ocupa una línea propia a ancho completo: el icono y la etiqueta van
//      arriba, así que no le roban espacio horizontal.
//   3. Ajusta su tamaño de fuente según cuántos caracteres tenga, para que una
//      cifra de 7 dígitos y otra de 12 convivan en la misma rejilla.
//   4. Lleva siempre el valor exacto en `title` y `aria-label`.
//
// Estilo "financial-dashboard" (hereda de data-dense-dashboard): jerarquía clara
// entre etiqueta y cifra, formato de moneda y cifras tabulares para poder
// comparar columnas.
//
// Los helpers de formato viven en `@/utils/formatoCifras` para que este archivo
// solo exporte un componente (si no, se rompe Fast Refresh).

/**
 * @param {string}   label     Texto que describe la cifra.
 * @param {number}   value     Valor numérico.
 * @param {Function} icon      Componente de lucide-react.
 * @param {string}   ring      Clase del anillo del icono (p. ej. 'ring-emerald-500/40').
 * @param {string}   iconCol   Clase de color del icono.
 * @param {boolean}  currency  Si true, antepone '$'.
 * @param {boolean}  compact   Si true, abrevia cifras >= 1.000.000; el valor
 *                             exacto queda en el tooltip.
 * @param {string}   hint      Texto secundario opcional.
 */
export default function KpiCard({
  label,
  value,
  icon,
  ring = 'ring-indigo-500/40',
  iconCol = 'text-indigo-300',
  currency = false,
  compact = false,
  hint,
}) {
  const Icono = icon;

  const numero = compact ? formatoCompacto(value) : formatoMoneda(value);
  const texto = currency ? `$${numero}` : numero;
  // El tooltip y los lectores de pantalla reciben SIEMPRE la cifra completa,
  // aunque en pantalla se muestre abreviada.
  const completo = currency ? `$${formatoMoneda(value)}` : formatoMoneda(value);

  return (
    <div className="bg-[#1B1D2E] rounded-2xl p-3 sm:p-4 lg:p-5 flex flex-col gap-2 sm:gap-3 hover:scale-[1.02] transition-transform min-w-0">
      {/* Fila superior: icono + etiqueta, para dejarle la línea entera a la cifra. */}
      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
        <div
          className={`bg-[#13152280] ring-2 ${ring} w-8 h-8 lg:w-9 lg:h-9 rounded-xl flex items-center justify-center shrink-0`}
        >
          <Icono size={16} className={iconCol} aria-hidden="true" />
        </div>
        <p className="text-[10px] sm:text-[11px] font-semibold text-white/55 uppercase tracking-wide leading-tight m-0 min-w-0">
          {label}
        </p>
      </div>

      {/* Cifra: completa, con tamaño adaptativo y sin recortar. */}
      <p
        className={`font-bold text-white tabular-nums leading-none m-0 break-words ${clasesPorLongitud(
          texto,
        )}`}
        title={completo}
        aria-label={`${label}: ${completo}`}
      >
        {texto}
      </p>

      {hint && <p className="text-[10px] text-white/40 m-0 leading-tight">{hint}</p>}
    </div>
  );
}
