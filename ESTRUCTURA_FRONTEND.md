# SnackFlow — Estructura del Frontend

Documento de referencia de **cómo está organizado el frontend** (React + Vite + Tailwind + Zustand).
Explica qué hace cada carpeta y archivo, y muestra un mapa visual de la organización.

> Backend: Flask + MySQL. Este documento cubre **solo el frontend**.

---

## 1. Mapa general (árbol del proyecto)

```
delis-frontend/
│
├── index.html                  # HTML raíz. Monta <div id="root"> y carga src/main.jsx
├── package.json                # Dependencias y scripts (dev, build, lint, preview)
├── vite.config.js              # Config de Vite: plugins React + Tailwind, alias "@" -> ./src
├── jsconfig.json               # Alias "@/*" para el editor (autocompletado)
├── eslint.config.js            # Reglas de ESLint
├── vercel.json                 # Rewrites para SPA en Vercel (todo -> index.html)
├── README.md                   # Notas básicas del proyecto
├── SnackFlow_contexto.md       # Contexto técnico global (backend + negocio)
├── ESTRUCTURA_FRONTEND.md      # << ESTE ARCHIVO >> mapa del frontend
│
├── public/                     # Archivos estáticos servidos tal cual (sin procesar)
│   ├── SNACKFLOW_LOGO_BLANCO.png
│   ├── icono.png
│   ├── icono2.png              # Favicon (referenciado en index.html)
│   └── auditoria.jpg
│
├── scripts/                    # Utilidades de desarrollo (NO forman parte del bundle)
│   └── migrate-margin-padding.mjs
│
├── dist/                       # Salida del build (generada por `npm run build`) — no editar
│
└── src/                        # ★ CÓDIGO FUENTE ★
    ├── main.jsx                # Punto de entrada: createRoot + <App/> + index.css
    ├── App.jsx                 # Router principal + guardas de ruta (RutaProtegida)
    ├── index.css               # Tailwind + estilos globales (fuente Outfit, fondo)
    │
    ├── api/                    # Capa HTTP (una función por endpoint)
    ├── store/                  # Estado global (Zustand) — un store por módulo
    ├── components/             # Componentes reutilizables (layout, modales, tablas…)
    ├── pages/                  # Páginas/vistas (una carpeta por módulo)
    ├── hooks/                  # Custom hooks
    └── utils/                  # Funciones auxiliares (fechas, texto, Excel)
```

---

## 2. Raíz del proyecto (archivos de configuración)

| Archivo | Para qué sirve |
|---|---|
| `index.html` | Documento HTML único. Define el `<div id="root">`, carga la fuente *Outfit* y el favicon, y arranca `src/main.jsx`. |
| `package.json` | Dependencias (`react`, `react-router-dom`, `zustand`, `axios`, `lucide-react`, `xlsx`) y scripts: `dev`, `build`, `lint`, `preview`. |
| `vite.config.js` | Configuración de Vite. Registra `@vitejs/plugin-react` y `@tailwindcss/vite`, y define el alias **`@` → `./src`**. |
| `jsconfig.json` | Le dice al editor que `@/*` apunta a `./src/*` (autocompletado e importaciones). |
| `eslint.config.js` | Reglas de lint del proyecto. |
| `vercel.json` | Rewrite `/(.*) → /index.html` para que las rutas del SPA funcionen al recargar. |
| `SnackFlow_contexto.md` | Contexto técnico global (cortes, inventario, combos, préstamos, roles, etc.). |
| `public/` | Estáticos servidos sin transformación (logos, favicon). Se referencian con `/archivo.png`. |
| `dist/` | Resultado del build. **Autogenerado**, no se edita a mano. |
| `scripts/` | Scripts de utilidad para desarrollo; no entran al bundle. |

### Alias de importación
Gracias al alias configurado en `vite.config.js` (y `jsconfig.json`) se puede importar así:

```js
import api from '@/api/axios'            // en vez de '../../api/axios'
import Dashboard from '@/pages/dashboard/Dashboard'
```

> Nota: en el código conviven importaciones con `@/...` y con rutas relativas (`./`, `../`). Ambos funcionan; el alias es el preferido.

---

## 3. `src/` — el código fuente en detalle

