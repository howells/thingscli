const WHEN_ENUM = ["today", "tomorrow", "evening", "anytime", "someday", "YYYY-MM-DD"];

const SCHEMAS: Record<string, object> = {
  add: {
    command: "add",
    description: "Create a new task in Things 3",
    params: {
      title: { type: "string", required: true, maxLength: 4000 },
      when: { type: "string", enum: WHEN_ENUM },
      deadline: { type: "string", format: "date", description: "YYYY-MM-DD" },
      tags: { type: "string", description: "Comma-separated tag names" },
      list: { type: "string", description: "Project name to add task to" },
      heading: { type: "string", description: "Heading within project" },
      notes: { type: "string", maxLength: 10000 },
      checklist: { type: "string", description: "Comma or newline separated checklist items" },
    },
    accepts_json: true,
  },
  update: {
    command: "update",
    description: "Update an existing task",
    params: {
      id: { type: "string", required: true, description: "Task UUID" },
      title: { type: "string", maxLength: 4000 },
      when: { type: "string", enum: WHEN_ENUM },
      deadline: { type: "string", format: "date" },
      "add-tags": { type: "string", description: "Comma-separated tags to add" },
      notes: { type: "string", maxLength: 10000 },
      "append-notes": { type: "string" },
      completed: { type: "boolean" },
      cancelled: { type: "boolean" },
    },
    accepts_json: true,
  },
  complete: {
    command: "complete",
    description: "Mark a task as complete",
    params: {
      id: { type: "string", required: true, description: "Task UUID" },
    },
    accepts_json: true,
  },
  today: {
    command: "today",
    description: "List tasks on the Today list",
    params: {
      fields: { type: "string", description: "Comma-separated field names to return" },
      limit: { type: "integer", description: "Max results" },
    },
    returns: "Task[]",
  },
  inbox: {
    command: "inbox",
    description: "List inbox tasks",
    params: {
      fields: { type: "string" },
      limit: { type: "integer" },
    },
    returns: "Task[]",
  },
  upcoming: {
    command: "upcoming",
    description: "List scheduled/upcoming tasks",
    params: { fields: { type: "string" }, limit: { type: "integer" } },
    returns: "Task[]",
  },
  anytime: {
    command: "anytime",
    description: "List anytime tasks (started, no date)",
    params: { fields: { type: "string" }, limit: { type: "integer" } },
    returns: "Task[]",
  },
  someday: {
    command: "someday",
    description: "List someday tasks",
    params: { fields: { type: "string" }, limit: { type: "integer" } },
    returns: "Task[]",
  },
  projects: {
    command: "projects",
    description: "List all projects",
    params: { fields: { type: "string" }, limit: { type: "integer" } },
    returns: "Task[]",
  },
  logbook: {
    command: "logbook",
    description: "List completed tasks",
    params: {
      fields: { type: "string" },
      limit: { type: "integer", default: 50 },
    },
    returns: "Task[]",
  },
  search: {
    command: "search",
    description: "Search tasks by title or notes",
    params: {
      query: { type: "string", required: true },
      fields: { type: "string" },
      limit: { type: "integer" },
    },
    returns: "Task[]",
  },
  tag: {
    command: "tag",
    description: "List tasks with a specific tag",
    params: {
      name: { type: "string", required: true },
      fields: { type: "string" },
      limit: { type: "integer" },
    },
    returns: "Task[]",
  },
  tags: {
    command: "tags",
    description: "List all tag names",
    params: {},
    returns: "string[]",
  },
  stats: {
    command: "stats",
    description: "Task count statistics",
    params: {},
    returns: "Record<string, number>",
  },
};

export function getSchema(command?: string): object {
  if (command && command in SCHEMAS) {
    return SCHEMAS[command] as object;
  }
  return {
    cli: "thingscli",
    version: "0.1.0",
    description: "CLI for Things 3 — read from database, write via URL scheme",
    task_fields: [
      "uuid", "title", "type", "status", "start", "notes",
      "startDate", "deadline", "createdAt", "project", "projectTitle",
      "area", "areaTitle", "tags", "checklistCount", "openChecklistCount",
    ],
    commands: SCHEMAS,
  };
}
