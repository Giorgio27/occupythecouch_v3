export default function SelectedMovies({ items }: { items: any[] }) {
  if (!items.length) return null;
  return (
    <div className="rounded-md border p-3 text-sm">
      <div className="mb-2 font-medium">Selected movies</div>
      <div className="flex flex-wrap gap-2">
        {items.map((m) => (
          <span key={m.id} className="rounded bg-muted px-2 py-1">
            {m.l} {m.y ? `(${m.y})` : ""}
          </span>
        ))}
      </div>
    </div>
  );
}