### 3.1 Punto de entrada y ruteo

```
src/
├── main.jsx      → createRoot(document.getElementById('root')) + <StrictMode><App/></StrictMode>
├── App.jsx       → <BrowserRouter> + todas las <Routes> + guardas
└── index.css     → @import "tailwindcss" + estilos globales
```

**`App.jsx` es el corazón de la navegación.** Define:

- **`RutaProtegida`** (`App.jsx`): valida el token (`localStorage.access_token`), aplica el
  temporizador de inactividad y restringe por rol (`rolesPermitidos`). Si el rol es `cocina`,
  redirige a `/cocina`; si no, a `/`.
- **Rutas principales:**

| Ruta | Página | Roles | Layout |
|---|---|---|---|
| `/login` | `Login` | público | — |
| `/primer-corte` | `PrimerCorte` | admin | — |
| `/cocina` | `PanelCocina` | cocina | sin sidebar |
| `/` | `Layout` (con `Outlet`) | admin, cajero | con sidebar/header |

- **Sub-rutas de `/` (dentro del `Layout`):**
  `index → Dashboard`, `ventas`, `clientes`, `inventario/productos`, `inventario/ver`,
  `inventario/combos`, `compras`, `balance`, `cortes`, `abonos`, `prestamos`,
  `proveedores`, `auditoria`.
- Cualquier ruta desconocida (`*`) redirige a `/login`.

---

### 3.2 `src/api/` — Capa de acceso al backend (HTTP)

Una función por endpoint. Todas usan la instancia central de axios.

```
src/api/
├── axios.js               # ★ Instancia de axios + interceptores (token y 401)
├── abonos_api.js
├── auditoria_api.js
├── balance_api.js
├── clientes_api.js
├── compras_api.js
├── cortes_api.js
├── inventario_api.js
├── pedidoscocinaapi.js    # Panel de cocina (GET pedidos, PUT entregar)
├── prestamos_api.js
├── producciones_api.js
├── productos_api.js
├── proveedores_api.js
└── ventas_api.js
```

- **`axios.js`** crea la instancia con `baseURL: VITE_API_URL || http://127.0.0.1:4000`, y añade:
  - Interceptor de **request**: inyecta `Authorization: Bearer <access_token>`.
  - Interceptor de **response**: ante `401` (fuera del login) limpia sesión y manda a `/login`.
- Los demás archivos exportan funciones que devuelven promesas, ej.:

```js
// src/api/ventas_api.js
export const getVentas = (pagina = 1, limite = 20, corte_id = null, q = '') => { ... }
export const postVenta  = (data) => api.post('/ventas/', data)
export const putVenta   = (id, data) => api.put(`/ventas/${id}`, data)
export const anularVenta = (id) => api.put(`/ventas/${id}/anulacion`)
```

> Patrón: **`api/` nunca maneja estado ni UI**, solo hace la llamada y devuelve la respuesta.

**Nota (paginación y búsqueda, 2026-11-03):** `listarPrestamos`, `getProveedores`, `getInventario` y `getProductos` aceptan `pagina`, `limite` y `q` como parámetros. `GET /prestamos/` ahora devuelve `{ datos, total, pagina, limite, total_paginas }` (ya no un array) y `GET /proveedores/` añade `pagina/limite/total_paginas`. Los selects de proveedores usan `getProveedoresActivos()` (`/proveedores/activos`). Para catálogos completos de productos existe `getTodosLosProductos()`, que recorre páginas de 200 (el máximo permitido) en vez de pedir un límite mayor.

---

### 3.3 `src/store/` — Estado global (Zustand)

Un store por módulo (patrón `use<Modulo>Store`). Guardan estado, llaman a `api/` y exponen
acciones. Los componentes consumen con selectores.

