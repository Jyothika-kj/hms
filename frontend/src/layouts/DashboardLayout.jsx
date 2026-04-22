import { useState } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const DashboardLayout = () => {
  const { groups, logout, user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const menuItems = [
    {
      title: "Admin",
      group: "Admin",
      path: "/admin",
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      title: "Receptionist",
      group: "Receptionist",
      path: "/receptionist",
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      title: "Doctor",
      group: "Doctor",
      path: "/doctor",
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.812.683l-.533.639a2 2 0 00.312 2.766l2.164 1.731a2 2 0 002.492 0l2.164-1.731a2 2 0 00.312-2.766l-.533-.639z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      title: "Pharmacy",
      group: "Pharmacist",
      path: "/pharmacy",
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.812.683l-.533.639a2 2 0 00.312 2.766l2.164 1.731a2 2 0 002.492 0l2.164-1.731a2 2 0 00.312-2.766l-.533-.639z" />
        </svg>
      ),
    },
  ];

  const filteredMenu = menuItems.filter((item) => groups.includes(item.group));

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-medical-bg font-sans overflow-hidden relative">
      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0 lg:w-20"
        } fixed lg:relative inset-y-0 left-0 glass border-r border-slate-200 transition-all duration-300 flex flex-col z-40 bg-white/80 lg:bg-transparent`}
      >
        <div className="p-6 flex items-center gap-3">
          <div className="medical-gradient w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-white font-bold shadow-md">
            H
          </div>
          {(isSidebarOpen || window.innerWidth < 1024) && (
            <span className="font-bold text-xl text-slate-800 tracking-tight">HealthConnect</span>
          )}
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {filteredMenu.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => window.innerWidth < 1024 && setIsSidebarOpen(false)}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 active:scale-95 group ${
                location.pathname.startsWith(item.path)
                  ? "medical-gradient text-white shadow-lg shadow-emerald-500/20"
                  : "text-medical-text-muted hover:bg-slate-50 hover:text-medical-primary"
              }`}
            >
              <div className={location.pathname.startsWith(item.path) ? "text-white" : "group-hover:text-medical-primary"}>
                {item.icon}
              </div>
              {(isSidebarOpen || window.innerWidth < 1024) && (
                <span className="font-semibold text-sm">{item.title} Dashboard</span>
              )}
            </Link>
          ))}
        </nav>

        <div className="p-4 mt-auto">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-red-500 hover:bg-red-50 transition-all duration-200 active:scale-95 group"
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5 group-hover:translate-x-1 transition-transform">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {(isSidebarOpen || window.innerWidth < 1024) && <span className="font-semibold text-sm">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-20 glass border-b border-slate-200 px-4 md:px-8 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2.5 rounded-xl hover:bg-slate-50 text-slate-500 transition-colors border border-slate-100"
            >
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h2 className="text-lg md:text-xl font-bold text-slate-800 ml-1 md:ml-2 truncate max-w-[150px] sm:max-w-none">
              {menuItems.find((m) => location.pathname.startsWith(m.path))?.title || "System"} Overview
            </h2>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-medical-primary font-bold shadow-sm flex-shrink-0">
              {user?.username?.substring(0, 1).toUpperCase() || "U"}
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-sm font-bold text-slate-800 leading-none">{user?.username || "Healthcare Professional"}</p>
              <p className="text-xs text-medical-text-muted mt-1 font-medium">{groups[0] || "User"}</p>
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Outlet />
          </div>
        </section>
      </main>
    </div>
  );
};

export default DashboardLayout;
