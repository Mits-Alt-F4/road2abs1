"use client";

import { useState, useEffect, useMemo } from "react";

interface DayEntry {
  date: string; // YYYY-MM-DD
  label: string;
  amount: number;
}

const STORAGE_KEY = "road2abs_budget_v1";
const WEEKLY_DEFAULT = 70;

function getWeekDates(): string[] {
  const today = new Date();
  const day = today.getDay(); // 0=Sun
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function BudgetPage() {
  const [entries, setEntries] = useState<DayEntry[]>([]);
  const [weeklyBudget, setWeeklyBudget] = useState(WEEKLY_DEFAULT);
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState(String(WEEKLY_DEFAULT));
  const [addingDate, setAddingDate] = useState<string | null>(null);
  const [addLabel, setAddLabel] = useState("");
  const [addAmount, setAddAmount] = useState("");

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        setEntries(data.entries ?? []);
        setWeeklyBudget(data.weeklyBudget ?? WEEKLY_DEFAULT);
        setBudgetInput(String(data.weeklyBudget ?? WEEKLY_DEFAULT));
      }
    } catch {}
  }, []);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ entries, weeklyBudget }));
    } catch {}
  }, [entries, weeklyBudget]);

  const weekDates = useMemo(() => getWeekDates(), []);
  const today = todayStr();

  const weekEntries = useMemo(
    () => entries.filter((e) => weekDates.includes(e.date)),
    [entries, weekDates]
  );

  const totalSpent = useMemo(
    () => weekEntries.reduce((s, e) => s + e.amount, 0),
    [weekEntries]
  );

  const pct = Math.min((totalSpent / weeklyBudget) * 100, 100);
  const remaining = weeklyBudget - totalSpent;

  const saveBudget = () => {
    const v = parseFloat(budgetInput);
    if (!isNaN(v) && v > 0) setWeeklyBudget(v);
    setEditingBudget(false);
  };

  const addEntry = (date: string) => {
    const amount = parseFloat(addAmount);
    if (!isNaN(amount) && amount > 0) {
      setEntries((prev) => [
        ...prev,
        { date, label: addLabel.trim() || "Food", amount: Math.round(amount * 100) / 100 },
      ]);
    }
    setAddingDate(null);
    setAddLabel("");
    setAddAmount("");
  };

  const removeEntry = (idx: number) => {
    setEntries((prev) => {
      const all = [...prev];
      // find the global index matching this week entry
      const target = weekEntries[idx];
      const globalIdx = prev.findIndex((e) => e === target);
      if (globalIdx >= 0) all.splice(globalIdx, 1);
      return all;
    });
  };

  return (
    <div className="flex flex-col min-h-screen pb-28">
      {/* Header */}
      <div className="px-5 pt-10 pb-4 safe-top">
        <h1 className="text-xl font-bold text-[var(--text-primary)] mb-1">Budget Tracker</h1>
        <p className="text-xs text-[var(--text-muted)]">Track your weekly food spend.</p>
      </div>

      {/* Weekly overview */}
      <div className="mx-4 mb-4 p-4 rounded-2xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wide font-semibold">This week</p>
            <p className="text-2xl font-bold text-[var(--text-primary)] mt-0.5">
              CHF {totalSpent.toFixed(2)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wide font-semibold">Budget</p>
            {editingBudget ? (
              <div className="flex items-center gap-1 mt-0.5">
                <input
                  autoFocus
                  type="number"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  onBlur={saveBudget}
                  onKeyDown={(e) => e.key === "Enter" && saveBudget()}
                  className="w-16 text-right text-sm font-bold text-[var(--text-primary)] bg-transparent outline-none"
                  style={{ background: "var(--bg-elevated)", borderRadius: 6, padding: "2px 4px" }}
                />
                <span className="text-xs text-[var(--text-muted)]">CHF</span>
              </div>
            ) : (
              <button onClick={() => setEditingBudget(true)} className="text-sm font-semibold text-[var(--text-secondary)] mt-0.5">
                CHF {weeklyBudget.toFixed(0)} ✏️
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: "var(--bg-elevated)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: pct >= 90 ? "#e5261f" : pct >= 70 ? "#f0b43c" : "var(--accent-lime)",
            }}
          />
        </div>
        <div className="flex justify-between text-[11px]">
          <span style={{ color: remaining >= 0 ? "var(--accent-green)" : "#e5261f" }}>
            {remaining >= 0 ? `CHF ${remaining.toFixed(2)} left` : `CHF ${Math.abs(remaining).toFixed(2)} over`}
          </span>
          <span className="text-[var(--text-muted)]">{pct.toFixed(0)}% used</span>
        </div>
      </div>

      {/* Daily breakdown */}
      <div className="flex flex-col gap-2 px-4">
        {weekDates.map((date, di) => {
          const dayEntries = weekEntries.filter((e) => e.date === date);
          const dayTotal = dayEntries.reduce((s, e) => s + e.amount, 0);
          const isToday = date === today;
          const isPast = date < today;
          const isFuture = date > today;

          return (
            <div
              key={date}
              className="rounded-xl overflow-hidden"
              style={{
                background: "var(--bg-card)",
                border: `1px solid ${isToday ? "var(--accent-lime)" : "var(--border)"}`,
                opacity: isFuture ? 0.5 : 1,
              }}
            >
              <div className="flex items-center justify-between px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold" style={{ color: isToday ? "var(--accent-lime)" : "var(--text-secondary)" }}>
                    {DAY_LABELS[di]}
                  </span>
                  {isToday && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(180,224,64,0.15)", color: "var(--accent-lime)" }}>
                      today
                    </span>
                  )}
                  <span className="text-[11px] text-[var(--text-muted)]">{date.slice(5)}</span>
                </div>
                <div className="flex items-center gap-2">
                  {dayTotal > 0 && (
                    <span className="text-sm font-bold text-[var(--text-primary)]">CHF {dayTotal.toFixed(2)}</span>
                  )}
                  {!isFuture && (
                    <button
                      onClick={() => setAddingDate(addingDate === date ? null : date)}
                      className="text-xs px-2 py-1 rounded-lg transition-all"
                      style={{
                        background: addingDate === date ? "var(--accent-lime)" : "var(--bg-elevated)",
                        color: addingDate === date ? "#1a1a1a" : "var(--text-muted)",
                      }}
                    >
                      +
                    </button>
                  )}
                </div>
              </div>

              {/* Add entry form */}
              {addingDate === date && (
                <div className="px-3 pb-3 flex gap-2" style={{ borderTop: "1px solid var(--border)" }}>
                  <input
                    autoFocus
                    type="text"
                    placeholder="Label (optional)"
                    value={addLabel}
                    onChange={(e) => setAddLabel(e.target.value)}
                    className="flex-1 text-sm bg-transparent text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] pt-2"
                  />
                  <div className="flex items-center gap-1 pt-2">
                    <span className="text-xs text-[var(--text-muted)]">CHF</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={addAmount}
                      onChange={(e) => setAddAmount(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addEntry(date)}
                      className="w-16 text-sm font-bold text-[var(--text-primary)] bg-transparent outline-none text-right"
                    />
                    <button
                      onClick={() => addEntry(date)}
                      className="ml-1 px-2 py-1 rounded-lg text-xs font-semibold"
                      style={{ background: "var(--accent-lime)", color: "#1a1a1a" }}
                    >
                      ✓
                    </button>
                  </div>
                </div>
              )}

              {/* Entries */}
              {dayEntries.length > 0 && (
                <div style={{ borderTop: "1px solid var(--border)" }}>
                  {dayEntries.map((entry, ei) => {
                    const globalIdx = weekEntries.indexOf(entry);
                    return (
                      <div
                        key={ei}
                        className="flex items-center justify-between px-3 py-1.5"
                        style={{ borderBottom: ei < dayEntries.length - 1 ? "1px solid var(--border)" : undefined }}
                      >
                        <span className="text-xs text-[var(--text-secondary)]">{entry.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[var(--text-primary)]">CHF {entry.amount.toFixed(2)}</span>
                          <button
                            onClick={() => removeEntry(globalIdx)}
                            className="text-[var(--text-muted)] text-xs leading-none"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {isPast && dayEntries.length === 0 && (
                <div className="px-3 pb-2 text-[11px] text-[var(--text-muted)] italic">nothing logged</div>
              )}
            </div>
          );
        })}
      </div>

      {/* History note */}
      <div className="px-4 mt-4">
        <p className="text-[10px] text-[var(--text-muted)] text-center">
          Entries are saved locally on this device. Clears after 90 days automatically.
        </p>
      </div>
    </div>
  );
}
