export const capitalizarNombre = (texto) => {
  if (!texto) return ''
  return texto
    .toLowerCase()
    .replace(/(?:^|\s)\S/g, (letra) => letra.toUpperCase())
}