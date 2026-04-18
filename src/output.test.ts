import { describe, expect, it } from "vitest";
import { filterFields } from "./output.ts";

describe("filterFields", () => {
  const tasks = [
    { uuid: "abc", title: "Task 1", notes: "long notes", deadline: "2026-04-25", tags: ["work"] },
    { uuid: "def", title: "Task 2", notes: null, deadline: null, tags: [] },
  ];

  it("returns all fields when no filter specified", () => {
    const result = filterFields(tasks, undefined);
    expect(result).toEqual(tasks);
  });

  it("filters to specified fields", () => {
    const result = filterFields(tasks, "uuid,title");
    expect(result).toEqual([
      { uuid: "abc", title: "Task 1" },
      { uuid: "def", title: "Task 2" },
    ]);
  });

  it("handles single field", () => {
    const result = filterFields(tasks, "uuid");
    expect(result).toEqual([{ uuid: "abc" }, { uuid: "def" }]);
  });

  it("ignores non-existent fields", () => {
    const result = filterFields(tasks, "uuid,nonexistent");
    expect(result).toEqual([{ uuid: "abc" }, { uuid: "def" }]);
  });

  it("handles fields with whitespace", () => {
    const result = filterFields(tasks, "uuid , title");
    expect(result).toEqual([
      { uuid: "abc", title: "Task 1" },
      { uuid: "def", title: "Task 2" },
    ]);
  });
});
