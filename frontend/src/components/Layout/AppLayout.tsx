import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive ? 'bg-blue-700 text-white' : 'text-blue-100 hover:bg-blue-700/60'
    }`;

  const SidebarInner = ({ showText, onClose }: { showText: boolean; onClose?: () => void }) => (
    <>
      <div className="p-4 flex items-center gap-3 border-b border-blue-700">
        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-blue-800 font-bold text-sm">N</span>
        </div>
        {showText && <span className="text-white font-bold text-lg">NutriChart</span>}
        <button
          onClick={onClose ?? (() => setSidebarOpen(!sidebarOpen))}
          className="ml-auto text-blue-200 hover:text-white text-xl leading-none"
        >
          {onClose ? '×' : (sidebarOpen ? '◀' : '▶')}
        </button>
      </div>

      <nav className="p-3 flex-1 space-y-1">
        <NavLink to="/" end className={navClass}>
          <span>🏠</span>{showText && 'Pacientes'}
        </NavLink>
      </nav>

      <div className="p-3 border-t border-blue-700">
        {showText && (
          <div className="mb-3 px-4 py-2 bg-blue-700/50 rounded-lg">
            <p className="text-xs text-blue-300">Nutricionista</p>
            <p className="text-sm text-white font-medium truncate">{user?.name}</p>
            <p className="text-xs text-blue-300 truncate">{user?.email}</p>
          </div>
        )}
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-300 hover:text-white hover:bg-red-600/50 rounded-lg transition-colors">
          <span>🚪</span>{showText && 'Cerrar sesión'}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col ${sidebarOpen ? 'w-64' : 'w-16'} bg-blue-800 transition-all duration-200 flex-shrink-0`}>
        <SidebarInner showText={sidebarOpen} />
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-blue-800 flex flex-col z-50">
            <SidebarInner showText onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-blue-800 px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-white text-2xl leading-none"
            aria-label="Abrir menú"
          >
            ☰
          </button>
          <div className="w-6 h-6 bg-white rounded flex items-center justify-center flex-shrink-0">
            <span className="text-blue-800 font-bold text-xs">N</span>
          </div>
          <span className="text-white font-bold">NutriChart</span>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
