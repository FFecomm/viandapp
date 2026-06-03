export default function Loading() {
  return (
    <div className="p-5 space-y-4 animate-pulse">
      <div className="h-7 w-40 rounded bg-muted" />
      <div className="h-32 rounded-2xl bg-muted" />
      <div className="h-32 rounded-2xl bg-muted" />
      <div className="grid grid-cols-2 gap-2">
        <div className="h-12 rounded-xl bg-muted" />
        <div className="h-12 rounded-xl bg-muted" />
      </div>
    </div>
  )
}
