# thingscli — Agent Guide

CLI for Things 3. Reads from the SQLite database (fast, structured). Writes via URL scheme (reliable, auth-token gated).

## Quick Start

```bash
# Read today's tasks (JSON, 3 fields only)
thingscli today --fields uuid,title,deadline

# Add a task via JSON payload
thingscli add --json '{"title":"Fix the bug","when":"today","tags":"work"}'

# Validate before executing
thingscli add --json '{"title":"Fix the bug","when":"today"}' --dry-run

# Complete a task
thingscli complete TASK_UUID

# Get schema for any command
thingscli schema add
```

## Invariants

- **Always use `--fields`** on read commands. Default output includes `notes` which wastes tokens. Use `--fields uuid,title,deadline,projectTitle,tags` for triage.
- **Always use `--dry-run`** before mutating. Validates all inputs and returns the payload without side effects.
- **Always use `--json`** for writes. Avoids shell escaping issues with titles containing quotes, newlines, or special characters.
- **Auth token**: Set `THINGS_AUTH_TOKEN` env var. Required for `add`, `update`, `complete`.
- **All output is JSON**, including errors. Parse `.ok` to check success, `.data` for results, `.error` for messages.
- **UUIDs are 22+ alphanumeric characters**. Never guess or construct UUIDs — always read them from a query first.

## Response Format

```json
{
  "ok": true,
  "data": [...],
  "command": "today"
}
```

On error:
```json
{
  "ok": false,
  "error": "Invalid UUID: contains path traversal characters.",
  "command": "complete"
}
```

## Common Workflows

### Triage today's tasks
```bash
thingscli today --fields uuid,title,deadline,projectTitle,tags
```

### Add with full context
```bash
thingscli add --json '{"title":"Review PR","when":"today","deadline":"2026-04-25","tags":"work","list":"Sift","notes":"Check feature branch"}'
```

### Move a task to tomorrow
```bash
thingscli update TASK_UUID --json '{"when":"tomorrow"}'
```

### Batch: check inbox then triage
```bash
thingscli inbox --fields uuid,title,createdAt --limit 10
# Then for each: update with --json '{"when":"today"}' or '{"when":"someday"}'
```

## Field Reference

Task fields available for `--fields`: `uuid`, `title`, `type`, `status`, `start`, `notes`, `startDate`, `deadline`, `createdAt`, `project`, `projectTitle`, `area`, `areaTitle`, `tags`, `checklistCount`, `openChecklistCount`

## macOS Only

This CLI reads the Things 3 SQLite database at `~/Library/Group Containers/JLMPQHK86H.com.culturedcode.ThingsMac/`. It only works on macOS with Things 3 installed.
