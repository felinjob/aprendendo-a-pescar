import Dexie, { type EntityTable } from 'dexie';

export interface CardStateRecord {
  cardId: string;
  moduleId: string;
  due: Date;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  learningSteps: number;
  reps: number;
  lapses: number;
  state: number;
  lastReview?: Date;
}

export interface ReviewLogRecord {
  id?: number;
  cardId: string;
  grade: number;
  state: number;
  due: Date;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reviewTimestamp: Date;
}

export interface ChecklistProgressRecord {
  itemId: string;
  completed: boolean;
  updatedAt: Date;
}

export interface DatabaseBackupPayload {
  app: 'aprendendo-a-pescar';
  schemaVersion: 1;
  exportedAt: string;
  tables: {
    cardStates: CardStateRecord[];
    reviewLogs: ReviewLogRecord[];
    checklistProgress: ChecklistProgressRecord[];
  };
}

export class PescaEstudoDB extends Dexie {
  cardStates!: EntityTable<CardStateRecord, 'cardId'>;
  reviewLogs!: EntityTable<ReviewLogRecord, 'id'>;
  checklistProgress!: EntityTable<ChecklistProgressRecord, 'itemId'>;

  constructor() {
    super('PescaEstudoDB');
    this.version(1).stores({
      cardStates: 'cardId, moduleId, due, state, lastReview',
      reviewLogs: '++id, cardId, grade, state, due, reviewTimestamp',
      checklistProgress: 'itemId, completed, updatedAt',
    });
  }
}

let dbInstance: PescaEstudoDB | null = null;

export const FSRS_UPDATED_EVENT = 'ap:fsrs-updated';

export function isIndexedDbAvailable(): boolean {
  return typeof indexedDB !== 'undefined';
}

export function getDb(): PescaEstudoDB {
  if (!isIndexedDbAvailable()) {
    throw new Error('IndexedDB indisponível fora do navegador.');
  }
  if (!dbInstance) {
    dbInstance = new PescaEstudoDB();
  }
  return dbInstance;
}

export function notifyFsrsUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(FSRS_UPDATED_EVENT));
  }
}

function parseDateRequired(value: unknown, fieldName: string): Date {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  throw new Error(`Data inválida no backup para o campo "${fieldName}".`);
}

function parseDateOptional(value: unknown, fieldName: string): Date | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return parseDateRequired(value, fieldName);
}

export async function exportDatabaseBackup(): Promise<{
  cardStatesCount: number;
  reviewLogsCount: number;
  checklistCount: number;
}> {
  const db = getDb();
  const [cardStates, reviewLogs, checklistProgress] = await db.transaction(
    'r',
    db.cardStates,
    db.reviewLogs,
    db.checklistProgress,
    async () => {
      return Promise.all([
        db.cardStates.toArray(),
        db.reviewLogs.toArray(),
        db.checklistProgress.toArray(),
      ]);
    }
  );

  const payload: DatabaseBackupPayload = {
    app: 'aprendendo-a-pescar',
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    tables: {
      cardStates,
      reviewLogs,
      checklistProgress,
    },
  };

  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const dateStamp = new Date().toISOString().slice(0, 10);

  const link = document.createElement('a');
  link.href = url;
  link.download = `aprendendo-a-pescar-backup-${dateStamp}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  return {
    cardStatesCount: cardStates.length,
    reviewLogsCount: reviewLogs.length,
    checklistCount: checklistProgress.length,
  };
}

export async function importDatabaseBackup(file: File): Promise<{
  cardStatesCount: number;
  reviewLogsCount: number;
  checklistCount: number;
}> {
  const rawText = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error('Arquivo JSON inválido.');
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('tables' in parsed) ||
    typeof (parsed as DatabaseBackupPayload).tables !== 'object'
  ) {
    throw new Error('Estrutura de backup incompatível com PescaEstudoDB.');
  }

  const candidate = parsed as Partial<DatabaseBackupPayload>;
  if (candidate.app && candidate.app !== 'aprendendo-a-pescar') {
    throw new Error('Arquivo de backup pertence a outra aplicação.');
  }

  const rawTables = candidate.tables;
  if (
    !rawTables ||
    !Array.isArray(rawTables.cardStates) ||
    !Array.isArray(rawTables.reviewLogs) ||
    !Array.isArray(rawTables.checklistProgress)
  ) {
    throw new Error('Tabelas obrigatórias ausentes no arquivo de backup.');
  }

  const cardStates: CardStateRecord[] = rawTables.cardStates.map((item) => {
    if (!item || typeof item.cardId !== 'string') {
      throw new Error('Registro inválido em cardStates.');
    }
    return {
      cardId: item.cardId,
      moduleId: typeof item.moduleId === 'string' ? item.moduleId : 'geral',
      due: parseDateRequired(item.due, 'cardStates.due'),
      stability: Number(item.stability ?? 0),
      difficulty: Number(item.difficulty ?? 0),
      elapsedDays: Number(item.elapsedDays ?? 0),
      scheduledDays: Number(item.scheduledDays ?? 0),
      learningSteps: Number(item.learningSteps ?? 0),
      reps: Number(item.reps ?? 0),
      lapses: Number(item.lapses ?? 0),
      state: Number(item.state ?? 0),
      lastReview: parseDateOptional(item.lastReview, 'cardStates.lastReview'),
    };
  });

  const reviewLogs: ReviewLogRecord[] = rawTables.reviewLogs.map((log) => {
    if (!log || typeof log.cardId !== 'string') {
      throw new Error('Registro inválido em reviewLogs.');
    }
    const base: ReviewLogRecord = {
      cardId: log.cardId,
      grade: Number(log.grade),
      state: Number(log.state),
      due: parseDateRequired(log.due, 'reviewLogs.due'),
      stability: Number(log.stability ?? 0),
      difficulty: Number(log.difficulty ?? 0),
      elapsedDays: Number(log.elapsedDays ?? 0),
      scheduledDays: Number(log.scheduledDays ?? 0),
      reviewTimestamp: parseDateRequired(
        log.reviewTimestamp,
        'reviewLogs.reviewTimestamp'
      ),
    };
    if (typeof log.id === 'number' && Number.isInteger(log.id)) {
      base.id = log.id;
    }
    return base;
  });

  const checklistProgress: ChecklistProgressRecord[] =
    rawTables.checklistProgress.map((item) => {
      if (!item || typeof item.itemId !== 'string') {
        throw new Error('Registro inválido em checklistProgress.');
      }
      return {
        itemId: item.itemId,
        completed: Boolean(item.completed),
        updatedAt: parseDateRequired(
          item.updatedAt,
          'checklistProgress.updatedAt'
        ),
      };
    });

  const db = getDb();
  await db.transaction(
    'rw',
    db.cardStates,
    db.reviewLogs,
    db.checklistProgress,
    async () => {
      await db.cardStates.clear();
      await db.reviewLogs.clear();
      await db.checklistProgress.clear();

      if (cardStates.length > 0) {
        await db.cardStates.bulkPut(cardStates);
      }
      if (reviewLogs.length > 0) {
        await db.reviewLogs.bulkPut(reviewLogs);
      }
      if (checklistProgress.length > 0) {
        await db.checklistProgress.bulkPut(checklistProgress);
      }
    }
  );

  notifyFsrsUpdated();

  return {
    cardStatesCount: cardStates.length,
    reviewLogsCount: reviewLogs.length,
    checklistCount: checklistProgress.length,
  };
}
