"use client";

import { useState, useMemo } from "react";
import { PRODUCTS } from "@/data/products";
import { ProductPhoto } from "@/components/ProductPhoto";
import type { Product } from "@/lib/types";

interface BuildItem {
  product: Product;
  grams: number;
}

function macrosForGrams(p: Product, g: number) {
  return {
    calories: (p.calories_per_100g * g) / 100,
    protein: (p.protein_per_100g * g) / 100,
    carbs: (p.carbs_per_100g * g) / 100,
    fat: (p.fat_per_100g * g) / 100,
    cost: p.package_size_g ? (p.displayed_price_chf / p.package_size_g) * g : p.displayed_price_chf,
  };
}

export default function BuildPage() {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<BuildItem[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return PRODUCTS.slice(0, 20);
    const q = search.toLowerCase();
    return PRODUCTS.filter(
      (p) =>
        p.product_name.toLowerCase().includes(q) ||
        (p.brand ?? "").toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    ).slice(0, 30);
  }, [search]);

  const totals = useMemo(() => {
    let calories = 0, protein = 0, carbs = 0, fat = 0, cost = 0;
    for (const item of items) {
      const m = macrosForGrams(item.product, item.grams);
      calories += m.calories;
      protein += m.protein;
      carbs += m.carbs;
      fat += m.fat;
      cost += m.cost;
    }
    return { calories: Math.round(calories), protein: Math.round(protein * 10) / 10, carbs: Math.round(carbs * 10) / 10, fat: Math.round(fat * 10) / 10, cost: Math.round(cost * 100) / 100 };
  }, [items]);

  const addProduct = (p: Product) => {
    const defaultG = p.package_size_g ?? 100;
    setItems((prev) => {
      const existing = prev.findIndex((i) => i.product.id === p.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], grams: updated[existing].grams + defaultG };
        return updated;
      }
      return [...prev, { product: p, grams: defaultG }];
    });
    setSearch("");
    setShowSearch(false);
  };

  const updateGrams = (idx: number, grams: number) => {
    if (grams <= 0) {
      setItems((prev) => prev.filter((_, i) => i !== idx));
      return;
    }
    setItems((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], grams };
      return updated;
    });
  };

  const proteinEff = totals.calories > 0 ? Math.round((totals.protein / totals.calories) * 100) : 0;

  return (
    <div className="flex flex-col min-h-screen pb-28">
      {/* Header */}
      <div className="px-5 pt-10 pb-4 safe-top sticky top-0 z-10" style={{ background: "var(--bg)" }}>
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Meal Builder</h1>
          <button
            onClick={() => setItems([])}
            className="text-xs text-[var(--text-muted)] px-3 py-1.5 rounded-full"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            Clear
          </button>
        </div>
        <p className="text-xs text-[var(--text-muted)] mb-3">Add products and set quantities to see total macros.</p>

        {/* Macro summary bar */}
        <div
          className="grid grid-cols-4 gap-2 p-3 rounded-2xl mb-3"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <MacroStat label="kcal" value={totals.calories} color="var(--accent-amber, #f0b43c)" />
          <MacroStat label="protein" value={`${totals.protein}g`} color="var(--accent-green)" />
          <MacroStat label="carbs" value={`${totals.carbs}g`} color="#64b5f6" />
          <MacroStat label="fat" value={`${totals.fat}g`} color="#ffb74d" />
        </div>

        <div className="flex gap-2 mb-3">
          <div
            className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <span className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wide">Cost</span>
            <span className="text-sm font-bold text-[var(--text-primary)]">CHF {totals.cost.toFixed(2)}</span>
          </div>
          <div
            className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <span className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wide">P%kcal</span>
            <span className="text-sm font-bold" style={{ color: proteinEff > 25 ? "var(--accent-lime)" : "var(--text-secondary)" }}>
              {proteinEff}%
            </span>
          </div>
        </div>

        {/* Add product button / search */}
        {!showSearch ? (
          <button
            onClick={() => setShowSearch(true)}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-95"
            style={{ background: "var(--accent-lime)", color: "#1a1a1a" }}
          >
            + Add product
          </button>
        ) : (
          <div>
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-2"
              style={{ background: "var(--bg-card)", border: "1px solid var(--accent-lime)" }}
            >
              <span className="text-[var(--text-muted)] text-sm">🔍</span>
              <input
                autoFocus
                type="text"
                placeholder="Search products…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
              />
              <button onClick={() => { setShowSearch(false); setSearch(""); }} className="text-[var(--text-muted)] text-sm">✕</button>
            </div>
            {/* Search results dropdown */}
            <div
              className="rounded-xl overflow-hidden max-h-64 overflow-y-auto"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              {filteredProducts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addProduct(p)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all active:scale-[0.98]"
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <ProductPhoto product={p} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-[var(--text-primary)] truncate">{p.product_name}</div>
                    <div className="text-[11px] text-[var(--text-muted)]">{p.protein_per_100g}g P · {p.calories_per_100g} kcal /100g</div>
                  </div>
                  <span className="text-xs text-[var(--text-muted)] flex-shrink-0">{p.package_size}</span>
                </button>
              ))}
              {filteredProducts.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-[var(--text-muted)]">No products found</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Items list */}
      <div className="flex flex-col gap-2 px-4 mt-2">
        {items.length === 0 && (
          <div className="text-center py-16">
            <p className="text-3xl mb-3">🏗️</p>
            <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">Build your meal</p>
            <p className="text-xs text-[var(--text-muted)]">Tap "+ Add product" to start adding ingredients.</p>
          </div>
        )}
        {items.map((item, idx) => {
          const m = macrosForGrams(item.product, item.grams);
          return (
            <div
              key={item.product.id}
              className="p-3 rounded-xl"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-3">
                <ProductPhoto product={item.product} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[var(--text-primary)] truncate">{item.product.product_name}</div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    {Math.round(m.calories)} kcal · {Math.round(m.protein * 10) / 10}g P · CHF {m.cost.toFixed(2)}
                  </div>
                </div>
                <button
                  onClick={() => updateGrams(idx, 0)}
                  className="text-[var(--text-muted)] text-lg leading-none flex-shrink-0 px-1"
                >
                  ×
                </button>
              </div>
              {/* Gram slider */}
              <div className="mt-3 flex items-center gap-3">
                <input
                  type="range"
                  min={10}
                  max={Math.max(800, (item.product.package_size_g ?? 200) * 3)}
                  step={5}
                  value={item.grams}
                  onChange={(e) => updateGrams(idx, Number(e.target.value))}
                  className="flex-1 accent-[var(--accent-lime)] h-1"
                />
                <div className="flex items-center gap-1 flex-shrink-0">
                  <input
                    type="number"
                    min={10}
                    max={9999}
                    value={item.grams}
                    onChange={(e) => updateGrams(idx, Number(e.target.value))}
                    className="w-14 text-right text-sm font-bold text-[var(--text-primary)] bg-transparent outline-none"
                    style={{ background: "var(--bg-elevated)", borderRadius: 6, padding: "2px 4px" }}
                  />
                  <span className="text-xs text-[var(--text-muted)]">g</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MacroStat({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-base font-bold" style={{ color }}>{value}</span>
      <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">{label}</span>
    </div>
  );
}
