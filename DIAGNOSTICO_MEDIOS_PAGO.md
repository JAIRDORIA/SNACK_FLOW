# Diagnóstico de medios de pago — Frontend Delis

- **Tipo:** diagnóstico de solo lectura (no se modificó código).
- **Fecha:** 2026-10-18.
- **Rama:** `feature/cuentasfronend` (creada desde `origin/main`, commit `43e3956`).
- **Alcance:** `src/` completo del proyecto `delis-frontend` (React 19 + Vite + zustand + axios).
- **Formato:** hallazgos por pregunta, con archivo, componente y líneas. Sin propuestas de solución.

> Nota: al crear la rama, el working tree ya tenía un cambio sin commitear en
> `src/pages/balance/Balance.jsx` (2 líneas de clases CSS); se conservó tal cual.

---

## 1. Todos los lugares donde el usuario elige el medio de pago

### a) Crear venta con abono inicial

**Archivo:** `src/components/nuevaVentaModal.jsx` (componente `NuevaVentaModal`)
**Store:** `src/store/useNuevaVentaStore.js`
**Endpoint:** `POST /ventas/`

- **Control:** `<select>` nativo **por cada fila de abono** (líneas 969–982).
  Las opciones salen de la constante `MEDIOS_PAGO = ["efectivo", "transferencia", "otro"]`
  (línea 17) y el label se capitaliza con `charAt` (línea 979).
- **Estado:** zustand, `abonosIniciales: [{ monto, medio_pago, observacion }]`
  (`useNuevaVentaStore.js:39`). Default `'efectivo'` al agregar fila (línea 45) y en
  `pagarCompleto` (línea 86). Se modifica con `modificarAbonoInicial(index, campo, valor)`
  (líneas 54–60).
- **Payload:** `payload.abonos_iniciales = [{ monto, medio_pago, observacion }]`,
  solo filas con `monto > 0` (`useNuevaVentaStore.js:287–295`), dentro del
  `POST /ventas/` (línea 308).

### b) Registrar abono

**Archivo:** `src/components/NuevoAbonoModal.jsx` (componente `NuevoAbonoModal`)
**Store:** `src/store/useAbonosModuleStore.js`
**Endpoint:** `POST /abonos/` (`src/api/abonos_api.js:7`)

- **Control:** `<select>` (líneas 222–228) con `Efectivo / Transferencia / Otro`.
- **Estado:** `useState` local `medioPago`, default `'efectivo'` (línea 15);
  se resetea al cerrar el modal (línea 37).
- **Payload** (líneas 91–100):

  ```js
  {
    venta_id, corte_id: balance.corte_id, usuario_id: 1,
    monto, fecha: 'dd/mm/yyyy', medio_pago, observacion
  }
  ```

  `usuario_id` está hardcodeado en `1` (línea 94).
  Se envía vía `crearAbono` (`useAbonosModuleStore.js:28–31`).

### c) Editar abono — **no existe**

- `src/api/abonos_api.js` solo expone `GET /abonos/`, `POST /abonos/` y
  `DELETE /abonos/{id}` (líneas 4–9). No hay `PUT` ni `PATCH`.
- `src/pages/abonos/Abonos.jsx` solo permite borrar: botón (líneas 126–131) y modal
  de confirmación (líneas 169–192) → `eliminarAbono`
  (`useAbonosModuleStore.js:33–35`).

### d) Crear y editar compra

**Archivo:** `src/pages/compras/Compras.jsx`, componente `ModalCompra` (líneas 71–238).
Es el mismo modal para ambos modos (`compra ? 'Editar Compra' : 'Nueva Compra'`, línea 121).
**Store:** `src/store/useComprasStore.js`

- **Control:** `<select>` (líneas 200–206) con `Efectivo / Transferencia / Otro`.
- **Estado:** `useState` local `form.medio_pago`, default
  `compra?.medio_pago || 'efectivo'` (línea 79); cambio genérico con `handleChange`
  (líneas 84–85).
