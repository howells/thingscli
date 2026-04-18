#!/usr/bin/env node

import { error, flag, hasFlag, readJsonInput, readResult, success, validateTitle } from "@howells/cli";
import type { Task } from "./db.ts";
import * as queries from "./queries.ts";
import { getSchema } from "./schema.ts";
import { validateDate, validateUuid, validateWhen } from "./validate.ts";
import * as writer from "./writer.ts";

const command = process.argv[2];

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

function outputTasks(cmd: string, tasks: Task[]): void {
	readResult(cmd, tasks as unknown as Record<string, unknown>[]);
}

// --- Commands ---

switch (command) {
	case "today":
		outputTasks("today", queries.today());
		break;
	case "inbox":
		outputTasks("inbox", queries.inbox());
		break;
	case "upcoming":
		outputTasks("upcoming", queries.upcoming());
		break;
	case "anytime":
		outputTasks("anytime", queries.anytime());
		break;
	case "someday":
		outputTasks("someday", queries.someday());
		break;
	case "projects":
		outputTasks("projects", queries.projects());
		break;
	case "logbook":
		outputTasks("logbook", queries.logbook(Number(flag("limit")) || 50));
		break;

	case "areas":
		success(queries.areas(), "areas");
		break;

	case "project": {
		const ref = process.argv[3];
		if (!ref) error("project requires a name or UUID argument.", "project");
		outputTasks("project", queries.projectTasks(ref));
		break;
	}

	case "search": {
		const query = process.argv[3];
		if (!query) error("search requires a query argument.", "search");
		outputTasks("search", queries.search(query));
		break;
	}

	case "tag": {
		const tagName = process.argv[3];
		if (!tagName) error("tag requires a tag name argument.", "tag");
		outputTasks("tag", queries.byTag(tagName));
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
		const title = (json.title as string) ?? process.argv[3];
		const when = (json.when as string) ?? flag("when");
		const deadline = (json.deadline as string) ?? flag("deadline");
		const tags = (json.tags as string) ?? flag("tags");
		const list = (json.list as string) ?? flag("list");
		const heading = (json.heading as string) ?? flag("heading");
		const notes = (json.notes as string) ?? flag("notes");
		const checklist = (json.checklist as string) ?? flag("checklist");

		if (!title) error("title is required.", "add");
		validateTitle(title, "add", 4000);
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
		const id = (json.id as string) ?? process.argv[3];
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
		const id = (json.id as string) ?? process.argv[3];
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
		success(getSchema(process.argv[3]), "schema");
		break;

	case "help":
	case "--help":
	case "-h":
		success(
			{
				usage: "thingscli <command> [args] [--fields uuid,title] [--limit 10] [--json '{...}'] [--dry-run]",
				read: ["today", "inbox", "upcoming", "anytime", "someday", "projects", "project <name>", "areas", "logbook", "search", "tag", "tags", "stats"],
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
