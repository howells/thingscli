import { describe, expect, it } from "vitest";
import { execSync } from "node:child_process";

const CLI = "npx tsx src/index.ts";

function run(args: string): { ok: boolean; data: unknown; error?: string; command?: string } {
  try {
    const stdout = execSync(`${CLI} ${args}`, {
      cwd: import.meta.dirname + "/..",
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024,
      env: { ...process.env, THINGS_AUTH_TOKEN: process.env.THINGS_AUTH_TOKEN },
    });
    return JSON.parse(stdout);
  } catch (err) {
    const e = err as { stdout?: string };
    if (e.stdout) return JSON.parse(e.stdout);
    throw err;
  }
}

describe("read commands", () => {
  it("today returns an array of tasks", () => {
    const result = run("today");
    expect(result.ok).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.command).toBe("today");
  });

  it("today tasks have expected fields", () => {
    const result = run("today");
    const tasks = result.data as Record<string, unknown>[];
    if (tasks.length === 0) return; // empty today is valid
    const task = tasks[0];
    expect(task).toHaveProperty("uuid");
    expect(task).toHaveProperty("title");
    expect(task).toHaveProperty("type");
    expect(task).toHaveProperty("status");
    expect(task).toHaveProperty("tags");
  });

  it("inbox returns an array", () => {
    const result = run("inbox --limit 5");
    expect(result.ok).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
    expect((result.data as unknown[]).length).toBeLessThanOrEqual(5);
  });

  it("upcoming returns an array", () => {
    const result = run("upcoming");
    expect(result.ok).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
  });

  it("anytime returns an array", () => {
    const result = run("anytime");
    expect(result.ok).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
  });

  it("someday returns an array", () => {
    const result = run("someday");
    expect(result.ok).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
  });

  it("projects returns an array", () => {
    const result = run("projects");
    expect(result.ok).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
  });

  it("logbook returns an array", () => {
    const result = run("logbook --limit 5");
    expect(result.ok).toBe(true);
    const tasks = result.data as unknown[];
    expect(Array.isArray(tasks)).toBe(true);
    expect(tasks.length).toBeLessThanOrEqual(5);
  });

  it("tags returns an array of strings", () => {
    const result = run("tags");
    expect(result.ok).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
  });

  it("stats returns expected keys", () => {
    const result = run("stats");
    expect(result.ok).toBe(true);
    const stats = result.data as Record<string, number>;
    expect(stats).toHaveProperty("inbox");
    expect(stats).toHaveProperty("today");
    expect(stats).toHaveProperty("upcoming");
    expect(stats).toHaveProperty("anytime");
    expect(stats).toHaveProperty("someday");
    expect(stats).toHaveProperty("projects");
    expect(stats).toHaveProperty("completed");
    for (const v of Object.values(stats)) {
      expect(typeof v).toBe("number");
      expect(v).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("--fields", () => {
  it("filters to requested fields only", () => {
    const result = run("today --fields uuid,title");
    const tasks = result.data as Record<string, unknown>[];
    if (tasks.length === 0) return;
    const first = tasks[0];
    if (!first) return;
    const keys = Object.keys(first);
    expect(keys).toContain("uuid");
    expect(keys).toContain("title");
    expect(keys).not.toContain("notes");
    expect(keys).not.toContain("tags");
  });
});

describe("--limit", () => {
  it("limits results", () => {
    const result = run("today --limit 2");
    const tasks = result.data as unknown[];
    expect(tasks.length).toBeLessThanOrEqual(2);
  });
});

describe("search", () => {
  it("searches by title", () => {
    const result = run('search "to-do"');
    expect(result.ok).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
  });

  it("returns error without query", () => {
    const result = run("search");
    expect(result.ok).toBe(false);
    expect(result.error).toContain("query");
  });
});

describe("schema", () => {
  it("returns full schema with no arg", () => {
    const result = run("schema");
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.cli).toBe("thingscli");
    expect(data.commands).toBeDefined();
  });

  it("returns command-specific schema", () => {
    const result = run("schema add");
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.command).toBe("add");
    expect(data.params).toBeDefined();
  });
});

describe("error handling", () => {
  it("returns structured error for unknown command", () => {
    const result = run("nonexistent");
    expect(result.ok).toBe(false);
    expect(result.error).toContain("Unknown command");
  });

  it("returns structured error for invalid UUID", () => {
    const result = run("complete badid");
    expect(result.ok).toBe(false);
    expect(result.error).toContain("Invalid UUID");
  });

  it("returns structured error for bad --when value", () => {
    const result = run('add "test" --when "next friday"');
    expect(result.ok).toBe(false);
    expect(result.error).toContain("Invalid when");
  });
});

describe("dry-run", () => {
  it("validates add without executing", () => {
    const result = run("add --json '{\"title\":\"Dry run test\",\"when\":\"today\"}' --dry-run");
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.action).toBe("add");
    expect(data.title).toBe("Dry run test");
    expect(data.when).toBe("today");
  });

  it("validates and rejects bad input in dry-run", () => {
    const result = run("add --json '{\"title\":\"\",\"when\":\"today\"}' --dry-run");
    expect(result.ok).toBe(false);
    expect(result.error).toContain("required");
  });
});

describe("help", () => {
  it("returns structured help", () => {
    const result = run("help");
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.read).toBeDefined();
    expect(data.write).toBeDefined();
    expect(data.flags).toBeDefined();
  });
});