- **Payload crear** (`useComprasStore.js:53–66`):
  `{ proveedor_id, total, fecha, medio_pago, descripcion, usuario_id }` → `POST /compras/`.
- **Payload editar** (`useComprasStore.js:68–81`): los mismos campos →
  `PUT /compras/{id}`.

### e) Crear préstamo

**Archivo:** `src/components/nuevoprestamomodal.jsx` (componente `NuevoPrestamoModal`)
**Store:** `src/store/Useprestamosstore.js`
**Endpoint:** `POST /prestamos/` (`src/api/prestamos_api.js:10`)

- **Control:** **botones tipo segmented** (no `<select>`), dentro de un `fieldset`
  (líneas 284–313). Itera `MEDIOS_PAGO = [{ value, label, icon }]` (líneas 20–23)
  con iconos `Banknote` / `ArrowLeftRight`. Solo dos opciones: efectivo y transferencia.
- **Estado:** `useState` local `medioPago`, default `'efectivo'` (línea 33);
  reset en `resetForm` (línea 81).
- **Payload** (líneas 105–111):
  `{ cliente_id, usuario_id, monto, medio_pago, observacion }` →
  `nuevoPrestamo` (`Useprestamosstore.js:29–37`).

### f) Abonar préstamo

**Archivo:** `src/components/Pagarprestamomodal.jsx` (componente `AbonarPrestamoModal`)
**Store:** `src/store/Useprestamosstore.js`
**Endpoint:** `POST /prestamos/{id}/abonos` (`src/api/prestamos_api.js:18–19`)

- **Control:** `<select>` (líneas 92–100), solo `Efectivo / Transferencia`.
- **Estado:** `useState` local `medioPago`, default `'efectivo'` (línea 9).
- **Payload** (líneas 36–41):
  `{ usuario_id, monto, medio_pago, observacion }` → `abonar`
  (`Useprestamosstore.js:40–50`).

### Adicional: editar venta

`src/components/EditarVentaModal.jsx` + `src/store/useEditarVentaStore.js`
**no manejan medio de pago** (0 coincidencias de `medio`, `pago` o `abono` en ambos
archivos). Solo envían `PUT /ventas/{id}/detalle` con `detalle`, fecha y hora
(`useEditarVentaStore.js:123`).

---

## 2. ¿Existe un componente reutilizable para el selector de medio de pago?

**No.** No hay ningún `MedioPagoSelect`, `PaymentMethodSelect` ni equivalente en
`src/components/`. El mismo concepto está escrito 5 veces con 3 implementaciones distintas:

| Lugar | Tipo de control | Constante / opciones | ¿Incluye "otro"? |
|---|---|---|---|
| `nuevaVentaModal.jsx:969–982` | `<select>` | `MEDIOS_PAGO` array de strings (línea 17) | Sí |
| `NuevoAbonoModal.jsx:222–228` | `<select>` | `<option>` inline | Sí |
| `Compras.jsx:200–206` | `<select>` con `style` inline | `<option>` inline | Sí |
| `nuevoprestamomodal.jsx:284–313` | Botones (`aria-pressed`) | `MEDIOS_PAGO` con iconos (20–23) | No |
| `Pagarprestamomodal.jsx:92–100` | `<select>` | `<option>` inline | No |

Duplicación también en la **presentación** (badges de solo lectura):

- `TIPO_CONFIG` en `Ventas.jsx:74–78`.
- Lógica inline de colores en `Abonos.jsx:117–122`.
- Lógica inline de colores en `Ventas.jsx:1410–1424`.

---

## 3. Capa de llamadas a la API y datos compartidos

### Cliente HTTP

**Archivo:** `src/api/axios.js`

- Instancia única de axios con
  `baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:4000'` (línea 4) y
  `Content-Type: application/json` (líneas 5–7).
- Interceptor de request: token desde `localStorage.getItem("access_token")` →
  `Authorization: Bearer` (líneas 11–17).
- Interceptor de response: en 401 (excepto `/auth/login`) borra `access_token` y
  `usuario` y redirige a `/login` (líneas 20–34).

### Servicios

