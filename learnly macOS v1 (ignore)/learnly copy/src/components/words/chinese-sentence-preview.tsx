"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { SentenceTokenPreview } from "@/lib/demo/types";

type LearnPreviewResponse = {
  itemId: string;
  introduced: boolean;
  sessionInjected: boolean;
  status: string;
};

type PreviewPosition = {
  left: number;
  top?: number;
  bottom?: number;
  width: number;
};

const DESKTOP_PREVIEW_WIDTH = 340;

function getLevelLabel(languageCode: string) {
  switch (languageCode) {
    case "zh-hsk1":
      return "HSK 1";
    case "zh-hsk2":
      return "HSK 2";
    case "zh-hsk3":
      return "HSK 3";
    default:
      return languageCode;
  }
}

function buildDesktopPreviewPosition(element: HTMLElement): PreviewPosition {
  const rect = element.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const width = Math.min(DESKTOP_PREVIEW_WIDTH, viewportWidth - 24);
  const left = Math.min(
    Math.max(12, rect.left + rect.width / 2 - width / 2),
    viewportWidth - width - 12
  );
  const shouldRenderAbove = rect.bottom > viewportHeight * 0.58;

  if (shouldRenderAbove) {
    return {
      left,
      bottom: viewportHeight - rect.top + 10,
      width,
    };
  }

  return {
    left,
    top: rect.bottom + 10,
    width,
  };
}

function useIsCompactPreviewMode() {
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const widthQuery = window.matchMedia("(max-width: 767px)");
    const pointerQuery = window.matchMedia("(pointer: coarse)");
    const sync = () => {
      setIsCompact(widthQuery.matches || pointerQuery.matches);
    };

    sync();
    widthQuery.addEventListener("change", sync);
    pointerQuery.addEventListener("change", sync);

    return () => {
      widthQuery.removeEventListener("change", sync);
      pointerQuery.removeEventListener("change", sync);
    };
  }, []);

  return isCompact;
}

