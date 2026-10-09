// Formato de cifras para las tarjetas KPI del panel.
//
// Vive aparte del componente para no romper Fast Refresh: un archivo que exporta
// componentes Y funciones deja de ser "solo componentes" y React pierde la
// actualización en caliente. Además, así el formato se puede reutilizar (tablas,
// totales, exportaciones) sin arrastrar el componente.

// Formatea con separadores de miles. `decimales` permite fijar 0 o 2.
export const formatoMoneda = (valor, decimales = 0) =>
  new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(Number(valor) || 0);

// Abrevia cifras muy grandes para que quepan sin recortarse:
//   1.234         -> 1.234
//   12.345        -> 12.345
//   1.234.567     -> 1,23 M
//   12.345.678    -> 12,3 M
//   123.456.789   -> 123 M
//   1.234.567.890 -> 1,23 MM
export const formatoCompacto = (valor) => {
  const n = Number(valor) || 0;
  const abs = Math.abs(n);
  if (abs < 1_000_000) return formatoMoneda(n);
  if (abs < 1_000_000_000) {
    const millones = n / 1_000_000;
    const decimales = Math.abs(millones) >= 100 ? 0 : Math.abs(millones) >= 10 ? 1 : 2;
    return `${formatoMoneda(millones, decimales)} M`;
  }
  return `${formatoMoneda(n / 1_000_000_000, 2)} MM`;
};

// Escala el tamaño de fuente según la longitud del texto ya formateado, para que
// una cifra de 7 dígitos y otra de 12 convivan en la misma rejilla sin
// recortarse. Se usan clases de Tailwind (no `style`) para respetar el
// responsive existente.
export const clasesPorLongitud = (texto) => {
  const largo = String(texto).length;
  if (largo <= 8) return 'text-lg sm:text-2xl lg:text-[26px]';
  if (largo <= 11) return 'text-base sm:text-xl lg:text-[22px]';
  if (largo <= 14) return 'text-sm sm:text-lg lg:text-[19px]';
  return 'text-xs sm:text-base lg:text-[16px]';
};
