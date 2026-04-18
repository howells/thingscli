# thingscli

CLI for [Things 3](https://culturedcode.com/things/) — read tasks from the database, write via URL scheme.

Designed for AI agents and automation. All read commands output JSON. macOS only.

## Install

```bash
npm install -g @howells/thingscli
```

## Usage

### Read

```bash
thingscli today          # Tasks on Today list
thingscli inbox          # Inbox tasks
thingscli upcoming       # Scheduled tasks
thingscli anytime        # Anytime (no date, started)
thingscli someday        # Someday tasks
thingscli projects       # All projects
thingscli logbook        # Completed tasks
thingscli search "query" # Search by title or notes
thingscli tag "work"     # Tasks with tag
thingscli tags           # List all tags
thingscli stats          # Task statistics
```

### Write

Write commands require an auth token. Get yours from Things → Settings → General → Enable Things URLs.

```bash
export THINGS_AUTH_TOKEN="your-token"

thingscli add "Fix the bug" --when today
thingscli add "Review PR" --when tomorrow --deadline 2026-04-25 --tags work --list MyProject
thingscli complete <uuid>
thingscli update <uuid> --when tomorrow --add-tags urgent
```

### Options

```
--when <date>          today, tomorrow, evening, someday, or YYYY-MM-DD
--deadline <date>      Deadline date
--tags <t1,t2>         Comma-separated tags
--list <project>       Project name
--notes <text>         Notes
--checklist <a,b,c>    Checklist items
--token <token>        Auth token (or use THINGS_AUTH_TOKEN env var)
```

## How it works

**Reads** query the Things 3 SQLite database directly — fast, structured, no GUI dependency.

**Writes** use the [Things URL scheme](https://culturedcode.com/things/support/articles/2803573/) with auth token — reliable, returns task IDs via x-callback-url.

## License

MIT
