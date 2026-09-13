export function StockBadge({ estoque }: { estoque: number }) {
  if (estoque === 0) {
    return (
      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
        Esgotado
      </span>
    );
  }
  if (estoque <= 5) {
    return (
      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
        {estoque} un. — baixo
      </span>
    );
  }
  return (
    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
      {estoque} un.
    </span>
  );
}
