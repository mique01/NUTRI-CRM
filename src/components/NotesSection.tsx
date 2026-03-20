import { MessageSquare, Trash2 } from "lucide-react";
import { useState } from "react";
import { formatDate } from "@/lib/utils";
import type { PatientNote } from "@/types/domain";

interface NotesSectionProps {
  notes: PatientNote[];
  onCreateNote: (content: string) => Promise<void>;
  onDeleteNote?: (noteId: string) => Promise<void>;
  isSaving?: boolean;
}

const NotesSection = ({
  notes,
  onCreateNote,
  onDeleteNote,
  isSaving = false,
}: NotesSectionProps) => {
  const [newNote, setNewNote] = useState("");

  const handleSubmit = async () => {
    if (!newNote.trim()) return;
    await onCreateNote(newNote);
    setNewNote("");
  };

  const sortedNotes = [...notes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="mb-4 flex items-center gap-2">
        <MessageSquare className="h-4.5 w-4.5 text-muted-foreground" />
        <h3 className="font-semibold text-card-foreground">Notas e historial</h3>
      </div>

      <div className="mb-4">
        <textarea
          value={newNote}
          onChange={(event) => setNewNote(event.target.value)}
          placeholder="Agregar una nota..."
          className="w-full resize-none rounded-xl border border-border bg-background p-3 text-sm text-foreground transition-all placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-ring/30"
          rows={3}
        />
        <button
          onClick={handleSubmit}
          disabled={!newNote.trim() || isSaving}
          className="mt-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSaving ? "Guardando..." : "Guardar nota"}
        </button>
      </div>

      {sortedNotes.length === 0 ? (
        <div className="py-6 text-center text-muted-foreground">
          <MessageSquare className="mx-auto mb-2 h-8 w-8 opacity-40" />
          <p className="text-sm">Sin notas aún</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedNotes.map((note) => (
            <div
              key={note.id}
              className="rounded-xl border border-border/50 bg-secondary/60 p-4"
            >
              <div className="mb-2 flex items-start justify-between gap-3">
                <p className="text-sm leading-relaxed text-card-foreground">
                  {note.content}
                </p>
                {onDeleteNote ? (
                  <button
                    type="button"
                    onClick={() => void onDeleteNote(note.id)}
                    className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-background hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
              <span className="font-mono-app text-xs text-muted-foreground">
                {formatDate(note.createdAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotesSection;
