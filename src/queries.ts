import { getDb, mapTask, queryTasks, type Task } from "./db.ts";

const ACTIVE = "t.trashed = 0 AND t.status = 0 AND t.type = 0";

function todayEncoded(): number {
  const now = new Date();
  return (now.getFullYear() << 16) | ((now.getMonth() + 1) << 12) | (now.getDate() << 7);
}

export function today(): Task[] {
  return queryTasks(
    `${ACTIVE} AND t.start = 1 AND (t.startDate IS NULL OR t.startDate <= ?)`,
    [todayEncoded()],
  );
}

export function inbox(): Task[] {
  return queryTasks(`${ACTIVE} AND t.start = 0 AND t.project IS NULL`);
}

export function upcoming(): Task[] {
  return queryTasks(
    `${ACTIVE} AND t.start = 1 AND t.startDate > ?`,
    [todayEncoded()],
  );
}

export function anytime(): Task[] {
  return queryTasks(`${ACTIVE} AND t.start = 1 AND t.startDate IS NULL`);
}

export function someday(): Task[] {
  return queryTasks(`${ACTIVE} AND t.start = 2`);
}

export function projects(): Task[] {
  return queryTasks("t.trashed = 0 AND t.status = 0 AND t.type = 1");
}

export function search(query: string): Task[] {
  return queryTasks(
    "t.trashed = 0 AND t.status = 0 AND (t.title LIKE ? OR t.notes LIKE ?)",
    [`%${query}%`, `%${query}%`],
  );
}

export function allTags(): string[] {
  const rows = getDb()
    .prepare("SELECT title FROM TMTag ORDER BY title")
    .all() as { title: string }[];
  return rows.map((r) => r.title);
}

export function byTag(tagName: string): Task[] {
  return queryTasks(`${ACTIVE} AND tag.title = ?`, [tagName]);
}

export function logbook(limit = 50): Task[] {
  const sql = `
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
    WHERE t.trashed = 0 AND t.status = 3 AND t.type = 0
    GROUP BY t.uuid
    ORDER BY t.stopDate DESC
    LIMIT ?
  `;
  const rows = getDb().prepare(sql).all(limit) as Parameters<typeof mapTask>[0][];
  return rows.map(mapTask);
}

export interface Area {
  uuid: string;
  title: string;
  visible: boolean;
  taskCount: number;
  projectCount: number;
}

export function areas(): Area[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT a.uuid, a.title, a.visible,
        (SELECT COUNT(*) FROM TMTask t WHERE t.area = a.uuid AND t.trashed = 0 AND t.status = 0 AND t.type = 0) AS taskCount,
        (SELECT COUNT(*) FROM TMTask t WHERE t.area = a.uuid AND t.trashed = 0 AND t.status = 0 AND t.type = 1) AS projectCount
      FROM TMArea a ORDER BY a."index"`,
    )
    .all() as { uuid: string; title: string; visible: number; taskCount: number; projectCount: number }[];
  return rows.map((r) => ({
    uuid: r.uuid,
    title: r.title,
    visible: r.visible === 1,
    taskCount: r.taskCount,
    projectCount: r.projectCount,
  }));
}

export function projectTasks(projectRef: string): Task[] {
  // Try UUID first, fall back to title match
  const db = getDb();
  const byUuid = db
    .prepare("SELECT uuid FROM TMTask WHERE uuid = ? AND type = 1 AND trashed = 0")
    .get(projectRef) as { uuid: string } | undefined;

  const projectUuid = byUuid
    ? byUuid.uuid
    : (
        db
          .prepare("SELECT uuid FROM TMTask WHERE title = ? AND type = 1 AND trashed = 0")
          .get(projectRef) as { uuid: string } | undefined
      )?.uuid;

  if (!projectUuid) return [];
  return queryTasks(`${ACTIVE} AND t.project = ?`, [projectUuid]);
}

export function stats(): Record<string, number> {
  const db = getDb();
  const count = (where: string) =>
    (db.prepare(`SELECT COUNT(*) AS c FROM TMTask WHERE ${where}`).get() as { c: number }).c;

  return {
    inbox: count("trashed=0 AND status=0 AND type=0 AND start=0 AND project IS NULL"),
    today: today().length,
    upcoming: count(`trashed=0 AND status=0 AND type=0 AND start=1 AND startDate IS NOT NULL AND startDate > ${todayEncoded()}`),
    anytime: count("trashed=0 AND status=0 AND type=0 AND start=1 AND startDate IS NULL"),
    someday: count("trashed=0 AND status=0 AND type=0 AND start=2"),
    projects: count("trashed=0 AND status=0 AND type=1"),
    completed: count("trashed=0 AND status=3 AND type=0"),
  };
}
