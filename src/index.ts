#!/usr/bin/env node

import * as queries from "./queries.ts";
import * as writer from "./writer.ts";

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

function json(data: unknown): void {
  process.stdout.write(`${JSON.stringify(data, null, 2)}\n`);
}

function getAuthToken(): string {
  const token = flag("token") ?? process.env.THINGS_AUTH_TOKEN;
  if (!token) {
    console.error("Auth token required. Use --token or set THINGS_AUTH_TOKEN.");
    process.exit(1);
  }
  return token;
}

const HELP = `thingscli — CLI for Things 3

Read commands:
  today                    Tasks on Today list
  inbox                    Inbox tasks
  upcoming                 Scheduled/upcoming tasks
  anytime                  Anytime tasks (no date, started)
  someday                  Someday tasks
  projects                 All projects
  logbook [--limit N]      Completed tasks (default: 50)
  search <query>           Search by title or notes
  tag <name>               Tasks with tag
  tags                     List all tags
  stats                    Task statistics

Write commands (require --token or THINGS_AUTH_TOKEN):
  add <title> [options]    Add a task
    --when <date>          today, tomorrow, evening, someday, or YYYY-MM-DD
    --deadline <date>      Deadline date
    --tags <t1,t2>         Comma-separated tags
    --list <project>       Project name
    --heading <heading>    Heading within project
    --notes <text>         Notes
    --checklist <a,b,c>    Checklist items (newline or comma separated)

  complete <uuid>          Mark task complete

  update <uuid> [options]  Update a task
    --title <text>         New title
    --when <date>          Reschedule
    --deadline <date>      Set deadline
    --add-tags <t1,t2>     Add tags
    --append-notes <text>  Append to notes
    --completed            Mark complete
    --cancelled            Mark cancelled

All read commands output JSON. Pipe to jq for formatting.`;

switch (command) {
  case "today":
    json(queries.today());
    break;
  case "inbox":
    json(queries.inbox());
    break;
  case "upcoming":
    json(queries.upcoming());
    break;
  case "anytime":
    json(queries.anytime());
    break;
  case "someday":
    json(queries.someday());
    break;
  case "projects":
    json(queries.projects());
    break;
  case "logbook":
    json(queries.logbook(Number(flag("limit")) || 50));
    break;
  case "search": {
    const query = args[1];
    if (!query) {
      console.error("Usage: thingscli search <query>");
      process.exit(1);
    }
    json(queries.search(query));
    break;
  }
  case "tag": {
    const tagName = args[1];
    if (!tagName) {
      console.error("Usage: thingscli tag <name>");
      process.exit(1);
    }
    json(queries.byTag(tagName));
    break;
  }
  case "tags":
    json(queries.allTags());
    break;
  case "stats":
    json(queries.stats());
    break;
  case "add": {
    const title = args[1];
    if (!title) {
      console.error("Usage: thingscli add <title> [--when today] [--deadline 2026-04-25]");
      process.exit(1);
    }
    writer.add({
      title,
      when: flag("when"),
      deadline: flag("deadline"),
      tags: flag("tags"),
      list: flag("list"),
      heading: flag("heading"),
      notes: flag("notes"),
      checklist: flag("checklist"),
      authToken: flag("token") ?? process.env.THINGS_AUTH_TOKEN,
    });
    console.log(`Added: ${title}`);
    break;
  }
  case "complete": {
    const id = args[1];
    if (!id) {
      console.error("Usage: thingscli complete <uuid>");
      process.exit(1);
    }
    writer.complete(id, getAuthToken());
    console.log(`Completed: ${id}`);
    break;
  }
  case "update": {
    const id = args[1];
    if (!id) {
      console.error("Usage: thingscli update <uuid> [--title ...] [--when ...]");
      process.exit(1);
    }
    writer.update({
      id,
      title: flag("title"),
      when: flag("when"),
      deadline: flag("deadline"),
      addTags: flag("add-tags"),
      notes: flag("notes"),
      appendNotes: flag("append-notes"),
      completed: hasFlag("completed"),
      cancelled: hasFlag("cancelled"),
      authToken: getAuthToken(),
    });
    console.log(`Updated: ${id}`);
    break;
  }
  case "help":
  case "--help":
  case "-h":
  case undefined:
    console.log(HELP);
    break;
  default:
    console.error(`Unknown command: ${command}\nRun 'thingscli help' for usage.`);
    process.exit(1);
}
