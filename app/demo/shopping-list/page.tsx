"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { RECIPE_MAP } from "@/data/recipes";
import { PRODUCT_MAP } from "@/data/products";
import { buildShoppingList } from "@/lib/shopping";
import { MacroPills } from "@/components/MacroPills";
import { StoreBadge } from "@/components/StoreBadge";
import { ProductPhoto } from "@/components/ProductPhoto";
import type { ShoppingListItem } from "@/lib/types";

export default function ShoppingListPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ShoppingListContent />
    </Suspense>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex gap-1.5">
        {[0,1,2].map((i) => (
          <div key={i} className="loading-dot w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]" />
        ))}
      </div>
    </div>
  );
}

function ShoppingListContent() {
  const sp = useSearchParams();
  const recipeId = sp.get("recipe") ?? "";
  const recipe = RECIPE_MAP.get(recipeId);

  // useMemo keeps the list stable across renders; recipeId is the only real dependency
  const list = recipeId && recipe ? buildShoppingList(recipe, PRODUCT_MAP) : null;
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!list) return;
    const init: Record<string, boolean> = {};
    list.items.forEach((item) => { init[item.product_id] = false; });
    setChecked(init);
  }, [recipeId]); // stable string dep, not a new object every render

  const toggle = (id: string) =>
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));

  const doneCount = Object.values(checked).filter(Boolean).length;
  const total = list?.items.length ?? 0;

  if (!recipe || !list) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-5 text-center">
        <span className="text-4xl">🛒</span>
        <p className="font-semibold text-[var(--text-primary)]">No recipe selected</p>
        <p className="text-sm text-[var(--text-secondary)]">
          Go to results and tap &quot;Add to list&quot; on a meal.
        </p>
        <Link
          href="/demo/today"
          className="mt-2 px-6 py-3 rounded-2xl bg-[var(--accent-lime)] text-black font-semibold text-sm"
        >
          Find a meal
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="px-5 pt-10 pb-4 safe-top">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-semibold">
              Shopping list
            </p>
            <h1 className="text-xl font-bold text-[var(--text-primary)] mt-0.5">
              {recipe.name}
            </h1>
          </div>
          <StoreBadge store={recipe.store} size="md" />
        </div>

        {/* Progress */}
        <div className="mt-4 flex items-center gap-3">
          <div
            className="flex-1 h-1.5 rounded-full overflow-hidden"
            style={{ background: "var(--bg-elevated)" }}
          >
            <div
              className="h-full rounded-full bg-[var(--accent-lime)] transition-all duration-300"
              style={{ width: total > 0 ? `${(doneCount / total) * 100}%` : "0%" }}
            />
          </div>
          <span className="text-xs text-[var(--text-secondary)] whitespace-nowrap">
            {doneCount}/{total} items
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="flex flex-col gap-px px-4">
        {list.items.map((item) => (
          <ShoppingItem
            key={item.product_id}
            item={item}
            checked={checked[item.product_id] ?? false}
            onToggle={() => toggle(item.product_id)}
          />
        ))}
      </div>

      {/* Total + macros */}
      <div
        className="mx-4 mt-4 p-4 rounded-2xl"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-[var(--text-secondary)]">
            Estimated total
          </span>
          <span className="text-lg font-bold text-[var(--text-primary)]">
            CHF {list.total_chf.toFixed(2)}
          </span>
        </div>
        <MacroPills
          calories={recipe.calories}
          protein_g={recipe.protein_g}
          carbs_g={recipe.carbs_g}
          fat_g={recipe.fat_g}
          size="sm"
        />
        <p className="text-[10px] text-[var(--text-muted)] mt-2">
          Full pack prices. Last checked: {recipe.ingredients[0] ? PRODUCT_MAP.get(recipe.ingredients[0].product_id)?.last_checked_at : "—"}
        </p>
      </div>

      {/* Recipe link */}
      <div className="px-4 mt-4">
        <Link
          href={`/demo/recipe/${recipe.id}`}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold transition-opacity active:opacity-70"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            color: "var(--accent-green)",
          }}
        >
          View cooking method →
        </Link>
      </div>

      <div className="h-6" />
    </div>
  );
}

function ShoppingItem({
  item,
  checked,
  onToggle,
}: {
  item: ShoppingListItem;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex items-center gap-3 p-3 rounded-xl text-left w-full transition-all active:scale-[0.98] my-1 ${
        checked ? "opacity-50" : ""
      }`}
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      {/* Checkbox */}
      <div
        className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
          checked
            ? "bg-[var(--accent-lime)] border-[var(--accent-lime)]"
            : "border-[var(--border)]"
        }`}
      >
        {checked && <span className="text-black text-[10px] font-bold">✓</span>}
      </div>

      {/* Photo */}
      <ProductPhoto product={item.product} size="sm" />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div
          className={`text-sm font-semibold truncate ${
            checked ? "line-through" : "text-[var(--text-primary)]"
          }`}
        >
          {item.product.product_name}
        </div>
        <div className="text-xs text-[var(--text-muted)] mt-0.5">{item.quantity_display}</div>
      </div>

      {/* Price */}
      <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
        <span className="text-sm font-bold text-[var(--text-primary)]">
          CHF {item.actual_cost_chf.toFixed(2)}
        </span>
        <span className="text-[10px] text-[var(--text-muted)]">
          {item.packages_to_buy > 1 ? `${item.packages_to_buy}×` : ""}{item.product.package_size}
        </span>
        <span className="text-[10px] text-[var(--text-muted)]">
          {Math.round(item.protein_contribution_g)}g P
        </span>
      </div>
    </button>
  );
}
