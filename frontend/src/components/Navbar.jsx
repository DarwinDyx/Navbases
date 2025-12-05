import { Link, useLocation } from "react-router-dom";
import { 
  FaShip, 
  FaHome
} from "react-icons/fa";

export default function Navbar() {
  const location = useLocation();

  const navItems = [
    { to: "/", label: "Accueil", icon: <FaHome className="w-4 h-4" /> },
    { to: "/navires", label: "Navires", icon: <FaShip className="w-4 h-4" /> },
  ];

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-lg border-b border-slate-700">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="p-2 bg-blue-600 rounded-xl group-hover:bg-blue-700 transition-colors">
              <FaShip className="text-white text-xl" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Navbase
              </span>
              <span className="text-xs text-slate-400">Gestion de Flotte Malagasy</span>
            </div>
          </Link>

          {/* Navigation principale - SIMPLIFIÉE */}
          <div className="flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive(item.to)
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-slate-300 hover:text-white hover:bg-slate-700"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Indicateur de page active (mobile) */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="text-xs text-slate-400">
              {navItems.find(item => isActive(item.to))?.label || "Accueil"}
            </div>
          </div>
        </div>

        {/* Breadcrumb pour les sous-pages */}
        {location.pathname !== "/" && (
          <div className="border-t border-slate-700 py-2">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Link to="/" className="hover:text-white transition-colors">
                Accueil
              </Link>
              
              {navItems.map((item) => {
                if (isActive(item.to) && item.to !== "/") {
                  return (
                    <div key={item.to} className="flex items-center gap-2">
                      <span className="text-slate-600">/</span>
                      <span className="text-white font-semibold">
                        {item.label}
                      </span>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}