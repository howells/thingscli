import { describe, expect, it } from "vitest";
import { getSchema } from "./schema.ts";

describe("getSchema", () => {
  it("returns full schema when no command specified", () => {
    const schema = getSchema() as Record<string, unknown>;
    expect(schema.cli).toBe("thingscli");
    expect(schema.commands).toBeDefined();
    expect(schema.task_fields).toBeDefined();
    expect(Array.isArray(schema.task_fields)).toBe(true);
  });

  it("returns schema for a specific command", () => {
    const schema = getSchema("add") as Record<string, unknown>;
    expect(schema.command).toBe("add");
    expect(schema.description).toBeDefined();
    expect(schema.params).toBeDefined();
    expect(schema.accepts_json).toBe(true);
  });

  it("returns schema for read commands", () => {
    const schema = getSchema("today") as Record<string, unknown>;
    expect(schema.command).toBe("today");
    expect(schema.returns).toBe("Task[]");
  });

  it("add schema includes all expected params", () => {
    const schema = getSchema("add") as { params: Record<string, unknown> };
    const params = Object.keys(schema.params);
    expect(params).toContain("title");
    expect(params).toContain("when");
    expect(params).toContain("deadline");
    expect(params).toContain("tags");
    expect(params).toContain("list");
    expect(params).toContain("notes");
  });

  it("marks title as required for add", () => {
    const schema = getSchema("add") as {
      params: Record<string, { required?: boolean }>;
    };
    expect(schema.params.title.required).toBe(true);
  });

  it("includes when enum values", () => {
    const schema = getSchema("add") as {
      params: Record<string, { enum?: string[] }>;
    };
    const whenEnum = schema.params.when.enum;
    expect(whenEnum).toContain("today");
    expect(whenEnum).toContain("tomorrow");
    expect(whenEnum).toContain("evening");
    expect(whenEnum).toContain("someday");
  });

  it("returns full schema for unknown command", () => {
    const schema = getSchema("nonexistent") as Record<string, unknown>;
    expect(schema.cli).toBe("thingscli");
  });

  it("all write commands have accepts_json: true", () => {
    for (const cmd of ["add", "update", "complete"]) {
      const schema = getSchema(cmd) as { accepts_json?: boolean };
      expect(schema.accepts_json).toBe(true);
    }
  });
});
