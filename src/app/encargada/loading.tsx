export default function Loading() {
  return (
    <div className="p-5 space-y-4 animate-pulse">
      <div className="h-7 w-32 rounded bg-muted" />
      <div className="h-10 w-48 rounded bg-muted" />
      <ul className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="h-20 rounded-xl bg-muted" />
        ))}
      </ul>
    </div>
  )
}