Un archivo por dominio en `src/api/` (17 archivos): `ventas_api.js`,
`abonos_api.js`, `compras_api.js`, `prestamos_api.js`, `cortes_api.js`,
`balance_api.js`, `clientes_api.js`, `auditoria_api.js`, `inventario_api.js`,
`pedidoscocinaapi.js`, `prestamos_api.js`, `produccionapi.js`,
`produccionadminapi.js`, `producciones_api.js`, `productos_api.js`,
`proveedores_api.js`, `empleadosapi.js`.

Observaciones de estructura:

- **Duplicación:** `getBalance` existe en `balance_api.js:4` y en `cortes_api.js:3`.
- Varias llamadas **no pasan** por `src/api/*` y van directo al axios desde
  stores/componentes:
  - `useNuevaVentaStore.js:308` → `POST /ventas/`
  - `useNuevaVentaStore.js:148` → `GET /combos/`
  - `NuevoAbonoModal.jsx:69` → `GET /ventas/?cliente_id=`
  - `useEditarVentaStore.js:123` → `PUT /ventas/{id}/detalle`
  - `useBalanceStore.js:36` → `GET /ventas/?limite=200/`

### Estado compartido

- Solo **zustand**. No hay React Context, ni React Query/TanStack, ni Redux, ni SWR:
  `src/main.jsx` renderiza `<App />` con `StrictMode` sin providers, y `src/App.jsx`
  solo monta `BrowserRouter`/`Routes`.
- 19 stores en `src/store/`: `useVentaStore`, `useNuevaVentaStore`,
  `useAbonosModuleStore`, `useAbonoStore`, `useComprasStore`, `Useprestamosstore`,
  `useBalanceStore`, `useDashboardStore`, `useInventarioStore`, `useEmpleadosStore`,
  `useProveedoresStore`, `useAuditoriaStore`, `useProduccionStore`,
  `usePorConfirmarStore`, `usePorValidarProduccionStore`, `Usepedidoscocinastore`,
  `useEditarVentaStore`, `customerService`, `productService`.
- Sesión fuera del estado global: `localStorage` (`access_token`, `usuario`), leída
  directamente en componentes (`Pagarprestamomodal.jsx:6`,
  `nuevoprestamomodal.jsx:27`, `App.jsx:19–23`).

### Dónde están hoy los "medios de pago" como dato

- **No existe** catálogo, endpoint, constante compartida ni store de medios de pago.
- Los valores viven hardcodeados en los 5 puntos de la pregunta 1:
  `nuevaVentaModal.jsx:17`, `nuevoprestamomodal.jsx:20–23`,
  `NuevoAbonoModal.jsx:225–227`, `Compras.jsx:203–205`,
  `Pagarprestamomodal.jsx:98–99`.
- Defaults en stores: `useNuevaVentaStore.js:45,86` y `useComprasStore.js:59,75`.
- `src/utils/` solo contiene 4 helpers (`exportarExcel`, `formatearFecha`,
  `formatearTexto`, `formatoCifras`); no hay carpeta de constantes/config.

---

## 4. Pantalla de Balance

- **Archivo:** `src/pages/balance/Balance.jsx` (666 líneas).
- **Store:** `src/store/useBalanceStore.js`.
- **Endpoint:** `GET /cortes/balance` (`src/api/balance_api.js:4`).
- **Componente de tarjeta:** `src/components/KpiCard.jsx` (prop `currency`).

### Tarjetas KPI

Definidas en `kpiCards` (líneas 46–55) y renderizadas con `<KpiCard>` en 145–157.

| Card (label) | Valor | Campo de `GET /cortes/balance` | Línea |
|---|---|---|---|
| **"Total en caja"** | `totalCaja` | **`dinero_caja_real`** | 39 y 47 |
| **"Efectivo en caja"** | `efectivo` | **`total_efectivo`** | 37 y 50 |
| **"Transferencias"** | `transferencias` | **`total_transferencia`** | 38 y 51 |
| "Total en Compras" | `total_compras` | `total_compras` | 43 y 48 |
| "Saldo inicial" | `saldoInicial` | `saldo_inicial` | 42 y 49 |
| "Ventas del corte" | `totalVentas` | `total_ventas` | 40 y 52 |
| "Saldo pendiente" | `saldoPendiente` | `saldo_pendiente_ventas` | 41 y 53 |
| "Deuda cortes anteriores" | inline | `saldo_pendiente_anteriores` | 54 |

