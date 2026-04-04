"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { StudyPlan } from "@/lib/demo/types";

const dailyOptions = [5, 10, 15] as const;

export function OnboardingForm() {
  const [dailyGoal, setDailyGoal] = useState(10);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [planByGoal, setPlanByGoal] = useState<Record<number, StudyPlan>>({});

  useEffect(() => {
    const loadData = async () => {
      try {
        const [settingsResponse, ...planResponses] = await Promise.all([
          fetch("/api/settings"),
          ...dailyOptions.map((option) => fetch(`/api/plan?dailyGoal=${option}`))
        ]);

        if (!settingsResponse.ok || planResponses.some((response) => !response.ok)) {
          throw new Error("Could not load your study settings.");
        }

        const settings: { dailyGoal: number } = await settingsResponse.json();
        const plans = await Promise.all(planResponses.map((response) => response.json() as Promise<StudyPlan>));

        setDailyGoal(settings.dailyGoal);
        setPlanByGoal(
          dailyOptions.reduce<Record<number, StudyPlan>>((accumulator, option, index) => {
            accumulator[option] = plans[index];
            return accumulator;
          }, {})
        );
      } catch (loadError) {
        setStatus(loadError instanceof Error ? loadError.message : "Could not load your study settings.");
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  const saveDailyGoal = async (nextDailyGoal: number) => {
    setDailyGoal(nextDailyGoal);
    setSaving(true);
    setStatus(null);

    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ dailyGoal: nextDailyGoal })
      });

      if (!response.ok) {
        throw new Error("Could not save your daily goal.");
      }

      setStatus("Saved. Your study plan and next session will use this daily goal.");
    } catch (saveError) {
      setStatus(saveError instanceof Error ? saveError.message : "Could not save your daily goal.");
    } finally {
      setSaving(false);
    }
  };

  const selectedPlan = planByGoal[dailyGoal];

  return (
    <div className="card p-6 sm:p-8">
      <div className="mb-8">
        <div className="eyebrow">Onboarding</div>
        <h1 className="mt-4 text-4xl text-ink sm:text-5xl">Shape a daily plan that stays demanding without becoming chaotic.</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-ink/70">
          Learnly now forecasts what each daily goal means in practice: how many cards you&apos;ll see today, how long
          it should take, and how much it likely creates for tomorrow.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[24px] bg-mist p-5">
          <h2 className="text-xl font-semibold">Choose your daily pace</h2>
          <p className="mt-2 text-sm text-ink/70">
            The best setting is the one you can actually sustain six days in a row. Review debt compounds faster than
            motivation does.
          </p>
          <div className="mt-5 grid gap-3">
            {dailyOptions.map((option) => {
              const active = option === dailyGoal;
              const plan = planByGoal[option];

              return (
                <button
                  key={option}
                  type="button"
                  disabled={loading || saving}
                  onClick={() => void saveDailyGoal(option)}
                  className={`rounded-[24px] border px-5 py-4 text-left transition-[transform,opacity,box-shadow] ${
                    active
                      ? "border-ink bg-ink text-paper"
                      : "border-black/5 bg-white text-ink hover:border-clay/40 hover:bg-white/90"
                  } ${loading || saving ? "cursor-wait opacity-80" : ""}`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-lg font-semibold">{option} new words/day</div>
                      <div className={`mt-1 text-sm ${active ? "text-paper/70" : "text-ink/60"}`}>
                        {plan
                          ? `${plan.totalCards} cards today, about ${plan.estimatedMinutes} minutes`
                          : "Loading forecast..."}
                      </div>
                    </div>
                    <div className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.18em] ${
                      active ? "bg-white/10 text-paper" : "bg-mist text-ink/60"
                    }`}>
                      {plan ? `${plan.tomorrowDueEstimate} tomorrow` : "Preview"}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-4 text-sm text-ink/60">
            {loading ? "Loading your saved study settings..." : status ?? "Saved settings drive the review queue and tomorrow forecast."}
          </div>
        </section>

        <section className="rounded-[24px] bg-white p-5">
          <h2 className="text-xl font-semibold">Selected plan</h2>
          {selectedPlan ? (
            <div className="mt-4 grid gap-3">
              {[
                { label: "Due now", value: selectedPlan.dueNow },
                { label: "New cards", value: selectedPlan.newCards },
                { label: "Study time", value: `${selectedPlan.estimatedMinutes} min` },
                { label: "Tomorrow due", value: selectedPlan.tomorrowDueEstimate },
                { label: "Next review window", value: selectedPlan.nextReviewWindowLabel }
              ].map((stat) => (
                <div key={stat.label} className="rounded-[20px] bg-paper px-4 py-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-ink/40">{stat.label}</div>
                  <div className="mt-2 text-2xl text-ink">{stat.value}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 text-sm text-ink/60">Loading the current plan forecast...</div>
          )}
        </section>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link href="/dashboard" className="button-primary">
          Continue to dashboard
        </Link>
        <Link href="/review" className="button-secondary">
          Skip to study session
        </Link>
      </div>
    </div>
  );
}
