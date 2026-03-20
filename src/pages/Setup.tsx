import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { bootstrapClinic } from "@/services/clinic";

const Setup = () => {
  const { user, refreshContext } = useAuth();
  const navigate = useNavigate();
  const [clinicName, setClinicName] = useState("");
  const [isBootstrapping, setIsBootstrapping] = useState(false);

  const handleBootstrap = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsBootstrapping(true);

    try {
      await bootstrapClinic(clinicName);
      await refreshContext();
      toast.success("Consultorio creado correctamente.");
      navigate("/");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo crear el consultorio.",
      );
    } finally {
      setIsBootstrapping(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <section className="rounded-3xl border border-border bg-card p-8 shadow-card">
          <div className="mb-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground text-card">
              <span className="text-lg font-bold">N</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Configurar consultorio</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {user?.email
                ? `SesiÃ³n iniciada como ${user.email}.`
                : "Tu sesiÃ³n ya estÃ¡ lista."}{" "}
              Este paso solo estÃ¡ disponible para la primera cuenta que crea el consultorio
              principal.
            </p>
          </div>

          <form onSubmit={handleBootstrap} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Nombre del consultorio
              </label>
              <input
                required
                value={clinicName}
                onChange={(event) => setClinicName(event.target.value)}
                placeholder="Ej. Cami NutriciÃ³n"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground"
              />
            </div>

            <button
              type="submit"
              disabled={isBootstrapping}
              className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isBootstrapping ? "Creando..." : "Crear consultorio"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default Setup;
