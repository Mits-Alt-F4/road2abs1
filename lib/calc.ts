import type { Product, RecipeIngredient, MacroInput, Recipe } from "./types";

function safeNum(n: number | undefined | null, fallback = 0): number {
  if (n == null || isNaN(n) || !isFinite(n)) return fallback;
  return n;
}

function macrosForGrams(product: Product, grams: number) {
  const g = safeNum(grams);
  const cal = safeNum(product.calories_per_100g) * g / 100;
  const pro = safeNum(product.protein_per_100g) * g / 100;
  const carb = safeNum(product.carbs_per_100g) * g / 100;
  const fat = safeNum(product.fat_per_100g) * g / 100;
  return { calories: cal, protein_g: pro, carbs_g: carb, fat_g: fat };
}

export function calculateProductServingMacros(
  product: Product,
  ingredient: RecipeIngredient
): { calories: number; protein_g: number; carbs_g: number; fat_g: number } {
  if (!isValidProduct(product)) {
    return { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
  }

  if (ingredient.quantity_g != null) {
    return macrosForGrams(product, ingredient.quantity_g);
  }

  if (ingredient.quantity_ml != null) {
    // Approximate: 1ml ≈ 1g for liquids in nutrition context
    return macrosForGrams(product, ingredient.quantity_ml);
  }

  if (ingredient.quantity_packages != null) {
    const pkgG = safeNum(product.package_size_g ?? product.package_size_ml);
    if (pkgG > 0) {
      return macrosForGrams(product, pkgG * ingredient.quantity_packages);
    }
  }

  if (ingredient.quantity_pieces != null) {
    // Per-piece: use package_size_g divided by typical piece count, or fallback to whole package
    const pkgG = safeNum(product.package_size_g ?? product.package_size_ml);
    if (pkgG > 0) {
      return macrosForGrams(product, pkgG * ingredient.quantity_pieces);
    }
  }

  return { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
}

export function calculateIngredientCost(
  product: Product,
  ingredient: RecipeIngredient
): number {
  const price = safeNum(product.displayed_price_chf);
  if (price <= 0) return 0;

  if (ingredient.quantity_packages != null) {
    return price * ingredient.quantity_packages;
  }

  // Always charge the full package price — you buy the whole thing at the store
  return price;
}

export function calculateRecipeMacros(
  recipe: Recipe,
  productMap: Map<string, Product>
): { calories: number; protein_g: number; carbs_g: number; fat_g: number } {
  let calories = 0, protein_g = 0, carbs_g = 0, fat_g = 0;

  for (const ing of recipe.ingredients) {
    const product = productMap.get(ing.product_id);
    if (!product) continue;
    const m = calculateProductServingMacros(product, ing);
    calories += m.calories;
    protein_g += m.protein_g;
    carbs_g += m.carbs_g;
    fat_g += m.fat_g;
  }

  return {
    calories: Math.round(calories),
    protein_g: Math.round(protein_g * 10) / 10,
    carbs_g: Math.round(carbs_g * 10) / 10,
    fat_g: Math.round(fat_g * 10) / 10,
  };
}

export function calculateRecipePrice(
  recipe: Recipe,
  productMap: Map<string, Product>
): number {
  let total = 0;
  let valid = true;

  for (const ing of recipe.ingredients) {
    const product = productMap.get(ing.product_id);
    if (!product || product.displayed_price_chf <= 0) {
      valid = false;
      continue;
    }
    total += calculateIngredientCost(product, ing);
  }

  if (!valid || total <= 0) return -1;
  return Math.round(total * 100) / 100;
}

export function calculateProteinEfficiency(calories: number, protein_g: number): number {
  if (calories <= 0) return 0;
  return Math.round((protein_g / calories) * 1000) / 10; // g protein per 100 kcal
}

export function isValidProduct(product: Product): boolean {
  if (!product.product_name) return false;
  if (product.displayed_price_chf <= 0) return false;
  if (product.calories_per_100g < 0) return false;
  if (product.protein_per_100g < 0) return false;
  if (product.verification_status === "incomplete") return false;
  return true;
}

export function isValidRecipe(recipe: Recipe, productMap: Map<string, Product>): boolean {
  if (!recipe.name || recipe.ingredients.length === 0) return false;
  for (const ing of recipe.ingredients) {
    const p = productMap.get(ing.product_id);
    if (!p || !isValidProduct(p)) return false;
  }
  const price = calculateRecipePrice(recipe, productMap);
  if (price < 0) return false;
  return true;
}

export function formatChf(amount: number): string {
  if (amount < 0 || isNaN(amount) || !isFinite(amount)) return "price needs review";
  return `CHF ${amount.toFixed(2)}`;
}

export function formatMacro(value: number, unit: string): string {
  if (isNaN(value) || !isFinite(value)) return `—${unit}`;
  return `${Math.round(value)}${unit}`;
}

export function fitsCalories(recipeCal: number, targetCal: number): boolean {
  return recipeCal <= targetCal * 1.05; // 5% tolerance
}

export function fitsProtein(recipeProtein: number, targetProtein: number): boolean {
  return recipeProtein >= targetProtein * 0.85;
}

export function fitsBudget(recipePrice: number, budget: number): boolean {
  return recipePrice <= budget * 1.1;
}

export function getCalorieRange(calories: number): "emergency" | "light" | "normal" | "full" {
  if (calories <= 300) return "emergency";
  if (calories <= 600) return "light";
  if (calories <= 900) return "normal";
  return "full";
}