function PreviewCard({
  token,
  pending,
  error,
  onLearn,
}: {
  token: SentenceTokenPreview;
  pending: boolean;
  error: string | null;
  onLearn: () => void;
}) {
  const senses = token.senses ?? [];

  return (
    <div className="rounded-[24px] border border-line/80 bg-[rgba(255,249,241,0.98)] p-4 text-left text-ink shadow-[0_24px_60px_rgba(34,24,18,0.14)] backdrop-blur-xl dark:border-white/10 dark:bg-[rgba(16,12,9,0.96)] dark:text-white">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[26px] leading-none tracking-[-0.05em] text-ink dark:text-white">
            {token.text}
          </div>
          {token.pronunciation ? (
            <div className="mt-2 text-sm tracking-[0.02em] text-ink/58 dark:text-white/58">
              {token.pronunciation}
            </div>
          ) : null}
        </div>
        {token.learnItemId && !token.alreadyLearning ? (
          <button
            type="button"
            onClick={onLearn}
            disabled={pending}
            className="inline-flex min-h-[40px] items-center justify-center rounded-full border border-[#ffcc7a] bg-[#ff991c] px-4 py-2 text-sm font-semibold text-white transition-[transform,opacity,box-shadow] hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-wait disabled:opacity-70 dark:text-black"
          >
            {pending ? "Learning..." : "Learn"}
          </button>
        ) : (
          <div className="inline-flex min-h-[40px] items-center justify-center rounded-full border border-line/70 bg-paper/70 px-4 py-2 text-sm font-medium text-ink/56 dark:border-white/10 dark:bg-white/6 dark:text-white/58">
            Learning
          </div>
        )}
      </div>

      <div className="mt-4 space-y-3">
        {senses.map((sense) => (
          <div
            key={sense.itemId}
            className="rounded-[18px] border border-line/55 bg-paper/72 px-3.5 py-3 dark:border-white/8 dark:bg-white/5"
          >
            <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-ink/42 dark:text-white/42">
              <span>{getLevelLabel(sense.languageCode)}</span>
              {sense.pronunciation ? <span className="normal-case tracking-[0.02em]">{sense.pronunciation}</span> : null}
            </div>
            <div className="mt-2 text-[15px] leading-6 text-ink/82 dark:text-white/82">
              {sense.glosses.join(" • ")}
            </div>
            {sense.notes ? (
              <div className="mt-2 text-[13px] leading-5 text-ink/56 dark:text-white/55">
                {sense.notes}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {error ? (
        <div className="mt-3 text-sm text-[#b94f3c] dark:text-[#ff9c84]">
          {error}
        </div>
      ) : null}
    </div>
  );
}

export function ChineseSentencePreview({
  tokens,
  className = "",
  sessionId,
  onLearned,
}: {
  tokens: SentenceTokenPreview[];
  className?: string;
  sessionId?: string | null;
  onLearned?: (result: LearnPreviewResponse) => void;
}) {
  const [localTokens, setLocalTokens] = useState(tokens);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [pinnedIndex, setPinnedIndex] = useState<number | null>(null);
  const [mobileIndex, setMobileIndex] = useState<number | null>(null);
  const [pendingTokenIndex, setPendingTokenIndex] = useState<number | null>(null);
  const [learnError, setLearnError] = useState<string | null>(null);
  const [desktopPosition, setDesktopPosition] = useState<PreviewPosition | null>(null);
  const triggerRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const desktopCardRef = useRef<HTMLDivElement | null>(null);
  const mobileCardRef = useRef<HTMLDivElement | null>(null);
  const isCompactMode = useIsCompactPreviewMode();

  useEffect(() => {
    setLocalTokens(tokens);
    setHoveredIndex(null);
    setPinnedIndex(null);
    setMobileIndex(null);
    setPendingTokenIndex(null);
    setLearnError(null);
  }, [tokens]);

  const activeDesktopIndex = !isCompactMode ? (pinnedIndex ?? hoveredIndex) : null;

  useEffect(() => {
    if (isCompactMode || activeDesktopIndex === null) {
      setDesktopPosition(null);
      return;
    }

    const trigger = triggerRefs.current[activeDesktopIndex];
    if (!trigger) {
      return;
    }

    const syncPosition = () => {
      setDesktopPosition(buildDesktopPreviewPosition(trigger));
    };

    syncPosition();
    window.addEventListener("resize", syncPosition);
    window.addEventListener("scroll", syncPosition, true);

    return () => {
      window.removeEventListener("resize", syncPosition);
      window.removeEventListener("scroll", syncPosition, true);
    };
  }, [activeDesktopIndex, isCompactMode]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      setHoveredIndex(null);
      setPinnedIndex(null);
      setMobileIndex(null);
      setLearnError(null);
    };

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) {
        return;
      }

      const activeDesktopCard = desktopCardRef.current;
      const activeMobileCard = mobileCardRef.current;
      const clickedDesktopTrigger = Object.values(triggerRefs.current).some((element) => element?.contains(target));

      if (
        activeDesktopCard?.contains(target) ||
        activeMobileCard?.contains(target) ||
        clickedDesktopTrigger
      ) {
        return;
      }

      setHoveredIndex(null);
      setPinnedIndex(null);
      setMobileIndex(null);
      setLearnError(null);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, []);

  const activeDesktopToken = activeDesktopIndex !== null ? localTokens[activeDesktopIndex] : null;
  const activeMobileToken = mobileIndex !== null ? localTokens[mobileIndex] : null;

  const desktopPortal = useMemo(() => {
    if (
      typeof document === "undefined" ||
      isCompactMode ||
      activeDesktopIndex === null ||
      !activeDesktopToken ||
      !activeDesktopToken.matched ||
      !desktopPosition
    ) {
      return null;
    }

    const desktopTokenIndex = activeDesktopIndex;
    const token = activeDesktopToken;
    if (!token) {
      return null;
    }

    return createPortal(
      <div
        ref={desktopCardRef}
        className="fixed z-[90]"
        style={{
          left: desktopPosition.left,
          top: desktopPosition.top,
          bottom: desktopPosition.bottom,
          width: desktopPosition.width,
        }}
      >
        <PreviewCard
          token={token}
          pending={pendingTokenIndex === desktopTokenIndex}
          error={learnError}
          onLearn={() => void handleLearn(desktopTokenIndex)}
        />
      </div>,
      document.body
    );
  }, [
    activeDesktopIndex,
    activeDesktopToken,
    desktopPosition,
    isCompactMode,
    learnError,
    pendingTokenIndex,
  ]);

  function markTokenAsLearned(learnedItemId: string) {
    setLocalTokens((currentTokens) =>
      currentTokens.map((token) =>
        token.senses?.some((sense) => sense.itemId === learnedItemId)
          ? {
              ...token,
              learnItemId: undefined,
              alreadyLearning: true,
            }
          : token
      )
    );
  }

  async function handleLearn(tokenIndex: number) {
    const token = localTokens[tokenIndex];
    if (!token?.learnItemId) {
      return;
    }

    setPendingTokenIndex(tokenIndex);
    setLearnError(null);

    try {
      const response = await fetch(`/api/item/${encodeURIComponent(token.learnItemId)}/learn`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sessionId ? { sessionId } : {}),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Could not learn this word.");
      }

      const result = (await response.json()) as LearnPreviewResponse;
      markTokenAsLearned(result.itemId);
      onLearned?.(result);
    } catch (error) {
      setLearnError(error instanceof Error ? error.message : "Could not learn this word.");
    } finally {
      setPendingTokenIndex(null);
    }
  }

  return (
    <>
      <span className={className}>
        {localTokens.map((token, index) => {
          if (!token.matched || !(token.senses && token.senses.length > 0)) {
            return (
              <span key={`plain-${index}`} style={{ whiteSpace: "pre-wrap" }}>
                {token.text}
              </span>
            );
          }

          const isActive = isCompactMode ? mobileIndex === index : activeDesktopIndex === index;

          return (
            <button
              key={`${token.text}-${index}`}
              type="button"
              ref={(node) => {
                triggerRefs.current[index] = node;
              }}
              onMouseEnter={() => {
                if (!isCompactMode && pinnedIndex === null) {
                  setHoveredIndex(index);
                }
              }}
              onMouseLeave={() => {
                if (!isCompactMode && pinnedIndex === null) {
                  setHoveredIndex((current) => (current === index ? null : current));
                }
              }}
              onFocus={() => {
                if (!isCompactMode) {
                  setHoveredIndex(index);
                }
              }}
              onBlur={(event) => {
                if (isCompactMode || pinnedIndex !== null) {
                  return;
                }

                const relatedTarget = event.relatedTarget as Node | null;
                if (relatedTarget && triggerRefs.current[index]?.contains(relatedTarget)) {
                  return;
                }

                setHoveredIndex((current) => (current === index ? null : current));
              }}
              onClick={() => {
                setLearnError(null);
                if (isCompactMode) {
                  setMobileIndex(index);
                  return;
                }

                setPinnedIndex((current) => (current === index ? null : index));
                setHoveredIndex(index);
              }}
              aria-haspopup="dialog"
              aria-expanded={isActive}
              className={`rounded-[10px] px-0.5 text-left align-baseline transition-[background-color,color,box-shadow] duration-150 ${
                isActive
                  ? "bg-[rgb(var(--color-gold)/0.14)] text-clay dark:bg-[rgb(var(--color-accent)/0.18)] dark:text-white"
                  : "hover:bg-[rgb(var(--color-gold)/0.1)] hover:text-clay dark:hover:bg-white/8 dark:hover:text-white"
              }`}
              style={{
                font: "inherit",
                lineHeight: "inherit",
              }}
            >
              {token.text}
            </button>
          );
        })}
      </span>

      {desktopPortal}

      {typeof document !== "undefined" && isCompactMode && activeMobileToken && activeMobileToken.matched && mobileIndex !== null
        ? createPortal(
            <div className="fixed inset-0 z-[95] flex items-end bg-[rgba(16,12,9,0.3)] backdrop-blur-[2px]">
              <button
                type="button"
                aria-label="Close preview"
                className="absolute inset-0"
                onClick={() => {
                  setMobileIndex(null);
                  setLearnError(null);
                }}
              />
              <div
                ref={mobileCardRef}
                className="relative z-[1] w-full rounded-t-[28px] border border-line/70 bg-paper px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 shadow-[0_-24px_48px_rgba(24,18,14,0.18)] dark:border-white/10 dark:bg-[#0f0b08]"
              >
                <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-line/80 dark:bg-white/14" />
                <PreviewCard
                  token={activeMobileToken}
                  pending={pendingTokenIndex === mobileIndex}
                  error={learnError}
                  onLearn={() => void handleLearn(mobileIndex)}
                />
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
