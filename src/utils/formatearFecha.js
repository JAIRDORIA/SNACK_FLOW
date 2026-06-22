/**
 * Convierte una fecha de la base de datos a hora de Colombia.
 * 
 * @param {string} fechaStr - Fecha en formato "YYYY-MM-DD HH:MM:SS" (UTC)
 * @param {boolean} incluirHora - Si se debe mostrar la hora
 * @returns {string} Fecha formateada en hora Colombia
 */
export const formatearFechaColombia = (fechaStr, incluirHora = true) => {
  if (!fechaStr) return '—'
  
  try {
    // Si la fecha viene en formato MySQL (YYYY-MM-DD HH:MM:SS o YYYY-MM-DD)
    let fecha
    
    if (fechaStr.includes('T')) {
      // Formato ISO 8601 (2026-06-19T01:59:02)
      fecha = new Date(fechaStr)
    } else if (fechaStr.includes('-') && fechaStr.includes(':')) {
      // Formato MySQL datetime (2026-06-19 01:59:02)
      // Lo interpretamos como UTC
      fecha = new Date(fechaStr + ' UTC')
    } else {
      // Solo fecha (2026-06-19)
      fecha = new Date(fechaStr + 'T00:00:00')
    }
    
    if (isNaN(fecha.getTime())) {
      return fechaStr // Si no se puede parsear, devolver como está
    }
    
    // Opciones de formato para Colombia
    const opciones = {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      ...(incluirHora && {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })
    }
    
    return new Intl.DateTimeFormat('es-CO', opciones).format(fecha)
    
  } catch (error) {
    console.error('Error al formatear fecha:', error)
    return fechaStr
  }
}

/**
 * Convierte una fecha a formato corto (solo fecha).
 */
export const formatearFechaCorta = (fechaStr) => {
  return formatearFechaColombia(fechaStr, false)
}