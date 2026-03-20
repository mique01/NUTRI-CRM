import { LogOut, Users } from "lucide-react";
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
      toast.error(error instanceof Error ? error.message : "No se pudo cerrar la sesión.");
    }
  };

  return (
    <header className="flex items-center justify-between border-b border-sidebar-border bg-sidebar px-4 py-3 md:hidden">
      <h1 className="text-base font-bold text-sidebar-foreground">NutriCRM</h1>
      <nav className="flex items-center gap-1">
        <NavLink
          to="/"
          end
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
          activeClassName="bg-sidebar-accent"
        >
          <Users className="h-3.5 w-3.5" />
          Pacientes
        </NavLink>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <LogOut className="h-3.5 w-3.5" />
          Salir
        </button>
      </nav>
    </header>
  );
};

export default MobileNav;
