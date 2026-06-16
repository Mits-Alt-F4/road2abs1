import { NextRequest, NextResponse } from "next/server";
import { PRODUCTS } from "@/data/products";
import { RECIPES } from "@/data/recipes";

export const dynamic = "force-dynamic";

// Build a short product summary for the AI context
function buildProductContext(): string {
  return PRODUCTS.map(
    (p) =>
      `[${p.id}] ${p.store.toUpperCase()} — ${p.product_name} | ${p.package_size} | CHF ${p.displayed_price_chf.toFixed(2)} | per 100g: ${p.calories_per_100g} kcal, ${p.protein_per_100g}g P`
  ).join("\n");
}

function buildRecipeContext(): string {
  return RECIPES.map(
    (r) =>
      `[${r.id}] ${r.store.toUpperCase()} — ${r.name} | ${r.calories} kcal, ${r.protein_g}g P | CHF ${r.estimated_price_chf.toFixed(2)} | ${r.prep_time_min} min | vibe: ${r.vibe}`
  ).join("\n");
}

const SYSTEM_PROMPT = `You are the Road2Abs AI assistant. You help users find high-protein meals from Swiss supermarkets (Coop and Migros) based on their remaining daily macros.

RULES:
- Only suggest meals and products from the verified database below.
- Never invent products, prices, or macros.
- If the database doesn't have enough products for the request, say so clearly.
- Give short, practical answers — not essays.
- Always mention calories, protein, and price for any meal suggestion.
- Reference recipe IDs like [chicken-wrap-coop] so the user can find them in the app.

VERIFIED PRODUCTS:
${buildProductContext()}

VERIFIED RECIPES:
${buildRecipeContext()}`;

export async function POST(req: NextRequest) {
  const { message } = await req.json();

  if (!message?.trim()) {
    return NextResponse.json({ reply: "Send me a message." }, { status: 400 });
  }

  // Try Anthropic first, then OpenAI, then fallback
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!anthropicKey && !openaiKey) {
    return NextResponse.json({
      reply:
        "AI is not configured. Add ANTHROPIC_API_KEY or OPENAI_API_KEY to your environment variables to enable the chatbot.\n\nFor now, use the step-by-step flow at /demo/today to find meals.",
    });
  }

  try {
    if (anthropicKey) {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 600,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: message }],
        }),
      });
      const data = await res.json();
      const reply = data?.content?.[0]?.text ?? "Could not parse AI response.";
      return NextResponse.json({ reply });
    }

    if (openaiKey) {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          max_tokens: 600,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: message },
          ],
        }),
      });
      const data = await res.json();
      const reply = data?.choices?.[0]?.message?.content ?? "Could not parse AI response.";
      return NextResponse.json({ reply });
    }
  } catch (e) {
    console.error("AI route error:", e);
    return NextResponse.json({ reply: "AI request failed. Check your API key and try again." });
  }

  return NextResponse.json({ reply: "No AI provider configured." });
}
