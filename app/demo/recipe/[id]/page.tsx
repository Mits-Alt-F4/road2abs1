import { notFound } from "next/navigation";
import Link from "next/link";
import { RECIPE_MAP } from "@/data/recipes";
import { PRODUCT_MAP } from "@/data/products";
import { MacroPills } from "@/components/MacroPills";
import { StoreBadge } from "@/components/StoreBadge";
import { ProductPhoto } from "@/components/ProductPhoto";
import { calculateIngredientCost, calculateProductServingMacros } from "@/lib/calc";
import type { Product, RecipeIngredient } from "@/lib/types";

interface EnrichedIngredient {
  ing: RecipeIngredient;
  product: Product;
  macros: ReturnType<typeof calculateProductServingMacros>;
  cost: number;
}

export default async function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const recipe = RECIPE_MAP.get(id);
  if (!recipe) notFound();

  // Build enriched ingredients
  const ingredients: EnrichedIngredient[] = recipe.ingredients.flatMap((ing) => {
    const product = PRODUCT_MAP.get(ing.product_id);
    if (!product) return [];
    const macros = calculateProductServingMacros(product, ing);
    const cost = calculateIngredientCost(product, ing);
    return [{ ing, product, macros, cost }];
  });

  return (
    <div className="flex flex-col">
      {/* Back + store header */}
      <div className="px-5 pt-10 pb-3 flex items-center gap-3 safe-top">
        <Link
          href="/demo/results"
          className="text-xs text-[var(--text-muted)] px-3 py-1.5 rounded-full flex-shrink-0"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          ← Back
        </Link>
        <StoreBadge store={recipe.store} size="md" />
      </div>

      {/* Title + meta */}
      <div className="px-5 pb-5">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] leading-tight">
          {recipe.name}
        </h1>
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <MacroPills
            calories={recipe.calories}
            protein_g={recipe.protein_g}
            carbs_g={recipe.carbs_g}
            fat_g={recipe.fat_g}
          />
          <span className="text-xs text-[var(--text-secondary)]">
            {recipe.prep_time_min === 0 ? "No prep" : `${recipe.prep_time_min} min`}
          </span>
          <span className="text-sm font-bold text-[var(--text-primary)]">
            CHF {recipe.estimated_price_chf.toFixed(2)}
          </span>
        </div>
      </div>

      <Divider />

      {/* Ingredients */}
      <section className="px-5 py-5">
        <SectionTitle>Ingredients</SectionTitle>
        <div className="flex flex-col gap-3 mt-3">
          {ingredients.map(({ ing, product, macros, cost }) => (
            <IngredientCard
              key={ing.product_id}
              product={product}
              displayQty={ing.display_quantity}
              prepNote={ing.preparation_note}
              calories={macros.calories}
              protein={macros.protein_g}
              cost={cost}
            />
          ))}
        </div>
      </section>

      <Divider />

      {/* Method */}
      <section className="px-5 py-5">
        <SectionTitle>How to make it</SectionTitle>
        <div className="flex flex-col gap-4 mt-3">
          {recipe.method_steps.map((step, i) => (
            <div key={i} className="flex gap-3">
              <div
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: "var(--bg-elevated)",
                  color: "var(--accent-lime)",
                  border: "1px solid var(--border)",
                }}
              >
                {i + 1}
              </div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed pt-0.5">
                {step}
              </p>
            </div>
          ))}
        </div>
        {recipe.equipment.length > 0 && recipe.equipment[0] !== "none" && (
          <p className="text-xs text-[var(--text-muted)] mt-4">
            Equipment: {recipe.equipment.join(", ")}
          </p>
        )}
      </section>

      <Divider />

      {/* Shopping list CTA */}
      <div className="px-5 py-5">
        <Link
          href={`/demo/shopping-list?recipe=${recipe.id}`}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-[var(--accent-lime)] text-black font-semibold text-base active:scale-95 transition-transform"
        >
          🛒 Add to shopping list
        </Link>
      </div>

      <div className="h-4" />
    </div>
  );
}

function IngredientCard({
  product,
  displayQty,
  prepNote,
  calories,
  protein,
  cost,
}: {
  product: Product;
  displayQty: string;
  prepNote?: string;
  calories: number;
  protein: number;
  cost: number;
}) {
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      <ProductPhoto product={product} size="md" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-[var(--text-primary)] truncate">
          {product.product_name}
        </div>
        <div className="text-xs text-[var(--text-muted)] mt-0.5">{displayQty}</div>
        {prepNote && (
          <div className="text-xs text-[var(--accent-green)] mt-0.5">{prepNote}</div>
        )}
        <div className="flex gap-2 mt-1.5">
          <span className="macro-pill macro-kcal text-[10px] px-1.5 py-0.5">
            {Math.round(calories)} kcal
          </span>
          <span className="macro-pill macro-protein text-[10px] px-1.5 py-0.5">
            {Math.round(protein)}g P
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="text-xs font-semibold text-[var(--text-secondary)]">
          {cost > 0 ? `~CHF ${cost.toFixed(2)}` : "—"}
        </span>
        {product.official_product_url && (
          <a
            href={product.official_product_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-[var(--accent-green)] underline"
          >
            View ↗
          </a>
        )}
        <span className="text-[10px] text-[var(--text-muted)]">
          {product.last_checked_at}
        </span>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
      {children}
    </h2>
  );
}

function Divider() {
  return <div className="h-px mx-5" style={{ background: "var(--border)" }} />;
}
