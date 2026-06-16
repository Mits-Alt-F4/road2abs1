"use client";

import Image from "next/image";
import { useState } from "react";
import type { Product } from "@/lib/types";

const CATEGORY_CONFIG: Record<string, { emoji: string; bg: string; accent: string }> = {
  protein:       { emoji: "🥩", bg: "linear-gradient(135deg,#2d1f1f,#3d2a2a)", accent: "#c87070" },
  dairy:         { emoji: "🥛", bg: "linear-gradient(135deg,#1e2535,#253048)", accent: "#7090c8" },
  grain:         { emoji: "🌾", bg: "linear-gradient(135deg,#2a2315,#3a3020)", accent: "#c8a050" },
  vegetable:     { emoji: "🥦", bg: "linear-gradient(135deg,#1a2a1f,#223328)", accent: "#60b870" },
  fruit:         { emoji: "🍌", bg: "linear-gradient(135deg,#2a2510,#38330f)", accent: "#c8b840" },
  sauce:         { emoji: "🍅", bg: "linear-gradient(135deg,#2a1a15,#3a2018)", accent: "#c86040" },
  sweet:         { emoji: "🍫", bg: "linear-gradient(135deg,#251a10,#352515)", accent: "#b07840" },
  treat:         { emoji: "🍦", bg: "linear-gradient(135deg,#251a28,#322035)", accent: "#b070c8" },
  protein_snack: { emoji: "⚡", bg: "linear-gradient(135deg,#1f2a10,#283815)", accent: "#90c840" },
};

const SIZE_CONFIG = {
  sm:  { px: 44,  emojiSize: "text-xl",  radius: "rounded-xl" },
  md:  { px: 68,  emojiSize: "text-3xl", radius: "rounded-xl" },
  lg:  { px: 96,  emojiSize: "text-4xl", radius: "rounded-2xl" },
  xl:  { px: 128, emojiSize: "text-5xl", radius: "rounded-2xl" },
};

interface Props {
  product: Product;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function ProductPhoto({ product, size = "md", className = "" }: Props) {
  const [error, setError] = useState(false);
  const { px, emojiSize, radius } = SIZE_CONFIG[size];
  const src = product.uploaded_image_url || product.official_image_url;
  const cfg = CATEGORY_CONFIG[product.category] ?? CATEGORY_CONFIG.protein;

  const placeholder = (
    <div
      style={{ width: px, height: px, minWidth: px, background: cfg.bg }}
      className={`flex flex-col items-center justify-center ${radius} flex-shrink-0 relative overflow-hidden ${className}`}
      aria-label={product.product_name}
    >
      {/* subtle ring */}
      <div
        className="absolute inset-0 rounded-[inherit]"
        style={{ boxShadow: `inset 0 0 0 1px ${cfg.accent}22` }}
      />
      <span className={`${emojiSize} leading-none select-none`}>{cfg.emoji}</span>
      {size !== "sm" && (
        <span
          className="text-[9px] font-bold uppercase tracking-widest mt-1 opacity-60"
          style={{ color: cfg.accent }}
        >
          {product.store}
        </span>
      )}
    </div>
  );

  if (!src || error) return placeholder;

  return (
    <div
      style={{ width: px, height: px, minWidth: px }}
      className={`relative ${radius} overflow-hidden bg-[var(--bg-elevated)] flex-shrink-0 ${className}`}
    >
      <Image
        src={src}
        alt={product.product_name}
        fill
        className="object-contain p-1"
        onError={() => setError(true)}
        sizes={`${px}px`}
        unoptimized
      />
    </div>
  );
}

// Strip of up to 4 product photos used on meal cards
interface StripProps {
  products: Product[];
  maxShow?: number;
}

export function ProductPhotoStrip({ products, maxShow = 4 }: StripProps) {
  const shown = products.slice(0, maxShow);
  const overflow = products.length - maxShow;

  return (
    <div className="flex items-center gap-1.5">
      {shown.map((p) => (
        <ProductPhoto key={p.id} product={p} size="sm" />
      ))}
      {overflow > 0 && (
        <div
          style={{ width: 44, height: 44, minWidth: 44 }}
          className="flex items-center justify-center rounded-xl text-xs font-bold"
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