Iconos: `DollarSign` (Total en caja), `Wallet` (Efectivo en caja), `CreditCard`
(Transferencias) — líneas 47, 50 y 51.

### Otras piezas de la pantalla

- **Header:** corte actual con `balance?.corte_numero` y `fecha_inicio` (línea 125);
  botón "Cerrar corte" (128–138).
- **"Resumen del próximo corte":** no viene de `/cortes/balance`; se arma con
  `GET /cortes/` filtrado `estado === 'futuro'` + `GET /ventas?corte_id=`
  (`useBalanceStore.js:105–139`).
- **"Ventas pendientes de cortes anteriores":** `GET /ventas/?limite=200/`
  filtrado en cliente (`useBalanceStore.js:32–48`).
- **Historial de cortes:** `GET /cortes/historial?limite=10` (`balance_api.js:7`),
  tabla en líneas 300–350.
- **Modal "Detalle del Corte"** (líneas 354–420): **no usa `/cortes/balance`**.
  Recalcula `totalVentas`, `totalCompras` y `utilidad` paginando `GET /ventas` y
  `GET /compras` (`useBalanceStore.js:77–103`). No muestra efectivo ni transferencia.
- **Duplicación en Dashboard:** `src/pages/dashboard/Dashboard.jsx:33–46` repite las
  cards "Total de Dinero en Efectivo" (`total_efectivo`) y "Dinero en Transferencia"
  (`total_transferencia`), y su card de caja usa **`dinero_caja`** (línea 14), no
  `dinero_caja_real` como en Balance.

---

## 5. Dónde se muestra el medio de pago

### Abonos

**Archivo:** `src/pages/abonos/Abonos.jsx`

- Columna **"Medio"** en la tabla: header línea 99; celda 116–123 con badge de color
  (`efectivo` → emerald, `transferencia` → blue, resto → gray) y el valor crudo en
  minúsculas (línea 121).
- El buscador incluye el medio: `a.medio_pago?.toLowerCase().includes(q)` (línea 44).
- No hay vista de detalle ni recibo por abono; solo modal de eliminar (169–192).

### Compras

**Archivo:** `src/pages/compras/Compras.jsx`

- Columna **"MEDIO DE PAGO"**: header línea 453, celda 482–484 con texto crudo
  (`c.medio_pago`).
- Las cards móviles (501–539) **no** muestran medio de pago.
- No hay modal de detalle de compra (solo editar/eliminar).

### Préstamos

**Archivo:** `src/pages/prestamos/prestamos.jsx`

- **No se muestra en ningún lado.** Columnas de la tabla (222–233): Cliente,
  Monto prestado, Abonado, Saldo pendiente, Observación, Estado, Fecha, Acciones.
  Ni el préstamo ni sus abonos exponen `medio_pago` en la UI.
- Existe la capacidad sin usar: `obtenerHistorialAbonos`
  (`Useprestamosstore.js:52–59`) y `GET /prestamos/{id}/abonos`
  (`prestamos_api.js:13–14`), pero ningún componente las llama.

### Comprobante / venta

**Archivo:** `src/pages/Ventas/Ventas.jsx`

- **Listado:** la insignia de pago no viene de la venta, se deriva del **primer
  abono** (`useAbonoStore.js:23–24`; `Ventas.jsx:164`, `809–810`, `872–879`), con
  etiquetas y colores de `TIPO_CONFIG` (74–78). Si el valor es `sin_pago`, `error` o
  `debe`, no se pinta nada.
- **Modal de detalle** ("Historial de abonos"): columnas
  `Fecha / Monto / Medio de pago / Observación` (1349–1360); celda 1409–1424 con
  lógica inline de color (efectivo vs. cualquier otro) y valor crudo.