```
src/store/
├── customerService.js         # Lógica de clientes (helper, no store)
├── productService.js          # Lógica de productos (helper, no store)
├── useAbonosModuleStore.js
├── useAbonoStore.js
├── useAuditoriaStore.js
├── useBalanceStore.js
├── useComprasStore.js
├── useVentasPorDiaStore.js     # métrica ventas por día de la semana (Dashboard)
├── useSerieDiariaStore.js      # serie diaria de ventas cobradas (Dashboard, tarjeta Ventas del corte)
├── useSinMovimientoStore.js    # productos sin movimiento (Dashboard)
├── useDashboardStore.js
├── useEditarVentaStore.js
├── useInventarioStore.js
├── useNuevaVentaStore.js
├── Usepedidoscocinastore.js   # Panel de cocina (pedidos, entregar, polling)
├── Useprestamosstore.js
├── useProveedoresStore.js
└── useVentasStore.js
```

Uso típico en un componente:

```js
const data     = useVentasStore((s) => s.data)
const cargar   = useVentasStore((s) => s.cargar)
const guardando = useVentasStore((s) => s.guardando)
```

> **Nota de convención:** algunos archivos usan PascalCase (`Usepedidoscocinastore.js`,
> `Useprestamosstore.js`) y otros camelCase (`useVentasStore.js`). Lo ideal es unificar a
> camelCase `useXxxStore.js` a futuro.

---

### 3.4 `src/components/` — Componentes reutilizables

Piezas compartidas: estructura de la app, modales, tablas y utilidades de UI.

```
src/components/
├── layout.jsx            # ★ Shell del admin: Sidebar + Header + <Outlet/> (el contenido de la página)
├── sidebar.jsx           # Menú lateral de navegación
├── header.jsx            # Barra superior (usuario, acciones, etc.)
│
├── RequireCortes.jsx     # Guarda: exige que exista al menos un corte (si no, -> /primer-corte)
├── RutaAdminPrincipal.jsx# Guarda: solo el usuario admin principal (id === 1)
│
├── Toast.jsx             # Notificaciones tipo toast
│
├── CustomersManager.jsx  # Gestión de clientes (CRUD)
├── ProductsManager.jsx   # Gestión de productos (CRUD)
├── combosmanager.jsx     # Gestión de combos (CRUD)
│
├── VentasPorDiaSemana.jsx    # Tarjeta Dashboard: ventas por día de la semana (barras)
├── VentasDelCorte.jsx        # Tarjeta Dashboard: serie diaria de ventas cobradas (línea/área)
├── ProductosSinMovimiento.jsx # Tarjeta Dashboard: productos con stock sin ventas en N días (barras)
│
├── nuevaVentaModal.jsx       # Modal: crear venta (incluye combos)
├── EditarVentaModal.jsx      # Modal: editar venta
├── NuevoAbonoModal.jsx       # Modal: registrar abono a venta
├── nuevoprestamomodal.jsx    # Modal: nuevo préstamo
└── Pagarprestamomodal.jsx    # Modal: pagar/abonar préstamo
```

**Flujo del `Layout`:** `layout.jsx` renderiza `Sidebar` + `Header` y, en el `<main>`, un
`<Outlet/>` donde React Router inyecta la página activa (`Dashboard`, `Ventas`, etc.).

**Guardas (componentes que envuelven):**
- `RequireCortes` → verifica `GET /cortes/`; si no hay cortes, manda a `/primer-corte`.
- `RutaAdminPrincipal` → restringe a `usuario.id === 1`.

---

### 3.5 `src/pages/` — Vistas por módulo

Una carpeta por módulo del negocio. Cada carpeta contiene su página principal.

```
src/pages/
├── login/
│   └── Login.jsx              # Inicio de sesión (redirige según rol)
├── dashboard/
│   └── Dashboard.jsx          # KPIs / resumen
├── Ventas/
│   └── Ventas.jsx             # Listado y gestión de ventas
├── Inventario/
│   └── Inventario.jsx         # Ver/editar inventario (bandejas + sueltas)
├── compras/
│   └── Compras.jsx            # Compras a proveedores (KPIs leen `resumen` del store; `q` busca descripción/proveedor/id)
├── balance/
│   └── Balance.jsx            # Balance del corte actual
├── cortes/
│   └── Cortes.jsx             # Historial de cortes
├── pcorte/
│   └── PrimerCorte.jsx        # Creación del primer corte
├── abonos/
│   └── Abonos.jsx             # Abonos a ventas
├── prestamos/
│   └── prestamos.jsx          # Préstamos a clientes
├── proveedores/
│   └── proveedores.jsx        # Gestión de proveedores
├── auditoria/
│   └── Auditoria.jsx          # Registro de operaciones
└── pedidos/
    └── panelcocina.jsx        # ★ Panel de cocina (pantalla aparte, sin sidebar)
```

