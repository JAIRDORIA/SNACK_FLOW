import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./sidebar";
import Header from "./header";

export default function Layout() {
  const [sidebarAbierto, setSidebarAbierto] = useState(false);
  // Colapso del sidebar en escritorio (riel de iconos). Arranca colapsado y lo
  // comparten header y sidebar; el botón pin del header lo fija abierto.
  const [sidebarColapsado, setSidebarColapsado] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden">
      
      {/* Fondo oscuro móvil */}
      {sidebarAbierto && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarAbierto(false)}
        />
      )}

      <Sidebar
        sidebarAbierto={sidebarAbierto}
        setSidebarAbierto={setSidebarAbierto}
        sidebarColapsado={sidebarColapsado}
      />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header
          setSidebarAbierto={setSidebarAbierto}
          sidebarColapsado={sidebarColapsado}
          setSidebarColapsado={setSidebarColapsado}
        />

        <main className="flex-1 overflow-y-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}