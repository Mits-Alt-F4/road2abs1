"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Store, Vibe } from "@/lib/types";

type Step = "macros" | "store" | "vibe" | "loading";

interface MacroState {
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  budget: string;
}

const VIBES: { id: Vibe; label: string; emoji: string; hint: string }[] = [
  { id: "quick", label: "Quick meal", emoji: "⚡", hint: "under 10 min" },
  { id: "no_cook", label: "No cooking", emoji: "🥗", hint: "open & eat" },
  { id: "max_protein", label: "Max protein", emoji: "💪", hint: "g per kcal" },
  { id: "sweet_treat", label: "Sweet treat", emoji: "🍫", hint: "fits macros" },
  { id: "emergency_protein", label: "Emergency P", emoji: "🚨", hint: "<300 kcal" },
  { id: "meal_prep", label: "Meal prep", emoji: "📦", hint: "batch cook" },
  { id: "cheap", label: "Cheap option", emoji: "💰", hint: "under CHF 5" },
  { id: "post_gym", label: "Post-gym", emoji: "🏋️", hint: "carbs + P" },
  { id: "lazy_dinner", label: "Lazy dinner", emoji: "😴", hint: "minimal effort" },
  { id: "full_dinner", label: "Full dinner", emoji: "🍽️", hint: "proper meal" },
];

const LOADING_STEPS = [
  "Checking your macros",
  "Matching Coop & Migros products",
  "Prioritising protein",
  "Keeping it under budget",
  "Building your options",
];

export default function TodayPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("macros");
  const [stepKey, setStepKey] = useState(0);
  const [macros, setMacros] = useState<MacroState>({
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    budget: "10",
  });
  const [store, setStore] = useState<Store>("either");
  const [vibe, setVibe] = useState<Vibe | null>(null);
  const [showOptional, setShowOptional] = useState(false);
  const [loadingStep, setLoadingStep] = useState(-1);

  const goTo = useCallback((s: Step) => {
    setStep(s);
    setStepKey((k) => k + 1);
  }, []);

  const fillDefaults = () => {
    setMacros({ calories: "2070", protein: "160", carbs: "", fat: "", budget: "10" });
  };

  // Loading animation + navigate to results
  useEffect(() => {
    if (step !== "loading") return;
    setLoadingStep(0);
    let current = 0;
    const interval = setInterval(() => {
      current++;
      setLoadingStep(current);
      if (current >= LOADING_STEPS.length) {
        clearInterval(interval);
        const params = new URLSearchParams({
          cal: macros.calories || "2070",
          pro: macros.protein || "160",
          store,
          vibe: vibe || "quick",
          budget: macros.budget || "10",
        });
        if (macros.carbs) params.set("carbs", macros.carbs);
        if (macros.fat) params.set("fat", macros.fat);
        setTimeout(() => router.push(`/demo/results?${params}`), 350);
      }
    }, 320);
    return () => clearInterval(interval);
  }, [step, macros, store, vibe, router]);

  const canGoToStore = (macros.calories !== "" || macros.protein !== "");

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="px-5 pt-12 pb-6 flex items-center justify-between safe-top">
        <Image src="/road2abs-icon.png" alt="Road2Abs" width={28} height={28} className="rounded-lg" />
        <StepDots current={step} />
      </header>

      {/* Step content */}
      <main key={stepKey} className="flex-1 px-5 step-enter">
        {step === "macros" && (
          <MacrosStep
            macros={macros}
            onChange={(f, v) => setMacros((m) => ({ ...m, [f]: v }))}
            showOptional={showOptional}
            onToggleOptional={() => setShowOptional((s) => !s)}
            onFillDefaults={fillDefaults}
            onContinue={() => goTo("store")}
            canContinue={canGoToStore}
          />
        )}
        {step === "store" && (
          <StoreStep
            selected={store}
            onSelect={(s) => { setStore(s); setTimeout(() => goTo("vibe"), 180); }}
          />
        )}
        {step === "vibe" && (
          <VibeStep
            selected={vibe}
            onSelect={setVibe}
            onContinue={() => goTo("loading")}
            canContinue={vibe !== null}
          />
        )}
        {step === "loading" && (
          <LoadingStep currentStep={loadingStep} />
        )}
      </main>
    </div>
  );
}

