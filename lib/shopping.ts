import type { Recipe, Product, RecipeIngredient, ShoppingList, ShoppingListItem } from "./types";
import { calculateIngredientCost, calculateProductServingMacros } from "./calc";

function packagesNeeded(product: Product, ing: RecipeIngredient): number {
  // Whole-package items: use the specified quantity directly
  if (ing.quantity_packages != null) return ing.quantity_packages;

  const pkgG = product.package_size_g ?? product.package_size_ml ?? 0;

  if (ing.quantity_g != null && pkgG > 0) {
    return Math.ceil(ing.quantity_g / pkgG);
  }
  if (ing.quantity_ml != null && pkgG > 0) {
    return Math.ceil(ing.quantity_ml / pkgG);
  }

  return 1;
}

export function buildShoppingList(
  recipe: Recipe,
  productMap: Map<string, Product>
): ShoppingList {
  const items: ShoppingListItem[] = [];

  for (const ing of recipe.ingredients) {
    const product = productMap.get(ing.product_id);
    if (!product) continue;

    const macros = calculateProductServingMacros(product, ing);
    const proportionalCost = calculateIngredientCost(product, ing);
    const packs = packagesNeeded(product, ing);
    const actualCost = Math.round(packs * product.displayed_price_chf * 100) / 100;

    items.push({
      product_id: ing.product_id,
      product,
      quantity_display: ing.display_quantity,
      price_contribution_chf: Math.round(proportionalCost * 100) / 100,
      packages_to_buy: packs,
      actual_cost_chf: actualCost,
      calories_contribution: Math.round(macros.calories),
      protein_contribution_g: Math.round(macros.protein_g * 10) / 10,
      checked: false,
    });
  }

  // Total = what you actually spend in the store
  const total = items.reduce((sum, item) => sum + item.actual_cost_chf, 0);

  return {
    id: `sl-${recipe.id}`,
    recipe_id: recipe.id,
    recipe_name: recipe.name,
    items,
    total_chf: Math.round(total * 100) / 100,
    created_at: new Date().toISOString(),
  };
}
