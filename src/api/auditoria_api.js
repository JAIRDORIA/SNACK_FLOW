import api from './axios'

export const getAuditoria = (pagina = 1, limite = 20) =>
  api.get(`/auditoria/?pagina=${pagina}&limite=${limite}`)