- **Modal de comprobante:** sección "Abonos registrados" con `Fecha / Monto / Medio`
  (1679–1697); celda 1714–1719 con `abono.medio_pago` crudo.
- **Impresión del comprobante** (`imprimirComprobante`, 247–348, abre
  `window.open`): tabla de abonos con `<th>Medio</th>` (línea 322) y
  `<td>${a.medio_pago}</td>` (línea 330).
- El comprobante **no** muestra un medio de pago propio de la venta (solo los de
  sus abonos).

---

## 6. Librería de UI y de modales

- **Estilos:** Tailwind CSS v4 (`package.json:27` `tailwindcss`,
  `package.json:24` `@tailwindcss/vite`; `src/index.css:1` `@import "tailwindcss"`).
  Además hay mucho `style={{ ... }}` inline (p. ej. `Compras.jsx:101–107`,
  `Balance.jsx:118`).
- **Iconos:** `lucide-react@^1.17.0` (`package.json:15`), importados uno a uno en
  cada archivo.
- **Resto de dependencias UI:** ninguna. No hay MUI, Ant Design, Chakra, Bootstrap,
  Headless UI, Radix ni Framer Motion.
  - `src/index.css:5–9` fija la fuente `'Outfit'`.
  - `Compras.jsx:111` fuerza `'Montserrat','Poppins'` inline (inconsistencia).

### Modales

- **No hay librería de modales** (ni `react-modal`, ni `sweetalert`, ni portales).
- Todos son `div` propios con `fixed inset-0 ... z-50` + `backdrop-blur`:
  **30 overlays en 18 archivos**:
  `combosmanager.jsx`, `CrearClienteModal.jsx`, `CustomersManager.jsx`,
  `EditarVentaModal.jsx`, `ConfirmarDesactivarModal.jsx`, `EmpleadoFormModal.jsx`,
  `layout.jsx`, `nuevaVentaModal.jsx`, `NuevoAbonoModal.jsx`,
  `nuevoprestamomodal.jsx`, `Pagarprestamomodal.jsx`,
  `ModalValidarProduccion.jsx`, `ProductsManager.jsx`, `Abonos.jsx`, `Balance.jsx`,
  `panelcocina.jsx`, `RegistrarProduccionModal.jsx`, `Ventas.jsx`.
- Cada uno maneja su propio cierre:
  - con `Escape`: `nuevoprestamomodal.jsx:63–70`, `Ventas.jsx:197–204`.
  - con click en overlay: `nuevoprestamomodal.jsx:127`.
  - la mayoría no implementa ninguno de los dos.
  - Sin focus trap ni bloqueo de scroll consistente.

### Feedback

- Mensajes de error/éxito inline en cada modal.
- `alert()` nativo en `Abonos.jsx:33` y `Balance.jsx:111`.
- Existe `src/components/Toast.jsx` en el proyecto.

---

## Resumen de hallazgos estructurales

1. No hay componente ni constante compartida de medios de pago: 5 implementaciones,
   3 estilos de control y opciones distintas (2 de ellas sin "otro").
2. Los medios de pago están hardcodeados en componentes y stores; no hay endpoint
   ni catálogo.
3. Dos stores distintos de abonos (`useAbonoStore` para el badge del listado de
   ventas, `useAbonosModuleStore` para el módulo de abonos) y dos `getBalance`
   duplicados (`balance_api.js` / `cortes_api.js`).
4. El medio de pago de una venta no es un campo propio: se infiere del primer abono.
5. Editar abono no existe en API ni en UI; editar venta no toca medios de pago.
6. Préstamos guarda y envía `medio_pago` pero nunca lo muestra.
7. Balance usa `dinero_caja_real`; Dashboard usa `dinero_caja` para la misma idea.
8. Sin React Query ni Context: todo el estado servidor/cliente vive en zustand.
9. Sin librería de UI ni de modales: Tailwind + lucide-react + overlays a mano.
