import type {
  RecommendationRequest,
  RecommendedMeal,
  Recipe,
  Vibe,
} from "./types";
import type { Product } from "./types";
import {
  isValidProduct,
  isValidRecipe,
  calculateProteinEfficiency,
  calculateRecipePrice,
  fitsCalories,
  fitsBudget,
  getCalorieRange,
} from "./calc";

const VIBE_RELATED: Record<Vibe, Vibe[]> = {
  quick: ["quick", "no_cook", "emergency_protein"],
  no_cook: ["no_cook", "emergency_protein", "sweet_treat", "quick"],
  max_protein: ["max_protein", "emergency_protein", "post_gym", "quick"],
  sweet_treat: ["sweet_treat", "no_cook", "max_protein"],
  emergency_protein: ["emergency_protein", "max_protein", "no_cook"],
  meal_prep: ["meal_prep", "full_dinner", "post_gym"],
  cheap: ["cheap", "quick", "no_cook", "emergency_protein", "lazy_dinner"],
  post_gym: ["post_gym", "quick", "max_protein", "full_dinner"],
  lazy_dinner: ["lazy_dinner", "no_cook", "quick", "cheap"],
  full_dinner: ["full_dinner", "meal_prep", "post_gym"],
};

function storeMatches(recipe: Recipe, requestedStore: "coop" | "migros" | "either"): boolean {
  if (requestedStore === "either") return true;
  return recipe.store === requestedStore;
}

function vibeScore(recipeVibe: Vibe, requestedVibe: Vibe): number {
  if (recipeVibe === requestedVibe) return 40;
  if (VIBE_RELATED[requestedVibe].includes(recipeVibe)) return 18;
  return 0;
}

function buildWhyItFits(recipe: Recipe, cal: number, pro: number, budget: number, price: number): string {
  const parts: string[] = [];
  parts.push(`${recipe.protein_g}g protein for ${recipe.calories} kcal`);
  if (price > 0) {
    parts.push(`CHF ${price.toFixed(2)}`);
  }
  if (price > 0 && price <= budget) {
    parts.push("stays under budget");
  }
  if (recipe.protein_g >= pro * 0.9) {
    parts.push("hits your protein target");
  }
  if (recipe.prep_time_min <= 5) {
    parts.push("ready in under 5 min");
  }
  return "Works because it gives " + parts.join(", ") + ".";
}

export function getRecommendations(
  request: RecommendationRequest,
  recipes: Recipe[],
  productMap: Map<string, Product>
): { fits: RecommendedMeal[]; tooLarge: RecommendedMeal[] } {
  const { macros, store, vibe, budget_chf = 15 } = request;
  const targetCal = macros.calories;
  const targetPro = macros.protein_g;
  const calorieRange = getCalorieRange(targetCal);

  const fits: RecommendedMeal[] = [];
  const tooLarge: RecommendedMeal[] = [];

  for (const recipe of recipes) {
    if (!isValidRecipe(recipe, productMap)) continue;
    if (!storeMatches(recipe, store)) continue;

    // Calorie-range gating: emergency → only emergency/snack vibes
    if (calorieRange === "emergency" && !["emergency_protein", "no_cook", "sweet_treat"].includes(recipe.vibe)) continue;
    if (calorieRange === "light" && recipe.calories > 650) continue;

    const isTooLarge = !fitsCalories(recipe.calories, targetCal);

    // Scoring (max 100)
    const vScore = vibeScore(recipe.vibe, vibe);
    // Skip recipes with zero vibe match in non-emergency modes
    if (vScore === 0 && calorieRange !== "emergency") continue;

    // Protein efficiency: g protein per 100 kcal, normalised 0–25
    const efficiency = calculateProteinEfficiency(recipe.calories, recipe.protein_g);
    const effScore = Math.min(25, efficiency * 2.5);

    // Calorie fit: 25 if fits, sliding down if over
    const calScore = isTooLarge
      ? Math.max(0, 25 - (recipe.calories - targetCal) / 20)
      : 25;

    // Budget fit: 0–10
    const price = calculateRecipePrice(recipe, productMap);
    const budgetScore = price > 0 && fitsBudget(price, budget_chf) ? 10 : 0;

    const score = vScore + effScore + calScore + budgetScore;

    const meal: RecommendedMeal = {
      recipe,
      score,
      price_chf: price,
      why_it_fits: buildWhyItFits(recipe, targetCal, targetPro, budget_chf, price),
      fits: !isTooLarge,
      over_limit_reason: isTooLarge
        ? `${recipe.calories} kcal is over your ${targetCal} kcal remaining`
        : undefined,
    };

    if (isTooLarge) {
      tooLarge.push(meal);
    } else {
      fits.push(meal);
    }
  }

  fits.sort((a, b) => b.score - a.score);
  tooLarge.sort((a, b) => b.score - a.score);

  return {
    fits: fits.slice(0, 5),
    tooLarge: tooLarge.slice(0, 3),
  };
}
