import {
  differenceInCalendarDays,
  differenceInHours,
  differenceInMinutes
} from "date-fns";
import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  State
} from "ts-fsrs";
import { RatingPreview, ReviewRating, ReviewStatus, UserItemState } from "@/lib/demo/types";

export type ScheduledReview = UserItemState;

const ratingLabels: Record<ReviewRating, string> = {
  1: "Forgot",
  2: "Hard",
  3: "Good",
  4: "Easy"
};

const scheduler = fsrs(
  generatorParameters({
    enable_fuzz: false,
    enable_short_term: true,
    request_retention: 0.9,
    maximum_interval: 365,
    learning_steps: ["1m", "10m"],
    relearning_steps: ["10m"]
  })
);

const statusToState: Record<ReviewStatus, State> = {
  new: State.New,
  learning: State.Learning,
  review: State.Review,
  relearning: State.Relearning
};

const stateToStatus: Record<State, ReviewStatus> = {
  [State.New]: "new",
  [State.Learning]: "learning",
  [State.Review]: "review",
  [State.Relearning]: "relearning"
};

type FsrsCard = {
  due: Date;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  learning_steps: number;
  reps: number;
  lapses: number;
  state: State;
  last_review?: Date;
};
type FsrsReviewResult = {
  card: FsrsCard;
};
type FsrsPreview = Record<number, FsrsReviewResult>;

function formatIntervalLabel(now: Date, dueAt: Date) {
  const minutes = differenceInMinutes(dueAt, now);
  if (minutes < 60) {
    return `${Math.max(1, minutes)} min`;
  }

  const hours = differenceInHours(dueAt, now);
  if (hours < 48) {
    return `${Math.max(1, hours)} hr`;
  }

  const days = differenceInCalendarDays(dueAt, now);
  return `${Math.max(1, days)} day${days === 1 ? "" : "s"}`;
}

function toFsrsCard(current: UserItemState, now: Date): FsrsCard {
  const seed = createEmptyCard(new Date(current.introducedAt));
  const lastReview = current.lastReviewedAt ? new Date(current.lastReviewedAt) : undefined;

  return {
    ...seed,
    due: new Date(current.dueAt),
    stability: current.stability,
    difficulty: current.difficulty,
    elapsed_days: lastReview ? Math.max(0, differenceInCalendarDays(now, lastReview)) : 0,
    scheduled_days: current.scheduledDays,
    learning_steps: current.learningSteps,
    reps: current.reps,
    lapses: current.lapses,
    state: statusToState[current.status],
    last_review: lastReview
  };
}

function toUserState(
  userId: string,
  itemId: string,
  card: FsrsCard,
  now: Date,
  current?: UserItemState,
  rating?: ReviewRating
): UserItemState {
  return {
    userId,
    itemId,
    status: stateToStatus[card.state],
    dueAt: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    scheduledDays: card.scheduled_days,
    learningSteps: card.learning_steps,
    lapses: card.lapses,
    reps: card.reps,
    lastRating: rating ?? current?.lastRating ?? null,
    introducedAt: current?.introducedAt ?? now.toISOString(),
    lastReviewedAt: card.last_review ? card.last_review.toISOString() : current?.lastReviewedAt ?? null
  };
}

export function createInitialState(userId: string, itemId: string, now: Date): UserItemState {
  const card = createEmptyCard(now) as FsrsCard;
  return toUserState(userId, itemId, card, now);
}

export function scheduleReview(
  current: UserItemState,
  rating: ReviewRating,
  now: Date
): ScheduledReview {
  const next = scheduler.next(toFsrsCard(current, now), now, rating) as FsrsReviewResult;
  return toUserState(current.userId, current.itemId, next.card, now, current, rating);
}

export function getRatingPreviews(current: UserItemState, now: Date): RatingPreview[] {
  const preview = scheduler.repeat(toFsrsCard(current, now), now) as unknown as FsrsPreview;

  return ([1, 2, 3, 4] as const).map((rating) => {
    const next = preview[rating];

    return {
      rating,
      label: ratingLabels[rating],
      status: stateToStatus[next.card.state],
      intervalLabel: formatIntervalLabel(now, next.card.due),
      dueAt: next.card.due.toISOString()
    };
  });
}

export function getRetrievability(current: UserItemState, now: Date): number | null {
  if (!current.lastReviewedAt || current.status === "new") {
    return null;
  }

  try {
    return scheduler.get_retrievability(toFsrsCard(current, now), now, false) as number;
  } catch {
    return null;
  }
}
