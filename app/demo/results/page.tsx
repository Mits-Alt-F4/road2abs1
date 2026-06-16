import Link from "next/link";
import { RECIPES } from "@/data/recipes";
import { PRODUCT_MAP } from "@/data/products";
import { getRecommendations } from "@/lib/recommendations";
import { MacroPills } from "@/components/MacroPills";
import { StoreBadge } from "@/components/StoreBadge";
import { ProductPhotoStrip } from "@/components/ProductPhoto";
import type { Store, Vibe, RecommendedMeal } from "@/lib/types";

interface SearchParams {
  cal?: string;
  pro?: string;
  carbs?: string;
  fat?: string;
  store?: string;
  vibe?: string;
  budget?: string;
}

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const cal = parseInt(sp.cal ?? "0") || 0;
  const pro = parseInt(sp.pro ?? "0") || 0;
  const store = (sp.store as Store) ?? "either";
  const vibe = (sp.vibe as Vibe) ?? "quick";
  const budget = parseFloat(sp.budget ?? "10") || 10;

  const { fits, tooLarge } = getRecommendations(
    {
      macros: {
        calories: cal,
        protein_g: pro,
        carbs_g: sp.carbs ? parseInt(sp.carbs) : undefined,
        fat_g: sp.fat ? parseInt(sp.fat) : undefined,
      },
      store,
      vibe,
      budget_chf: budget,
    },
    RECIPES,
    PRODUCT_MAP
  );

  const params = new URLSearchParams(sp as Record<string, string>);

  return (
    <div className="flex flex-col gap-0">
      {/* Header */}
      <div className="px-5 pt-10 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">Your options</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              {cal} kcal · {pro}g protein · CHF {budget} · {store === "either" ? "any store" : store}
            </p>
          </div>
          <Link
            href="/demo/today"
            className="text-xs text-[var(--text-muted)] px-3 py-1.5 rounded-full"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            ← Change
          </Link>
        </div>
      </div>

      {/* No results */}
      {fits.length === 0 && (
        <div className="px-5 py-12 flex flex-col items-center gap-3 text-center">
          <span className="text-4xl">🤔</span>
          <p className="font-semibold text-[var(--text-primary)]">Nothing matched those filters</p>
          <p className="text-sm text-[var(--text-secondary)]">
            Try adjusting the store, vibe, or entering more calories.
          </p>
          <Link
            href="/demo/today"
            className="mt-2 px-6 py-3 rounded-2xl bg-[var(--accent-lime)] text-black font-semibold text-sm"
          >
            Try again
          </Link>
        </div>
      )}

      {/* Results */}
      {fits.length > 0 && (
        <div className="flex flex-col gap-px">
          {fits.map((meal) => (
            <MealCard key={meal.recipe.id} meal={meal} searchParams={params.toString()} />
          ))}
        </div>
      )}

      {/* Too large */}
      {tooLarge.length > 0 && (
        <div className="px-5 pt-8 pb-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
            Too big for today
          </h2>
        </div>
      )}
      {tooLarge.map((meal) => (
        <MealCard
          key={meal.recipe.id}
          meal={meal}
          searchParams={params.toString()}
          dimmed
        />
      ))}

      <div className="h-6" />
    </div>
  );
}

function MealCard({
  meal,
  searchParams,
  dimmed = false,
}: {
  meal: RecommendedMeal;
  searchParams: string;
  dimmed?: boolean;
}) {
  const { recipe } = meal;

  // Collect product objects for photo strip
  const ingredients = recipe.ingredients
    .map((ing) => PRODUCT_MAP.get(ing.product_id))
    .filter(Boolean) as ReturnType<typeof PRODUCT_MAP.get>[];

  const products = ingredients.filter((p) => p !== undefined) as NonNullable<typeof ingredients[number]>[];

  const vibeLabel = recipe.vibe.replace("_", " ");

  return (
    <div
      className={`mx-4 my-1.5 rounded-2xl overflow-hidden ${dimmed ? "opacity-60" : ""}`}
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      <div className="px-4 pt-4 pb-3 flex flex-col gap-3">
        {/* Top row: vibe + store */}
        <div className="flex items-center gap-2">
          <span
            className="text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
            style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}
          >
            {vibeLabel}
          </span>
          <StoreBadge store={recipe.store} />
          <span className="ml-auto text-xs text-[var(--text-secondary)]">
            {recipe.prep_time_min === 0
              ? "no prep"
              : `${recipe.prep_time_min} min`}
          </span>
        </div>

        {/* Meal name */}
        <h2 className="text-lg font-bold text-[var(--text-primary)] leading-tight">
          {recipe.name}
        </h2>

        {/* Photo strip */}
        {products.length > 0 && (
          <ProductPhotoStrip products={products} maxShow={4} />
        )}

        {/* Macros */}
        <MacroPills
          calories={recipe.calories}
          protein_g={recipe.protein_g}
          carbs_g={recipe.carbs_g}
          fat_g={recipe.fat_g}
        />

        {/* Price + why it fits */}
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed flex-1">
            {meal.why_it_fits}
          </p>
          <span className="text-sm font-bold text-[var(--text-primary)] whitespace-nowrap">
            CHF {meal.price_chf > 0 ? meal.price_chf.toFixed(2) : "—"}
          </span>
        </div>

        {/* Over limit warning */}
        {meal.over_limit_reason && (
          <p className="text-xs text-[var(--text-muted)] italic">{meal.over_limit_reason}</p>
        )}
      </div>

      {/* Action buttons */}
      <div
        className="flex border-t"
        style={{ borderColor: "var(--border)" }}
      >
        <Link
          href={`/demo/recipe/${recipe.id}?${searchParams}`}
          className="flex-1 py-3 text-center text-sm font-semibold text-[var(--accent-green)] transition-opacity active:opacity-70"
        >
          View recipe
        </Link>
        <div className="w-px self-stretch" style={{ background: "var(--border)" }} />
        <Link
          href={`/demo/shopping-list?recipe=${recipe.id}`}
          className="flex-1 py-3 text-center text-sm font-semibold text-[var(--text-secondary)] transition-opacity active:opacity-70"
        >
          Add to list
        </Link>
      </div>
    </div>
  );
}
