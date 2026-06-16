export type Store = "coop" | "migros" | "either";
export type VerificationStatus = "verified" | "needs_review" | "incomplete" | "unverified";
export type ServingUnit = "grams" | "ml" | "piece" | "package";

export interface Product {
  id: string;
  store: Store;
  product_name: string;
  brand?: string;
  category: string;
  official_product_url?: string;
  official_image_url?: string;
  uploaded_image_url?: string;
  displayed_price_chf: number;
  package_size: string;
  package_size_g?: number;
  package_size_ml?: number;
  serving_unit: ServingUnit;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  verification_status: VerificationStatus;
  last_checked_at: string;
  source_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface RecipeIngredient {
  product_id: string;
  quantity_g?: number;
  quantity_ml?: number;
  quantity_pieces?: number;
  quantity_packages?: number;
  display_quantity: string;
  preparation_note?: string;
}

export type Vibe =
  | "quick"
  | "no_cook"
  | "max_protein"
  | "sweet_treat"
  | "emergency_protein"
  | "meal_prep"
  | "cheap"
  | "post_gym"
  | "lazy_dinner"
  | "full_dinner";

export interface Recipe {
  id: string;
  name: string;
  vibe: Vibe;
  store: Store;
  ingredients: RecipeIngredient[];
  method_steps: string[];
  prep_time_min: number;
  equipment: string[];
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  estimated_price_chf: number;
  why_it_fits?: string;
  created_at: string;
}

export interface MacroInput {
  calories: number;
  protein_g: number;
  carbs_g?: number;
  fat_g?: number;
}

export interface UserPreferences {
  daily_calories: number;
  protein_min_g: number;
  protein_max_g: number;
  budget_chf: number;
  preferred_store: Store;
}

export interface RecommendationRequest {
  macros: MacroInput;
  store: Store;
  vibe: Vibe;
  budget_chf?: number;
}

export interface RecommendedMeal {
  recipe: Recipe;
  score: number;
  why_it_fits: string;
  fits: boolean;
  price_chf: number;
  over_limit_reason?: string;
}

export interface ShoppingListItem {
  product_id: string;
  product: Product;
  quantity_display: string;
  price_contribution_chf: number; // proportional share of the recipe cost
  packages_to_buy: number;        // how many packs to actually buy
  actual_cost_chf: number;        // packages_to_buy × product price (what you pay in store)
  calories_contribution: number;
  protein_contribution_g: number;
  checked: boolean;
}

export interface ShoppingList {
  id: string;
  recipe_id: string;
  recipe_name: string;
  items: ShoppingListItem[];
  total_chf: number;
  created_at: string;
}
