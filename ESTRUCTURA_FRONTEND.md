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
│   └── Compras.jsx            # Compras a proveedores
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
