import * as XLSX from 'xlsx'

export const exportarAExcel = (datos, nombreArchivo, columnas) => {
  // Crear array con los datos formateados
  const dataFormateada = datos.map(item => {
    const fila = {}
    columnas.forEach(col => {
      fila[col.label] = col.format ? col.format(item) : item[col.key]
    })
    return fila
  })

  const worksheet = XLSX.utils.json_to_sheet(dataFormateada)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos')
  XLSX.writeFile(workbook, `${nombreArchivo}.xlsx`)
}