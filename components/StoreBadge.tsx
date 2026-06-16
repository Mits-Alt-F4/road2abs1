import type { Store } from "@/lib/types";

interface Props {
  store: Store;
  size?: "sm" | "md";
}

const LABELS: Record<Store, string> = {
  coop: "Coop",
  migros: "Migros",
  either: "Both",
};

export function StoreBadge({ store, size = "sm" }: Props) {
  const cls = size === "sm" ? "text-[11px] px-2 py-0.5" : "text-xs px-2.5 py-1";
  const badge =
    store === "coop"
      ? "badge-coop"
      : store === "migros"
      ? "badge-migros"
      : "badge-either";

  return (
    <span className={`inline-flex items-center rounded-full font-semibold ${badge} ${cls}`}>
      {LABELS[store]}
    </span>
  );
}
