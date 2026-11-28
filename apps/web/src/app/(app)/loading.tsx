/** Shown the instant you tap a page in the admin, while the server gathers its data. */
export default function Loading() {
  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-5xl animate-pulse" aria-busy="true" aria-label="Loading">
      <div className="h-6 w-48 rounded bg-bg-raised" />
      <div className="h-4 w-full max-w-xl rounded bg-bg-raised" />
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="panel h-24" />
        ))}
      </div>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="panel h-20" />
      ))}
    </div>
  );
}
