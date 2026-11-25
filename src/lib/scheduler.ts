import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  Rating,
  type Card,
  type Grade,
  type State,
} from 'ts-fsrs';
import {
  getDb,
  isIndexedDbAvailable,
  notifyFsrsUpdated,
  type CardStateRecord,
  type ReviewLogRecord,
} from './db';

export type ReviewGrade = 1 | 2 | 3 | 4;

export interface DueCardsSummary {
  dueToday: number;
  dueNow: number;
  newCount: number;
  reviewDueCount: number;
  totalTracked: number;
  totalReviews: number;
  nextDueAt: Date | null;
  dueCardIds: string[];
}

export interface ScheduleReviewResult {
  cardState: CardStateRecord;
  reviewLog: ReviewLogRecord;
  intervalLabel: string;
}

const schedulerParams = generatorParameters({
  request_retention: 0.9,
  enable_fuzz: true,
});

const scheduler = fsrs(schedulerParams);

const GRADE_TO_RATING: Record<ReviewGrade, Grade> = {
  1: Rating.Again,
  2: Rating.Hard,
  3: Rating.Good,
  4: Rating.Easy,
};

const MS_PER_DAY = 86_400_000;

function computeElapsedDays(lastReview: Date | undefined, now: Date): number {
  if (!lastReview) return 0;
  const diff = (now.getTime() - lastReview.getTime()) / MS_PER_DAY;
  return Math.max(0, Math.round(diff * 100) / 100);
}

function recordToFsrsCard(record: CardStateRecord): Card {
  return {
    due: new Date(record.due),
    stability: record.stability,
    difficulty: record.difficulty,
    scheduled_days: record.scheduledDays,
    learning_steps: record.learningSteps ?? 0,
    reps: record.reps,
    lapses: record.lapses,
    state: record.state as State,
    last_review: record.lastReview ? new Date(record.lastReview) : undefined,
  };
}

function fsrsCardToRecord(
  cardId: string,
  moduleId: string,
  card: Card,
  elapsedDays: number
): CardStateRecord {
  return {
    cardId,
    moduleId,
    due: new Date(card.due),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsedDays,
    scheduledDays: card.scheduled_days,
    learningSteps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    lastReview: card.last_review ? new Date(card.last_review) : undefined,
  };
}

export function formatIntervalPt(now: Date, due: Date): string {
  const diffMs = Math.max(0, due.getTime() - now.getTime());
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return '< 1 min';
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.round(diffMs / 3_600_000);
  if (hours < 24) return `${hours} h`;

  const days = Math.round(diffMs / MS_PER_DAY);
  if (days === 1) return '1 dia';
  if (days < 30) return `${days} dias`;

  const months = Math.round(days / 30);
  if (months === 1) return '1 mês';
  if (months < 12) return `${months} meses`;

  const years = Math.round((days / 365) * 10) / 10;
  return years === 1 ? '1 ano' : `${years} anos`;
}

export async function previewCardIntervals(
  cardId: string
): Promise<Record<ReviewGrade, string>> {
  const now = new Date();
  let baseCard: Card = createEmptyCard(now);

  if (isIndexedDbAvailable()) {
    const existing = await getDb().cardStates.get(cardId);
    if (existing) {
      baseCard = recordToFsrsCard(existing);
    }
  }

  const preview = scheduler.repeat(baseCard, now);

  return {
    1: formatIntervalPt(now, preview[Rating.Again].card.due),
    2: formatIntervalPt(now, preview[Rating.Hard].card.due),
    3: formatIntervalPt(now, preview[Rating.Good].card.due),
    4: formatIntervalPt(now, preview[Rating.Easy].card.due),
  };
}

export async function scheduleCardReview(
  cardId: string,
  grade: ReviewGrade,
  moduleId = 'cap-05'
): Promise<ScheduleReviewResult> {
  const db = getDb();
  const now = new Date();
  const rating = GRADE_TO_RATING[grade];

  const existing = await db.cardStates.get(cardId);
  const resolvedModuleId = existing?.moduleId ?? moduleId;
  const previousCard = existing
    ? recordToFsrsCard(existing)
    : createEmptyCard(now);
  const elapsedDays = computeElapsedDays(previousCard.last_review, now);

  const scheduled = scheduler.next(previousCard, now, rating);
  const nextCardState = fsrsCardToRecord(
    cardId,
    resolvedModuleId,
    scheduled.card,
    elapsedDays
  );

  const reviewLog: ReviewLogRecord = {
    cardId,
    grade,
    state: scheduled.log.state,
    due: new Date(scheduled.log.due),
    stability: scheduled.log.stability,
    difficulty: scheduled.log.difficulty,
    elapsedDays,
    scheduledDays: scheduled.log.scheduled_days,
    reviewTimestamp: new Date(scheduled.log.review),
  };

  await db.transaction('rw', db.cardStates, db.reviewLogs, async () => {
    await db.cardStates.put(nextCardState);
    const id = await db.reviewLogs.add(reviewLog);
    reviewLog.id = id;
  });

  notifyFsrsUpdated();

  return {
    cardState: nextCardState,
    reviewLog,
    intervalLabel: formatIntervalPt(now, nextCardState.due),
  };
}

export async function getDueCardsSummary(
  allCardIds: string[] = []
): Promise<DueCardsSummary> {
  if (!isIndexedDbAvailable()) {
    return {
      dueToday: allCardIds.length,
      dueNow: allCardIds.length,
      newCount: allCardIds.length,
      reviewDueCount: 0,
      totalTracked: 0,
      totalReviews: 0,
      nextDueAt: null,
      dueCardIds: [...allCardIds],
    };
  }

  const db = getDb();
  const now = new Date();
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const [states, totalReviews] = await Promise.all([
    db.cardStates.toArray(),
    db.reviewLogs.count(),
  ]);

  const byId = new Map(states.map((item) => [item.cardId, item]));
  const dueCardIds: string[] = [];
  let dueToday = 0;
  let dueNow = 0;
  let newCount = 0;
  let reviewDueCount = 0;
  let nextDueAt: Date | null = null;

  const knownIds =
    allCardIds.length > 0 ? allCardIds : states.map((s) => s.cardId);

  for (const id of knownIds) {
    const state = byId.get(id);
    if (!state) {
      newCount += 1;
      dueNow += 1;
      dueToday += 1;
      dueCardIds.push(id);
      continue;
    }

    const dueTime = new Date(state.due);
    if (dueTime.getTime() <= now.getTime()) {
      dueNow += 1;
      dueToday += 1;
      reviewDueCount += 1;
      dueCardIds.push(id);
    } else if (dueTime.getTime() <= endOfToday.getTime()) {
      dueToday += 1;
      reviewDueCount += 1;
      dueCardIds.push(id);
    }

    if (
      dueTime.getTime() > now.getTime() &&
      (!nextDueAt || dueTime.getTime() < nextDueAt.getTime())
    ) {
      nextDueAt = dueTime;
    }
  }

  return {
    dueToday,
    dueNow,
    newCount,
    reviewDueCount,
    totalTracked: states.length,
    totalReviews,
    nextDueAt,
    dueCardIds,
  };
}
