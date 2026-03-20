const PatientCardSkeleton = () => (
  <div className="rounded-2xl border border-border bg-card p-5 shadow-card animate-pulse">
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-muted" />
        <div>
          <div className="h-4 w-28 bg-muted rounded mb-1.5" />
          <div className="h-3 w-16 bg-muted rounded" />
        </div>
      </div>
      <div className="w-2.5 h-2.5 rounded-full bg-muted mt-1.5" />
    </div>
    <div className="h-9 w-full bg-muted rounded-lg" />
  </div>
);

export default PatientCardSkeleton;
