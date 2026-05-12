import { Outlet } from 'react-router';
import Sidebar from './Sidebar';
import Header from './header';

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0">
        <Header />                      {/* altura fija, nunca crece */}
        <main className="flex-1 overflow-y-auto">   {/* scroll solo aquí */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}