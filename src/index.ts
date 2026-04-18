#!/usr/bin/env node

import * as queries from "./queries.ts";
import { getSchema } from "./schema.ts";
import { validateDate, validateTitle, validateUuid, validateWhen } from "./validate.ts";
import { error, filterFields, success } from "./output.ts";
import * as writer from "./writer.ts";
import type { Task } from "./db.ts";

const args = process.argv.slice(2);
const command = args[0];

function flag(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1) return undefined;
  return args[idx + 1];
}

function hasFlag(name: string): boolean {
  return args.includes(`--${name}`);
}

function getAuthToken(cmd: string): string {
  const token = flag("token") ?? process.env.THINGS_AUTH_TOKEN;
  if (!token) {
    error(
      "Auth token required. Use --token or set THINGS_AUTH_TOKEN env var.",
      cmd,
    );
  }
  return token;
}

function readJsonInput(cmd: string): Record<string, unknown> {
  const jsonStr = flag("json");
  if (!jsonStr) return {};
  try {
    const parsed = JSON.parse(jsonStr);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      error("--json must be a JSON object.", cmd);
    }
    return parsed as Record<string, unknown>;
  } catch {
    error("--json contains invalid JSON.", cmd);
  }
}

function applyLimit(tasks: Task[], limitStr: string | undefined): Task[] {
  if (!limitStr) return tasks;
  const n = Number(limitStr);
  if (Number.isNaN(n) || n < 1) return tasks;
  return tasks.slice(0, n);
}

function readResult(cmd: string, tasks: Task[]): never {
  const limited = applyLimit(tasks, flag("limit"));
  const filtered = filterFields(
    limited as unknown as Record<string, unknown>[],
    flag("fields"),
  );
  success(filtered, cmd);
}

// --- Commands ---

switch (command) {
  case "today":
    readResult("today", queries.today());
    break;
  case "inbox":
    readResult("inbox", queries.inbox());
    break;
  case "upcoming":
    readResult("upcoming", queries.upcoming());
    break;
  case "anytime":
    readResult("anytime", queries.anytime());
    break;
  case "someday":
    readResult("someday", queries.someday());
    break;
  case "projects":
    readResult("projects", queries.projects());
    break;
  case "logbook":
    readResult("logbook", queries.logbook(Number(flag("limit")) || 50));
    break;

  case "search": {
    const query = args[1];
    if (!query) error("search requires a query argument.", "search");
    readResult("search", queries.search(query));
    break;
  }

  case "tag": {
    const tagName = args[1];
    if (!tagName) error("tag requires a tag name argument.", "tag");
    readResult("tag", queries.byTag(tagName));
    break;
  }

  case "tags":
    success(queries.allTags(), "tags");
    break;

  case "stats":
    success(queries.stats(), "stats");
    break;

  case "add": {
    const json = readJsonInput("add");
    const title = (json.title as string) ?? args[1];
    const when = (json.when as string) ?? flag("when");
    const deadline = (json.deadline as string) ?? flag("deadline");
    const tags = (json.tags as string) ?? flag("tags");
    const list = (json.list as string) ?? flag("list");
    const heading = (json.heading as string) ?? flag("heading");
    const notes = (json.notes as string) ?? flag("notes");
    const checklist = (json.checklist as string) ?? flag("checklist");

    if (!title) error("title is required.", "add");
    validateTitle(title, "add");
    if (when) validateWhen(when, "add");
    if (deadline) validateDate(deadline, "deadline", "add");

    if (hasFlag("dry-run")) {
      success(
        { action: "add", title, when, deadline, tags, list, heading, notes, checklist },
        "add",
      );
    }

    writer.add({
      title,
      when,
      deadline,
      tags,
      list,
      heading,
      notes,
      checklist,
      authToken: flag("token") ?? process.env.THINGS_AUTH_TOKEN,
    });
    success({ action: "added", title }, "add");
    break;
  }

  case "complete": {
    const json = readJsonInput("complete");
    const id = (json.id as string) ?? args[1];
    if (!id) error("id is required.", "complete");
    validateUuid(id, "complete");

    if (hasFlag("dry-run")) {
      success({ action: "complete", id }, "complete");
    }

    writer.complete(id, getAuthToken("complete"));
    success({ action: "completed", id }, "complete");
    break;
  }

  case "update": {
    const json = readJsonInput("update");
    const id = (json.id as string) ?? args[1];
    if (!id) error("id is required.", "update");
    validateUuid(id, "update");

    const when = (json.when as string) ?? flag("when");
    const deadline = (json.deadline as string) ?? flag("deadline");
    if (when) validateWhen(when, "update");
    if (deadline) validateDate(deadline, "deadline", "update");

    const opts = {
      id,
      title: (json.title as string) ?? flag("title"),
      when,
      deadline,
      addTags: (json["add-tags"] as string) ?? (json.addTags as string) ?? flag("add-tags"),
      notes: (json.notes as string) ?? flag("notes"),
      appendNotes: (json["append-notes"] as string) ?? (json.appendNotes as string) ?? flag("append-notes"),
      completed: (json.completed as boolean) ?? hasFlag("completed"),
      cancelled: (json.cancelled as boolean) ?? hasFlag("cancelled"),
      authToken: getAuthToken("update"),
    };

    if (hasFlag("dry-run")) {
      success({ action: "update", ...opts, authToken: "[redacted]" }, "update");
    }

    writer.update(opts);
    success({ action: "updated", id }, "update");
    break;
  }

  case "schema":
    success(getSchema(args[1]), "schema");
    break;

  case "help":
  case "--help":
  case "-h":
    success(
      {
        usage: "thingscli <command> [args] [--fields uuid,title] [--limit 10] [--json '{...}'] [--dry-run]",
        read: ["today", "inbox", "upcoming", "anytime", "someday", "projects", "logbook", "search", "tag", "tags", "stats"],
        write: ["add", "complete", "update"],
        meta: ["schema", "schema <command>", "help"],
        flags: {
          "--fields": "Comma-separated field names to return (reads only)",
          "--limit": "Max results (reads only)",
          "--json": "Raw JSON payload for write commands",
          "--dry-run": "Validate and return payload without executing (writes only)",
          "--token": "Things auth token (or set THINGS_AUTH_TOKEN env var)",
        },
      },
      "help",
    );
    break;

  case undefined:
    error("No command provided. Run 'thingscli help' for usage.");
    break;

  default:
    error(`Unknown command: "${command}". Run 'thingscli help' for usage.`);
    break;
}