> **Convención:** la carpeta se nombra igual que el módulo y contiene la página homónima
> (`Dashboard/Dashboard.jsx`, etc.). Hay variaciones de mayúsculas en carpetas
> (`Ventas/`, `Inventario/`) — funcional, pero candidato a estandarizar.

---

### 3.6 `src/hooks/` — Custom hooks

```
src/hooks/
└── useInactivityTimer.js   # Cierra sesión tras N minutos sin actividad (eventos del navegador)
```

Se usa dentro de `RutaProtegida` (en `App.jsx`), por lo que aplica a toda la app protegida.

---

### 3.7 `src/utils/` — Utilidades

```
src/utils/
├── formatearFecha.js    # formatearFechaColombia(): convierte UTC -> hora America/Bogota
├── formatearTexto.js    # Helpers de texto (iniciales, capitalización, etc.)
└── exportarExcel.js     # exportarAExcel(): genera .xlsx con la librería "xlsx"
```

---

## 4. Flujo de datos (cómo se conecta todo)

```
                 ┌────────────────────────────────────────────────────────────┐
                 │                       NAVEGADOR (SPA)                        │
                 └────────────────────────────────────────────────────────────┘
   index.html ──► main.jsx ──► App.jsx (Router + RutaProtegida)
                                    │
                                    ▼
                     Layout (sidebar + header + <Outlet/>)
                                    │  renderiza
                                    ▼
        ┌───────────────────────────────────────────────────────────┐
        │  pages/  (Dashboard, Ventas, Inventario, PanelCocina, …)    │
        │        │ consume estado                │ usa componentes     │
        │        ▼                               ▼                     │
        │   store/  (Zustand)   ◄── acciones ── components/ (modales) │
        │        │ llama                                                │
        │        ▼                                                      │
        │   api/  (axios.js + *_api.js)                                 │
        └────────┬──────────────────────────────────────────────────────┘
                 │  HTTP (Bearer token)
                 ▼
        Backend Flask + MySQL  (snackflow-api.onrender.com)
```

**Regla de oro de capas:**
`pages/components` → **no** llaman a axios directamente (excepto guardas puntuales como
`RequireCortes`); pasan por un **store** que a su vez usa **`api/`**.

- `components/` = UI reutilizable (sin lógica de negocio pesada).
- `pages/` = composición de la vista de un módulo.
- `store/` = estado + acciones + llamadas a la API.
- `api/` = peticiones HTTP puras.
- `utils/` = funciones puras auxiliares.
- `hooks/` = comportamiento reutilizable con estado/efectos.

---

## 5. Sesión, roles y seguridad (frontend)

- **Token**: `localStorage.access_token` (lo inyecta el interceptor de `api/axios.js`).
- **Usuario**: `localStorage.usuario` (JSON con `id`, `nombre`, `rol`). Patrón común:
  `JSON.parse(localStorage.getItem('usuario') || 'null')?.id`.
- **Roles**: `admin`, `cajero`, `cocina`.
  - `/cocina` es exclusivo del rol **cocina** (pantalla sin sidebar).
  - `/` es para **admin** y **cajero**.
  - `RutaAdminPrincipal` limita acciones al admin principal (`id === 1`).
- **Inactividad**: `useInactivityTimer()` (5 min por defecto) cierra sesión automáticamente.
- **401**: el interceptor de respuesta limpia la sesión y redirige a `/login`.

---

## 6. Estilos

- **Tailwind CSS v4** vía `@tailwindcss/vite` (se importa con `@import "tailwindcss"` en `src/index.css`).
- Fuente global **Outfit** (cargada en `index.html`).
- Convención actual: clases utilitarias de Tailwind en `className`. Los estilos inline de
  **margin/padding** ya se migraron a Tailwind; quedan solo casos **dinámicos**
  (`clamp(...)`, ternarios, spreads) y algunas constantes de objeto de estilo.

---

