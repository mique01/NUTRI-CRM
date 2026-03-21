import { useRef, type ChangeEvent } from "react";
import { FileText, Folder, Image, Trash2, Upload } from "lucide-react";
import { formatDate } from "@/lib/utils";

export interface FileListItem {
  id: string;
  title: string;
  date: string;
  fileType?: "pdf" | "image";
}

interface FileListProps {
  title: string;
  items: FileListItem[];
  uploadLabel: string;
  uploadStatusLabel?: string;
  emptyMessage: string;
  accept?: string;
  isUploading?: boolean;
  onUpload: (file: File) => Promise<void>;
  onDownload: (itemId: string) => Promise<void>;
  onDelete?: (itemId: string) => Promise<void>;
}

const FileList = ({
  title,
  items,
  uploadLabel,
  uploadStatusLabel,
  emptyMessage,
  accept,
  isUploading = false,
  onUpload,
  onDownload,
  onDelete,
}: FileListProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const getIcon = (fileType?: string) => {
    if (fileType === "image") {
      return <Image className="h-4 w-4 text-muted-foreground" />;
    }

    return <FileText className="h-4 w-4 text-muted-foreground" />;
  };

  const handleFileSelection = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await onUpload(file);
    event.target.value = "";
  };

  return (
    <div className="rounded-[30px] border border-border/80 bg-[linear-gradient(180deg,rgba(251,248,228,0.92),rgba(243,238,211,0.94))] p-6 shadow-soft">
      <div className="mb-4 flex items-center gap-2">
        <Folder className="h-4.5 w-4.5 text-primary/70" />
        <h3 className="font-display text-3xl font-semibold leading-none text-card-foreground">
          {title}
        </h3>
      </div>

      {items.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          <Folder className="mx-auto mb-2 h-8 w-8 opacity-40" />
          <p className="text-sm">{emptyMessage}</p>
        </div>
      ) : (
          <ul className="mb-4 space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="group flex items-center gap-2 rounded-[18px] border border-border/55 bg-background/65 px-3 py-3 text-sm transition-colors hover:bg-background"
            >
              <button
                type="button"
                onClick={() => void onDownload(item.id)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                {getIcon(item.fileType)}
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-card-foreground group-hover:text-foreground">
                    {item.title}
                  </span>
                </div>
                  <span className="shrink-0 whitespace-nowrap font-mono-app text-xs text-muted-foreground">
                  {formatDate(item.date)}
                </span>
              </button>
              {onDelete ? (
                <button
                  type="button"
                  onClick={() => void onDelete(item.id)}
                  className="shrink-0 rounded-full p-2 text-muted-foreground transition-colors hover:bg-card hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelection}
        className="hidden"
      />

      <button
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className="w-full rounded-full border border-dashed border-border bg-background/70 px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-secondary-foreground active:scale-[0.98] disabled:opacity-50"
      >
        <Upload className="mr-2 inline h-3.5 w-3.5" />
        {isUploading ? uploadStatusLabel ?? "Subiendo archivo..." : uploadLabel}
      </button>
    </div>
  );
};

export default FileList;
