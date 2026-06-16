interface Props {
  calories: number;
  protein_g: number;
  carbs_g?: number;
  fat_g?: number;
  size?: "sm" | "md";
}

export function MacroPills({ calories, protein_g, carbs_g, fat_g, size = "md" }: Props) {
  const base = size === "sm" ? "text-[11px] px-2 py-0.5" : "text-[12px] px-2.5 py-1";

  return (
    <div className="flex flex-wrap gap-1.5">
      <span className={`macro-pill macro-kcal ${base}`}>{Math.round(calories)} kcal</span>
      <span className={`macro-pill macro-protein ${base}`}>{Math.round(protein_g)}g P</span>
      {carbs_g != null && (
        <span className={`macro-pill macro-carbs ${base}`}>{Math.round(carbs_g)}g C</span>
      )}
      {fat_g != null && (
        <span className={`macro-pill macro-fat ${base}`}>{Math.round(fat_g)}g F</span>
      )}
    </div>
  );
}
