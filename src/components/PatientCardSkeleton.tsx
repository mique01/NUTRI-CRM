const PatientCardSkeleton = () => (
  <div className="animate-pulse rounded-[28px] border border-border/80 bg-[linear-gradient(180deg,rgba(251,248,228,0.9),rgba(243,238,211,0.92))] p-5 shadow-soft">
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-[18px] bg-muted" />
        <div>
          <div className="mb-2 h-5 w-32 rounded bg-muted" />
          <div className="h-3 w-20 rounded bg-muted" />
        </div>
      </div>
      <div className="mt-1.5 h-2.5 w-2.5 rounded-full bg-muted" />
    </div>
    <div className="h-11 w-full rounded-[18px] bg-muted" />
  </div>
);

export default PatientCardSkeleton;
