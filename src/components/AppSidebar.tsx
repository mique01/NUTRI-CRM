import { Home, LogOut, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/context/AuthContext";

const AppSidebar = () => {
  const { user, logout } = useAuth();
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
    <aside className="hidden min-h-screen w-72 flex-col bg-sidebar px-6 py-7 md:flex">
      <div className="mb-12">
        <p className="font-display text-[2.5rem] font-semibold leading-none tracking-tight text-sidebar-foreground">
          Consultorio
        </p>
      </div>

      <nav className="flex-1 space-y-2">
        <NavLink
          to="/"
          end
          className="flex items-center gap-3 rounded-[22px] border border-transparent px-4 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-sidebar-foreground transition-all hover:border-border/40 hover:bg-sidebar-accent/60"
          activeClassName="border-transparent bg-sidebar-accent text-sidebar-accent-foreground shadow-soft"
        >
          <span className="h-10 w-1 rounded-full bg-transparent" />
          <Home className="h-4.5 w-4.5" />
          Panel
        </NavLink>
        <NavLink
          to="/patients"
          className="flex items-center gap-3 rounded-[22px] border border-transparent px-4 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-sidebar-foreground transition-all hover:border-border/40 hover:bg-sidebar-accent/60"
          activeClassName="border-transparent bg-sidebar-accent text-sidebar-accent-foreground shadow-soft"
        >
          <span className="h-10 w-1 rounded-full bg-transparent" />
          <Users className="h-4.5 w-4.5" />
          Pacientes
        </NavLink>
      </nav>

      {user ? (
        <div className="mt-auto border-t border-sidebar-border/80 pt-6">
          <div className="rounded-[24px] border border-border/70 bg-card/65 px-4 py-4 shadow-soft">
            <p className="truncate font-display text-xl font-semibold leading-none text-sidebar-foreground">
              {user.name}
            </p>
            <p className="mt-2 truncate text-xs uppercase tracking-[0.16em] text-muted-foreground">
              {user.email}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="mt-4 flex w-full items-center gap-2 rounded-[18px] px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesion
          </button>
        </div>
      ) : null}
    </aside>
  );
};

export default AppSidebar;
