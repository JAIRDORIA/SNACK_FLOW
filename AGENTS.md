# SnackFlow — Frontend (negocio Delis)

Explora el repo tú mismo; no pidas archivos. Responde breve, con edición mínima y sin refactors no pedidos. Al terminar, lista archivos modificados y cualquier campo o nombre del contrato que hayas tenido que suponer.

## Stack
- React + Vite, Zustand (**un store por módulo**), capa `src/api/*.js` sobre una instancia de axios (`src/api/axios.js`), íconos de `lucide-react`.
- **Solo Tailwind**: sin archivos CSS nuevos ni cambios a `tailwind.config`. Mantén el estilo visual existente (modales con overlay `bg-slate-900/60 backdrop-blur-sm`, contenedor `bg-white rounded-2xl shadow-2xl`).
- No agregues dependencias sin avisar.

## Sesión y roles
- Claves de `localStorage`: **`access_token`** y **`usuario`** (no existe `'token'`). No hay store de auth.
- El interceptor de axios no debe actuar sobre el 401 de `/auth/login` (se perdería el mensaje de credenciales incorrectas). Un 403 no cierra sesión.
- Roles: `admin`, `cajero`, `cocina`. `cocina` solo accede al panel `/cocina` (`panelcocina.jsx`). `RutaProtegida` debe limpiar sesión y mandar a `/login` si hay token pero no hay rol.

## Convenciones
- **Fechas:** llegan en UTC; conviértelas a `America/Bogota` solo al mostrarlas. Un string `"YYYY-MM-DD HH:mm:ss"` se parsea como UTC con `replace(' ', 'T') + 'Z'` (nunca `new Date(str)` a secas).
- **Hooks:** declara los hooks nuevos **antes** de los early returns del componente (`Ventas.jsx` tiene `if (cargando)` / `if (error)` antes del JSX principal).
- **Polling/timers:** refresco silencioso (sin spinner), pausado con `document.hidden`, con `clearInterval` al desmontar. Hoy: aviso "por confirmar" (~30 s) y refresco del panel de cocina.
- **Búsquedas en vivo:** con debounce; ignora respuestas viejas si el usuario cambia filtro/página rápido. Filtra y pagina en el **servidor**, no en el cliente (varios endpoints con límite fijo se rompieron así).
- **Nunca asumas el shape de un objeto:** los servicios de clientes mezclan `id`/`nombre` con `ID_Cliente`/`Cli_Nombre`. Verifica contra el código o un JSON real.
- Cada modal/estado de formulario se reinicia al cerrar y en `reset()` del store.

## Reglas de negocio que se reflejan en la UI
- **Combos en `EditarVentaModal`/`nuevaVentaModal`:** catálogo (`combo_id`, sin `productos`) vs personalizado (`combo_id = null` + `productos: [{producto_id, cantidad_unidades}]`). Si la composición editada equivale a la del catálogo, se queda como catálogo. Nunca enviar `combo_id` junto con `productos`.
- **Dirección por pedido (Nueva Venta):** "Cambiar dirección" es solo para ese pedido y no cambia la del cliente. Solo se envía `direccion_entrega` si difiere de la registrada. Si el cliente no tiene dirección, la que se escriba se guardará como suya (lo decide el backend). Se reinicia al cambiar de cliente.
- **Aviso "por confirmar" (`Ventas.jsx`):** banner compacto + modal con el listado; "Confirmar" reutiliza el modal de entrega (`entregarId`). Datos propios (store aparte), no derivados de la lista paginada.
- **Panel de cocina:** borde naranja a ≤ 60 min de la entrega; rojo con titileo (overlay con `animate-pulse`, respetando `motion-reduce`) a ≤ 30 min o atrasado. Si `hora_entrega === "00:00"` es "sin hora": no se alerta. "Entregar" solo marca cocina; no confirma la venta.
- El botón de editar venta solo debe estar disponible en ventas `pendiente`.
- Historial de cortes y exportaciones necesitan **todas** las páginas de ventas/compras: no rompas ese consumo al cambiar el store o la función de listado.
