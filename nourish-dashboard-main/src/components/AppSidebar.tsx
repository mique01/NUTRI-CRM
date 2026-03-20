import { LogOut, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/context/AuthContext";

const AppSidebar = () => {
  const { user, clinic, logout } = useAuth();
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
    <aside className="hidden min-h-screen w-56 flex-col border-r border-sidebar-border bg-sidebar px-3 py-6 md:flex">
      <div className="mb-8 px-3">
        <h1 className="text-lg font-bold tracking-tight text-sidebar-foreground">
          NutriCRM
        </h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {clinic?.name ?? "Gestión de pacientes"}
        </p>
      </div>

      <nav className="flex-1 space-y-1">
        <NavLink
          to="/"
          end
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
          activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
        >
          <Users className="h-4 w-4" />
          Pacientes
        </NavLink>
      </nav>

      {user ? (
        <div className="mt-auto border-t border-sidebar-border px-3 pt-4">
          <p className="truncate text-sm font-medium text-sidebar-foreground">{user.name}</p>
          <p className="mb-3 truncate text-xs text-muted-foreground">{user.email}</p>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <LogOut className="h-3.5 w-3.5" />
            Cerrar sesión
          </button>
        </div>
      ) : null}
    </aside>
  );
};

export default AppSidebar;