## 7. Scripts disponibles (package.json)

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo Vite con HMR. |
| `npm run build` | Compila a `dist/` para producción. |
| `npm run preview` | Sirve localmente el build de `dist/`. |
| `npm run lint` | Ejecuta ESLint sobre el proyecto. |

---

## 8. Resumen rápido (chuleta)

- **¿Dónde va una llamada al backend?** → `src/api/*_api.js` (usando `api/axios.js`).
- **¿Dónde va el estado de un módulo?** → `src/store/use<Modulo>Store.js`.
- **¿Dónde va una vista nueva?** → `src/pages/<modulo>/<Pagina>.jsx` + ruta en `App.jsx`.
- **¿Dónde va un modal o pieza compartida?** → `src/components/`.
- **¿Una función de formato/fecha/Excel?** → `src/utils/`.
- **¿Un comportamiento reutilizable?** → `src/hooks/`.
- **¿Un static (imagen/logo)?** → `public/` (se referencia como `/archivo.png`).
```

**Nota (domicilio, 2026-10-23):** `nuevaVentaModal.jsx` incluye el input "Valor del domicilio", el bloque "Pagar domicilio" (con su propio `MedioPagoSelector`) y el resumen separado; la lógica y el payload viven en `useNuevaVentaStore.js` (`subtotalProductos`, `totalDomicilio`, `abonoDomicilio`, `es_domicilio`).

**Nota (domicilio en edición y abonos, 2026-10-23):** `EditarVentaModal.jsx` + `useEditarVentaStore.js` editan `valor_domicilio` (mínimo = `domicilio_pagado`, envío condicional en `PUT /ventas/{id}/detalle`) y el total del footer suma domicilio. `NuevoAbonoModal.jsx` separa "Pagar venta" (productos) y "Pagar domicilio" con medios independientes y hace dos `POST /abonos` secuenciales con `es_domicilio` booleano; ante fallo del segundo avisa que el primero quedó registrado y recarga la venta.

**Nota (domicilio en pantallas de lectura, 2026-10-23):** `Ventas.jsx` muestra chip "Domicilio debe" en la lista, desglose Productos/Domicilio en el detalle, chip "Domicilio" en abonos, y en el comprobante (pantalla e impresión) usa `subtotal_productos`, agrega la línea Domicilio y mantiene `total`. `Abonos.jsx` marca abonos con `es_domicilio` y agrega modal/impresión de recibo con `GET /abonos/{id}/recibo` (concepto, monto y pendientes).

**Nota (paginación y búsqueda en servidor, 2026-11-03):** Préstamos, proveedores, inventario y productos paginan y buscan en el backend. Los stores guardan `total`, `pagina`, `limite`, `total_paginas` y `busqueda`; las pantallas envían `q` con debounce de ~400 ms, reinician a página 1 y descartan respuestas viejas con un contador de secuencia. En préstamos, `GET /prestamos/` también devuelve `resumen` (`total_prestado`, `total_abonado`, `saldo_por_cobrar`, `pendientes`, `pagados`): el store lo mantiene y la pantalla usa esos valores para las KPI globales; los tabs siguen contando la página y el pie usa `saldoPagina`. Detalle por endpoint en `SnackFlow_contexto (1).md` §11.

**Nota (valor del inventario, 2026-11-08):** `Inventario.jsx` muestra dos `KpiCard` (componente compartido) con el **valor global** del inventario: "Valor al detal" y "Valor al por mayor". Se alimentan de `GET /inventarios/valor` (`getValorInventario()` en `api/inventario_api.js`), que devuelve `{ valor_detal, valor_mayor }` en COP; el store guarda `valor_detal`, `valor_mayor`, `cargandoValor` y `errorValor` (flags propios, para no disparar el spinner ni el error del listado). No dependen de paginación ni búsqueda: se piden al montar y se refrescan al guardar ediciones de cantidades/stock mínimo o registrar producción (vía `cargar()`).

**Nota (métricas de ventas del Dashboard, 2026-11-10):** `Dashboard.jsx` coloca `VentasPorDiaSemana` y `VentasDelCorte` en una misma fila (`grid grid-cols-1 lg:grid-cols-2 gap-6`), debajo de las cards KPI y arriba de las tablas.

- **`VentasPorDiaSemana.jsx`** (barras con divs, sin librería): usa `getVentasPorDiaSemana(semanas)` (`GET /ventas/por-dia-semana?semanas=1-8`, en `api/ventas_api.js`) y `useVentasPorDiaStore` (`semanas`=3, `datos`, `loading`, `error`; ignora respuestas viejas). No calcula nada en cliente; error/403 muestra estado vacío con "Reintentar" sin cerrar sesión. El filtro tiene la etiqueta visible "Últimas semanas"; cada barra muestra su monto (`fmtMonto`) encima de forma permanente, y al hover/focus el tooltip reemplaza ese monto por monto + cantidad de ventas (columnas con `tabIndex=0` y `aria-label`).
- **`VentasDelCorte.jsx`** (SVG propio, línea + área): consume `GET /ventas/serie-diaria?modo=corte|dias&dias=30` con `getVentasSerieDiaria(modo, dias)` y `useSerieDiariaStore` (`modo`, `datos`, `loading`, `error`; contador para descartar respuestas viejas). La leyenda usa `datos.total` (nunca `balance.total_ventas`); el eje Y se calcula con 4 intervalos "bonitos" desde el máximo diario. El viewport muestra 7 días exactos (`anchoDia = anchoViewport / 7`), con scroll horizontal por rueda/trackpad, arrastre pointer, touch y snap por día; los chevrons (44×44, solo `lg`) avanzan una página. Eje Y, rejilla y tooltip quedan fijos; la línea, puntos y eje X acompañan el scroll. Al cargar y cambiar de modo abre en el día más reciente. Teclado: el grupo es focusable, flechas/Home/End mueven el punto activo, Enter/Espacio fija y Escape suelta; `aria-live` anuncia el punto activo. Estados: skeleton con altura fija, error con "Reintentar", 404/`datos=null` como vacío tranquilo y serie en cero como línea plana. Animaciones (dibujo de línea, fade del área, stagger de puntos, count-up del total) se desactivan con `prefers-reduced-motion`.

**Nota (2026-11-12):** `Dashboard.jsx` ahora pone `VentasDelCorte` a todo el ancho y, en la fila siguiente, `VentasPorDiaSemana` + `ProductosSinMovimiento` (`grid lg:grid-cols-2`). Las 5 cards KPI se redujeron en altura y tamaño de texto. **`ProductosSinMovimiento.jsx`** consume `GET /productos/sin-movimiento?dias=7|15|30|60|90&limite=5` (`getProductosSinMovimiento` en `api/productos_api.js`) con `useSinMovimientoStore` (`dias`=15, `datos`, `loading`, `error`; descarta respuestas viejas). Barras con degradé morado SnackFlow (`#a59bff→#5842ff`), `nunca_vendido` se indica bajo el nombre; no calcula en cliente. 403/error → estado vacío con "Reintentar".

