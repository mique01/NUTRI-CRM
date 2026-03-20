import { useState, type FormEvent } from "react";
import { Copy, MailPlus } from "lucide-react";

interface InviteTeammateCardProps {
  onCreateInvite: (email: string) => Promise<{ shareUrl: string }>;
}

export default function InviteTeammateCard({
  onCreateInvite,
}: InviteTeammateCardProps) {
  const [email, setEmail] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const invite = await onCreateInvite(email);
      setShareUrl(invite.shareUrl);
      setEmail("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="mb-4 flex items-center gap-2">
        <MailPlus className="h-4.5 w-4.5 text-muted-foreground" />
        <div>
          <h3 className="font-semibold text-card-foreground">Invitar nutricionista</h3>
          <p className="text-xs text-muted-foreground">
            Generá un link seguro de acceso al consultorio compartido.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 md:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="colega@consultorio.com"
          className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Generando..." : "Crear invitación"}
        </button>
      </form>

      {shareUrl ? (
        <div className="mt-4 rounded-xl border border-border bg-secondary/60 p-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Link para compartir
          </p>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <code className="flex-1 break-all rounded-lg bg-background px-3 py-2 text-xs text-foreground">
              {shareUrl}
            </code>
            <button
              type="button"
              onClick={copyToClipboard}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              <Copy className="mr-2 inline h-3.5 w-3.5" />
              Copiar
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
