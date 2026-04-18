import Database from "better-sqlite3";
import { homedir } from "node:os";
import { join } from "node:path";
import { readdirSync } from "node:fs";

const CONTAINER =
  "Library/Group Containers/JLMPQHK86H.com.culturedcode.ThingsMac";

function findDbPath(): string {
  const containerPath = join(homedir(), CONTAINER);
  const entries = readdirSync(containerPath).filter((e) =>
    e.startsWith("ThingsData-"),
  );
  const dataDir = entries[0];
  if (!dataDir) {
    throw new Error("Things 3 database not found. Is Things installed?");
  }
  return join(
    containerPath,
    dataDir,
    "Things Database.thingsdatabase",
    "main.sqlite",
  );
}

let db: Database.Database | undefined;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(findDbPath(), { readonly: true });
    db.pragma("journal_mode = WAL");
  }
  return db;
}

// Things date format: 11 bits year, 4 bits month, 5 bits day, 7 bits padding
export function decodeDate(value: number | null): string | null {
  if (value === null || value === 0) return null;
  const day = (value >> 7) & 0x1f;
  const month = (value >> 12) & 0xf;
  const year = (value >> 16) & 0x7ff;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// Cocoa timestamp (seconds since 2001-01-01) to ISO string
const COCOA_EPOCH = 978307200;

export function decodeTimestamp(value: number | null): string | null {
  if (value === null || value === 0) return null;
  return new Date((value + COCOA_EPOCH) * 1000).toISOString();
}

// Task type: 0 = task, 1 = project, 2 = heading
export type TaskType = "task" | "project" | "heading";
const TASK_TYPES: Record<number, TaskType> = {
  0: "task",
  1: "project",
  2: "heading",
};

// Task status: 0 = open, 2 = cancelled, 3 = completed
export type TaskStatus = "open" | "cancelled" | "completed";
const TASK_STATUSES: Record<number, TaskStatus> = {
  0: "open",
  2: "cancelled",
  3: "completed",
};

// Start: 0 = not started, 1 = started, 2 = someday
export type StartStatus = "inbox" | "started" | "someday";
const START_STATUSES: Record<number, StartStatus> = {
  0: "inbox",
  1: "started",
  2: "someday",
};

export interface Task {
  uuid: string;
  title: string;
  type: TaskType;
  status: TaskStatus;
  start: StartStatus;
  notes: string | null;
  startDate: string | null;
  deadline: string | null;
  createdAt: string | null;
  project: string | null;
  projectTitle: string | null;
  area: string | null;
  areaTitle: string | null;
  tags: string[];
  checklistCount: number;
  openChecklistCount: number;
}

interface RawTask {
  uuid: string;
  title: string;
  type: number;
  status: number;
  start: number;
  notes: string | null;
  startDate: number | null;
  deadline: number | null;
  creationDate: number | null;
  project: string | null;
  projectTitle: string | null;
  area: string | null;
  areaTitle: string | null;
  tags: string | null;
  checklistItemsCount: number;
  openChecklistItemsCount: number;
}

export function mapTask(raw: RawTask): Task {
  return {
    uuid: raw.uuid,
    title: raw.title,
    type: TASK_TYPES[raw.type] ?? "task",
    status: TASK_STATUSES[raw.status] ?? "open",
    start: START_STATUSES[raw.start] ?? "inbox",
    notes: raw.notes || null,
    startDate: decodeDate(raw.startDate),
    deadline: decodeDate(raw.deadline),
    createdAt: decodeTimestamp(raw.creationDate),
    project: raw.project,
    projectTitle: raw.projectTitle,
    area: raw.area,
    areaTitle: raw.areaTitle,
    tags: raw.tags ? raw.tags.split(",") : [],
    checklistCount: raw.checklistItemsCount,
    openChecklistCount: raw.openChecklistItemsCount,
  };
}

const BASE_QUERY = `
  SELECT
    t.uuid, t.title, t.type, t.status, t.start,
    t.notes, t.startDate, t.deadline, t.creationDate,
    t.project, p.title AS projectTitle,
    t.area, a.title AS areaTitle,
    GROUP_CONCAT(tag.title) AS tags,
    t.checklistItemsCount, t.openChecklistItemsCount
  FROM TMTask t
  LEFT JOIN TMTask p ON t.project = p.uuid
  LEFT JOIN TMArea a ON t.area = a.uuid
  LEFT JOIN TMTaskTag tt ON tt.tasks = t.uuid
  LEFT JOIN TMTag tag ON tt.tags = tag.uuid
`;

const GROUP_BY = "GROUP BY t.uuid";

export function queryTasks(where: string, params: unknown[] = []): Task[] {
  const sql = `${BASE_QUERY} WHERE ${where} ${GROUP_BY} ORDER BY t.todayIndex, t."index"`;
  const rows = getDb().prepare(sql).all(...params) as RawTask[];
  return rows.map(mapTask);
}
