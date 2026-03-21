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
        <section className="rounded-[34px] border border-border/80 bg-[linear-gradient(180deg,rgba(252,249,228,0.97),rgba(244,238,210,0.96))] p-8 shadow-soft">
          <div className="mb-8">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[18px] border border-border/70 bg-background/80 text-card">
              <span className="font-display text-3xl font-semibold text-foreground">N</span>
            </div>
            <h1 className="font-display text-5xl font-semibold leading-none text-foreground">
              Configurar consultorio
            </h1>
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
                className="crm-input"
              />
            </div>

            <button
              type="submit"
              disabled={isBootstrapping}
              className="w-full rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
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
