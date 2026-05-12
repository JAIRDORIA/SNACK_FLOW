# 🥟 DELIS - Frontend

Frontend del sistema de gestión de inventario y ventas para DELIS,  
desarrollado con React + Vite + Tailwind CSS + shadcn/ui.

---

## 🛠️ Tecnologías

- React 19
- Vite
- Tailwind CSS
- shadcn/ui
- React Router DOM
- Axios
- Zustand
- Lucide React

---

## ⚙️ Requisitos previos

Asegúrate de tener instalado:

- [Node.js](https://nodejs.org/) v18 o superior
- npm v9 o superior

Verifica con:
```bash
node -v
npm -v
```

---

## 🚀 Instalación

1. Clona el repositorio:
```bash
git clone https://github.com/TU_USUARIO/delis-frontend.git
cd delis-frontend
```

2. Instala las dependencias:
```bash
npm install
```

3. Crea tu archivo de variables de entorno:
```bash
cp .env.example .env
```

4. Corre el proyecto:
```bash
npm run dev
```

5. Abre el navegador en `http://localhost:5173`

---

## 🔗 Conexión con el backend

Este frontend consume la API REST del proyecto **delis-backend**.  
Asegúrate de tener el backend corriendo en `http://localhost:5000`.

Repositorio del backend: [delis-backend](https://github.com/TU_USUARIO/delis-backend)

---

## 📁 Estructura del proyecto
```
src/
├── api/          → funciones Axios por módulo
├── components/   → componentes reutilizables
├── pages/        → vistas por módulo
│   ├── Login/
│   ├── Ventas/
│   ├── Inventario/
│   ├── Cortes/
│   ├── Combos/
│   └── Clientes/
├── store/        → estado global con Zustand
├── hooks/        → custom hooks
└── utils/        → funciones auxiliares
```



## 📌 Notas

- No subas el archivo `.env` al repositorio
- La carpeta `node_modules/` está ignorada, usa `npm install` para regenerarla