**Nota (compras de domicilio, 2026-11-11):** el domicilio ya no es ingreso. El modal de compra se extrajo a `src/components/ModalCompra.jsx` (lo usan `Compras.jsx` y `Ventas.jsx`) y tiene selector de **categoría** (`insumo` | `domicilio`); con `domicilio` exige una venta (`SelectorVentaDomicilio`, búsqueda en servidor con `GET /ventas/con-domicilio?solo_pendientes=true`, descarta respuestas viejas) y sugiere como costo `domicilio_pendiente_compra`. `useComprasStore` envía `categoria` y `venta_id` (solo con domicilio) y guarda `categoriaFiltro` (filtro en servidor; `getCompras` recibe `categoria` como 5.º parámetro). `Compras.jsx` muestra chip "Domicilio · venta #id" y filtro por categoría. `Ventas.jsx` agrega por fila (si `valor_domicilio > 0` y no anulada) un botón con icono `Motorbike` que abre `ModalCompra` con `ventaFija` (categoría bloqueada en Domicilio); se deshabilita con `domicilio_compra_completa`. `Balance.jsx` agrega la sección "Domicilios y compras del corte" (`domicilios_cobrados`, `domicilios_pagados`, `diferencia_domicilios`, `compras_insumos`, `compras_domicilios`). Ojo: `domicilio_pagado/pendiente` = cobro al cliente; `*_compra` = pago al domiciliario.