// ─── Sub-steps ──────────────────────────────────────────────────────────────

function StepDots({ current }: { current: Step }) {
  const steps: Step[] = ["macros", "store", "vibe", "loading"];
  const idx = steps.indexOf(current);
  return (
    <div className="flex gap-1.5">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i < idx
              ? "w-3 bg-[var(--accent-lime)]"
              : i === idx
              ? "w-5 bg-[var(--accent-lime)]"
              : "w-1.5 bg-[var(--border)]"
          }`}
        />
      ))}
    </div>
  );
}

// ─── Macros step ────────────────────────────────────────────────────────────
interface MacrosStepProps {
  macros: MacroState;
  onChange: (field: keyof MacroState, value: string) => void;
  showOptional: boolean;
  onToggleOptional: () => void;
  onFillDefaults: () => void;
  onContinue: () => void;
  canContinue: boolean;
}

function MacrosStep({
  macros, onChange, showOptional, onToggleOptional, onFillDefaults, onContinue, canContinue,
}: MacrosStepProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] leading-tight">
          What&apos;s left today?
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Enter your remaining macros and we&apos;ll find the right meals.
        </p>
      </div>

      {/* Primary inputs */}
      <div className="flex flex-col gap-3">
        <MacroField
          label="Calories left"
          placeholder="e.g. 700"
          value={macros.calories}
          unit="kcal"
          onChange={(v) => onChange("calories", v)}
          autoFocus
        />
        <MacroField
          label="Protein left"
          placeholder="e.g. 60"
          value={macros.protein}
          unit="g"
          onChange={(v) => onChange("protein", v)}
        />
        <MacroField
          label="Budget"
          placeholder="10"
          value={macros.budget}
          unit="CHF"
          onChange={(v) => onChange("budget", v)}
        />
      </div>

      {/* Optional toggle */}
      <button
        type="button"
        onClick={onToggleOptional}
        className="text-sm text-[var(--text-muted)] text-left flex items-center gap-1.5 -mt-2"
      >
        <span
          className={`text-[10px] transition-transform ${showOptional ? "rotate-90" : ""}`}
        >
          ▶
        </span>
        {showOptional ? "Hide" : "Add"} carbs & fat
      </button>

      {showOptional && (
        <div className="flex flex-col gap-3 -mt-4">
          <MacroField
            label="Carbs left"
            placeholder="optional"
            value={macros.carbs}
            unit="g"
            onChange={(v) => onChange("carbs", v)}
          />
          <MacroField
            label="Fat left"
            placeholder="optional"
            value={macros.fat}
            unit="g"
            onChange={(v) => onChange("fat", v)}
          />
        </div>
      )}

      {/* Quick fill */}
      <button
        type="button"
        onClick={onFillDefaults}
        className="text-sm text-[var(--accent-green)] text-left -mt-2"
      >
        Fill my defaults (2070 kcal / 160g P / CHF 10)
      </button>

      {/* Continue */}
      <button
        type="button"
        onClick={onContinue}
        disabled={!canContinue}
        className={`w-full py-4 rounded-2xl font-semibold text-base transition-all ${
          canContinue
            ? "bg-[var(--accent-lime)] text-black active:scale-95"
            : "bg-[var(--bg-elevated)] text-[var(--text-muted)]"
        }`}
      >
        Find meals →
      </button>
    </div>
  );
}

interface MacroFieldProps {
  label: string;
  placeholder: string;
  value: string;
  unit: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
}

function MacroField({ label, placeholder, value, unit, onChange, autoFocus }: MacroFieldProps) {
  return (
    <div
      className="flex items-center gap-3 rounded-2xl px-4 py-3"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      <div className="flex-1">
        <div className="text-[11px] uppercase tracking-wide font-semibold text-[var(--text-muted)] mb-0.5">
          {label}
        </div>
        <input
          type="number"
          inputMode="numeric"
          placeholder={placeholder}
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
          className="w-full text-xl font-bold text-[var(--text-primary)] bg-transparent outline-none placeholder:text-[var(--text-muted)] placeholder:font-normal"
        />
      </div>
      <span className="text-sm text-[var(--text-secondary)] font-medium">{unit}</span>
    </div>
  );
}

// ─── Store step ──────────────────────────────────────────────────────────────
function StoreStep({ selected, onSelect }: { selected: Store; onSelect: (s: Store) => void }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Where are you shopping?</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Pick a store or search both.</p>
      </div>
      <div className="flex flex-col gap-3">
        {(
          [
            { id: "coop" as Store, label: "Coop", color: "#e5261f", icon: "🔴" },
            { id: "migros" as Store, label: "Migros", color: "#ff6600", icon: "🟠" },
            { id: "either" as Store, label: "Either", color: "#6aad6a", icon: "✅" },
          ] as const
        ).map(({ id, label, color, icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left transition-all active:scale-[0.98] ${
              selected === id
                ? "ring-2"
                : ""
            }`}
            style={{
              background: "var(--bg-card)",
              border: `1px solid ${selected === id ? color : "var(--border)"}`,
              boxShadow: selected === id ? `0 0 0 2px ${color}40` : undefined,
            }}
          >
            <span className="text-2xl">{icon}</span>
            <span
              className="text-lg font-semibold"
              style={{ color: selected === id ? color : "var(--text-primary)" }}
            >
              {label}
            </span>
            {selected === id && (
              <span className="ml-auto text-[var(--accent-lime)] font-bold">✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Vibe step ───────────────────────────────────────────────────────────────
function VibeStep({
  selected,
  onSelect,
  onContinue,
  canContinue,
}: {
  selected: Vibe | null;
  onSelect: (v: Vibe) => void;
  onContinue: () => void;
  canContinue: boolean;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">What are you feeling?</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Pick one vibe.</p>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {VIBES.map(({ id, label, emoji, hint }) => {
          const active = selected === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              className={`flex flex-col items-start gap-1 px-4 py-3.5 rounded-2xl text-left transition-all active:scale-[0.97] ${
                active ? "ring-2 ring-[var(--accent-lime)]" : ""
              }`}
              style={{
                background: active ? "rgba(180,224,64,0.12)" : "var(--bg-card)",
                border: `1px solid ${active ? "var(--accent-lime)" : "var(--border)"}`,
              }}
            >
              <span className="text-xl">{emoji}</span>
              <span
                className={`text-sm font-semibold leading-tight ${
                  active ? "text-[var(--accent-lime)]" : "text-[var(--text-primary)]"
                }`}
              >
                {label}
              </span>
              <span className="text-[11px] text-[var(--text-muted)]">{hint}</span>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={onContinue}
        disabled={!canContinue}
        className={`w-full py-4 rounded-2xl font-semibold text-base transition-all mt-1 ${
          canContinue
            ? "bg-[var(--accent-lime)] text-black active:scale-95"
            : "bg-[var(--bg-elevated)] text-[var(--text-muted)]"
        }`}
      >
        Build my options →
      </button>
    </div>
  );
}

// ─── Loading step ─────────────────────────────────────────────────────────────
function LoadingStep({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-10">
      <div className="flex flex-col items-center gap-4">
        <Image
          src="/road2abs-icon.png"
          alt="Road2Abs"
          width={56}
          height={56}
          className="rounded-2xl"
          style={{ opacity: 0.9 }}
        />
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="loading-dot w-1.5 h-1.5 rounded-full bg-[var(--accent-lime)]"
            />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2.5 w-full max-w-xs">
        {LOADING_STEPS.map((label, i) => (
          <div
            key={label}
            className={`flex items-center gap-3 transition-all duration-300 ${
              i < currentStep
                ? "text-[var(--text-muted)]"
                : i === currentStep
                ? "text-[var(--text-primary)]"
                : "text-[var(--text-muted)] opacity-40"
            }`}
          >
            <span className="text-sm w-4 text-center">
              {i < currentStep ? "✓" : i === currentStep ? "→" : "○"}
            </span>
            <span className={`text-sm ${i === currentStep ? "font-semibold" : ""}`}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
