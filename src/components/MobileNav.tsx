import { Home, LogOut, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/context/AuthContext";

const MobileNav = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cerrar la sesion.");
    }
  };

  return (
    <header className="border-b border-sidebar-border/80 bg-sidebar/95 px-4 py-4 backdrop-blur md:hidden">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold leading-none text-sidebar-foreground">
            Consultorio
          </h1>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-full border border-border/70 bg-card/70 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <LogOut className="h-3.5 w-3.5" />
          Salir
        </button>
      </div>
      <nav className="mt-4 flex items-center gap-2">
        <NavLink
          to="/"
          end
          className="flex items-center gap-1.5 rounded-full border border-border/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-sidebar-foreground transition-colors hover:bg-sidebar-accent/70"
          activeClassName="bg-sidebar-accent shadow-soft"
        >
          <Home className="h-3.5 w-3.5" />
          Panel
        </NavLink>
        <NavLink
          to="/patients"
          className="flex items-center gap-1.5 rounded-full border border-border/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-sidebar-foreground transition-colors hover:bg-sidebar-accent/70"
          activeClassName="bg-sidebar-accent shadow-soft"
        >
          <Users className="h-3.5 w-3.5" />
          Pacientes
        </NavLink>
      </nav>
    </header>
  );
};

export default MobileNav;
