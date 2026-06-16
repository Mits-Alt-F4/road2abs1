"use client";

import { useState, useMemo } from "react";
import { PRODUCTS } from "@/data/products";
import { ProductPhoto } from "@/components/ProductPhoto";
import type { Product, Store, VerificationStatus } from "@/lib/types";

type SortKey = "protein" | "calories" | "price" | "ppp" | "name";
type CategoryFilter = "all" | "protein" | "carbs" | "dairy" | "veg" | "treat" | "other";

const CATEGORY_LABELS: Record<CategoryFilter, string> = {
  all: "All",
  protein: "Protein",
  carbs: "Carbs",
  dairy: "Dairy",
  veg: "Veg",
  treat: "Treat",
  other: "Other",
};

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [store, setStore] = useState<"all" | Store>("all");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [sort, setSort] = useState<SortKey>("protein");
  const [minProtein, setMinProtein] = useState(0);
  const [maxCalories, setMaxCalories] = useState(9999);
  const [statusFilter, setStatusFilter] = useState<"all" | VerificationStatus>("all");

  const filtered = useMemo(() => {
    return PRODUCTS.filter((p) => {
      if (store !== "all" && p.store !== store) return false;
      if (category !== "all" && !p.category.includes(category)) return false;
      if (statusFilter !== "all" && p.verification_status !== statusFilter) return false;
      if (p.protein_per_100g < minProtein) return false;
      if (p.calories_per_100g > maxCalories) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !p.product_name.toLowerCase().includes(q) &&
          !(p.brand ?? "").toLowerCase().includes(q) &&
          !p.category.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    }).sort((a, b) => {
      if (sort === "protein") return b.protein_per_100g - a.protein_per_100g;
      if (sort === "calories") return a.calories_per_100g - b.calories_per_100g;
      if (sort === "price") return a.displayed_price_chf - b.displayed_price_chf;
      if (sort === "ppp") {
        const pppA = a.package_size_g && a.protein_per_100g > 0 ? a.displayed_price_chf / (a.protein_per_100g / 100 * a.package_size_g) : 9999;
        const pppB = b.package_size_g && b.protein_per_100g > 0 ? b.displayed_price_chf / (b.protein_per_100g / 100 * b.package_size_g) : 9999;
        return pppA - pppB;
      }
      return a.product_name.localeCompare(b.product_name);
    });
  }, [search, store, category, sort, minProtein, maxCalories, statusFilter]);

  const verified = PRODUCTS.filter((p) => p.verification_status === "verified").length;
  const needsReview = PRODUCTS.filter((p) => p.verification_status === "needs_review").length;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="px-5 pt-10 pb-4 safe-top sticky top-0 z-10" style={{ background: "var(--bg)" }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">Product Library</h1>
            <div className="flex gap-3 mt-0.5">
              <span className="text-xs" style={{ color: "var(--accent-green)" }}>{verified} verified</span>
              <span className="text-xs text-[var(--text-muted)]">{needsReview} needs review</span>
              <span className="text-xs text-[var(--text-muted)]">{PRODUCTS.length} total</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-3"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <span className="text-[var(--text-muted)] text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-[var(--text-muted)] text-sm">✕</button>
          )}
        </div>

        {/* Store toggle */}
        <div className="flex gap-2 mb-3">
          {(["all", "coop", "migros"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStore(s)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: store === s
                  ? s === "coop" ? "rgba(229,38,31,0.2)" : s === "migros" ? "rgba(255,102,0,0.2)" : "var(--bg-elevated)"
                  : "var(--bg-card)",
                color: store === s
                  ? s === "coop" ? "#e5261f" : s === "migros" ? "#ff8c42" : "var(--text-primary)"
                  : "var(--text-muted)",
                border: `1px solid ${store === s ? "currentColor" : "var(--border)"}`,
              }}
            >
              {s === "all" ? "All stores" : s === "coop" ? "Coop" : "Migros"}
            </button>
          ))}
        </div>

        {/* Category pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar mb-3">
          {(Object.keys(CATEGORY_LABELS) as CategoryFilter[]).map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className="px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0"
              style={{
                background: category === c ? "var(--accent-lime)" : "var(--bg-card)",
                color: category === c ? "#1a1a1a" : "var(--text-muted)",
                border: `1px solid ${category === c ? "var(--accent-lime)" : "var(--border)"}`,
              }}
            >
              {CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>

        {/* Sort + status row */}
        <div className="flex gap-2">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold outline-none"
            style={{ background: "var(--bg-card)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
          >
            <option value="protein">Sort: most protein</option>
            <option value="ppp">Sort: best CHF/g protein</option>
            <option value="calories">Sort: lowest calories</option>
            <option value="price">Sort: cheapest</option>
            <option value="name">Sort: A–Z</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | VerificationStatus)}
            className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold outline-none"
            style={{ background: "var(--bg-card)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
          >
            <option value="all">All statuses</option>
            <option value="verified">Verified only</option>
            <option value="needs_review">Needs review</option>
            <option value="incomplete">Incomplete</option>
          </select>
        </div>

        {/* Macro sliders */}
        <div className="flex gap-4 mt-3">
          <div className="flex-1">
            <div className="flex justify-between mb-1">
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">Min protein /100g</span>
              <span className="text-[10px] font-bold" style={{ color: "var(--accent-green)" }}>{minProtein}g+</span>
            </div>
            <input
              type="range" min={0} max={40} value={minProtein}
              onChange={(e) => setMinProtein(Number(e.target.value))}
              className="w-full accent-[var(--accent-lime)] h-1"
            />
          </div>
          <div className="flex-1">
            <div className="flex justify-between mb-1">
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">Max kcal /100g</span>
              <span className="text-[10px] font-bold text-[#f0b43c]">{maxCalories === 9999 ? "any" : `≤${maxCalories}`}</span>
            </div>
            <input
              type="range" min={50} max={600} step={10}
              value={maxCalories === 9999 ? 600 : maxCalories}
              onChange={(e) => {
                const v = Number(e.target.value);
                setMaxCalories(v >= 600 ? 9999 : v);
              }}
              className="w-full accent-[var(--accent-lime)] h-1"
            />
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="px-5 py-2">
        <span className="text-xs text-[var(--text-muted)]">{filtered.length} product{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Product grid */}
      <div className="flex flex-col gap-2 px-4 pb-24">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-2xl mb-2">🔍</p>
            <p className="text-sm text-[var(--text-muted)]">No products match your filters.</p>
            <button
              onClick={() => { setSearch(""); setStore("all"); setCategory("all"); setMinProtein(0); setMaxCalories(9999); setStatusFilter("all"); }}
              className="mt-3 text-xs text-[var(--accent-green)] underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          filtered.map((product) => <ProductCard key={product.id} product={product} />)
        )}
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const proteinEff = product.calories_per_100g > 0
    ? Math.round((product.protein_per_100g / product.calories_per_100g) * 100)
    : 0;
  const ppp = product.package_size_g && product.protein_per_100g > 0
    ? (product.displayed_price_chf / (product.protein_per_100g / 100 * product.package_size_g)).toFixed(2)
    : null;

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      <ProductPhoto product={product} size="md" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-semibold text-[var(--text-primary)] truncate">
            {product.product_name}
          </span>
          <StoreDot store={product.store} />
        </div>
        <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{product.package_size}</div>

        {/* Macro row */}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className="macro-pill macro-protein">{product.protein_per_100g}g P</span>
          <span className="macro-pill macro-kcal">{product.calories_per_100g} kcal</span>
          <span className="macro-pill macro-carbs">{product.carbs_per_100g}g C</span>
          <span className="macro-pill macro-fat">{product.fat_per_100g}g F</span>
          <span className="text-[10px] text-[var(--text-muted)]">per 100g</span>
        </div>

        {/* Protein efficiency bar */}
        <div className="mt-2">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] text-[var(--text-muted)]">protein efficiency</span>
            <span className="text-[10px] font-bold" style={{ color: proteinEff > 25 ? "var(--accent-lime)" : "var(--text-muted)" }}>
              {proteinEff}%
            </span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(proteinEff, 100)}%`,
                background: proteinEff > 30 ? "var(--accent-lime)" : proteinEff > 15 ? "var(--accent-green)" : "var(--text-muted)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Right column */}
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <span className="text-sm font-bold text-[var(--text-primary)]">
          CHF {product.displayed_price_chf.toFixed(2)}
        </span>
        {ppp && (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(180,224,64,0.12)", color: "var(--accent-lime)" }}>
            {ppp} CHF/g P
          </span>
        )}
        <StatusBadge status={product.verification_status} />
        <span className="text-[10px] text-[var(--text-muted)]">
          {product.last_checked_at.slice(0, 10)}
        </span>
        {product.official_product_url && (
          <a
            href={product.official_product_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] underline"
            style={{ color: "var(--accent-green)" }}
          >
            View ↗
          </a>
        )}
      </div>
    </div>
  );
}

function StoreDot({ store }: { store: string }) {
  return (
    <span
      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
      style={{
        background: store === "coop" ? "rgba(229,38,31,0.15)" : "rgba(255,102,0,0.15)",
        color: store === "coop" ? "#e5261f" : "#ff8c42",
      }}
    >
      {store === "coop" ? "Coop" : "Migros"}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; color: string; bg: string }> = {
    verified: { label: "✓ Verified", color: "#6aad6a", bg: "rgba(106,173,106,0.15)" },
    needs_review: { label: "Review", color: "#f0b43c", bg: "rgba(240,180,60,0.15)" },
    incomplete: { label: "Incomplete", color: "#e5261f", bg: "rgba(229,38,31,0.15)" },
    unverified: { label: "Unverified", color: "#9a9590", bg: "rgba(154,149,144,0.15)" },
  };
  const c = cfg[status] ?? cfg.unverified;
  return (
    <span
      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
      style={{ background: c.bg, color: c.color }}
    >
      {c.label}
    </span>
  );
}
