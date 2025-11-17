// src/app/layout.tsx
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Container, Button } from "../componentes/UI";
import { useAuth } from "../auth/AuthContext";
  

export default function Layout() {
  const loc = useLocation();
  const { user, logout: authLogout } = useAuth();
  const navigate = useNavigate();

  // Style function for navigation links
  const navLinkStyle = (active: boolean) =>
    `px-4 py-2 rounded-lg font-semibold transition-colors duration-200 ${
      active
        ? "bg-white text-emerald-900" // Active link on green background
        : "text-emerald-100 hover:bg-emerald-700 hover:text-white" // Inactive link and hover on green background
    }`;
  
  const handleLogout = () => {
    authLogout();
    navigate('/');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* ===== HEADER WITH GREEN BACKGROUND ===== */}
      <header className="sticky top-0 z-50 bg-emerald-800"> {/* Changed bg-slate-900 to bg-emerald-800 */}
        <Container>
          <div className="h-16 flex items-center justify-between">
            <Link to="/" className="font-extrabold text-lg tracking-tight text-white">
              EVENT APP {/* Keep brand color for contrast */}
            </Link>

            <nav className="flex items-center gap-4">
              <Link to="/" className={navLinkStyle(loc.pathname === "/")}>
                Eventos
              </Link>

              {/* ... (Role-based navigation links remain the same) ... */}
              
              {!user ? (
                <Link to="/iniciar-sesion" className={navLinkStyle(loc.pathname === "/iniciar-sesion")}>
                  Iniciar Sesión
                </Link>
              ) : (
                <button onClick={handleLogout} className={navLinkStyle(false) + " ml-2"}>
                  Salir
                </button>
              )}
            </nav>
          </div>
        </Container>
      </header>
      
      <main className="flex-grow">
          <Outlet/>
      </main>
      
    </div>
  );
}