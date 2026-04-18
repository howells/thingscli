import { describe, expect, it } from "vitest";
import { decodeDate, decodeTimestamp, mapTask } from "./db.ts";

describe("decodeDate", () => {
  it("decodes a known Things date integer", () => {
    // 132785792 = 2026-02-13 in Things bit-packed format
    expect(decodeDate(132785792)).toBe("2026-02-13");
  });

  it("decodes another known date", () => {
    // 132789376 = 2026-03-09
    expect(decodeDate(132789376)).toBe("2026-03-09");
  });

  it("decodes a 2017 date", () => {
    expect(decodeDate(132208896)).toBe("2017-05-18");
  });

  it("returns null for null input", () => {
    expect(decodeDate(null)).toBeNull();
  });

  it("returns null for zero", () => {
    expect(decodeDate(0)).toBeNull();
  });

  it("encodes and decodes consistently", () => {
    // Manually encode 2026-04-18
    const encoded = (2026 << 16) | (4 << 12) | (18 << 7);
    expect(decodeDate(encoded)).toBe("2026-04-18");
  });

  it("handles single-digit months and days with padding", () => {
    const encoded = (2026 << 16) | (1 << 12) | (5 << 7);
    expect(decodeDate(encoded)).toBe("2026-01-05");
  });
});

describe("decodeTimestamp", () => {
  it("converts Cocoa timestamp to ISO string", () => {
    // Cocoa epoch = 2001-01-01 00:00:00 UTC = Unix 978307200
    // So Cocoa 0 = 2001-01-01
    expect(decodeTimestamp(0)).toBeNull(); // 0 treated as null
  });

  it("decodes a known timestamp", () => {
    // 1000 seconds after Cocoa epoch = 2001-01-01T00:16:40
    const result = decodeTimestamp(1000);
    expect(result).toBe("2001-01-01T00:16:40.000Z");
  });

  it("returns null for null", () => {
    expect(decodeTimestamp(null)).toBeNull();
  });
});

describe("mapTask", () => {
  it("maps a raw task row to structured Task", () => {
    const raw = {
      uuid: "abc123def456ghi789jkl0",
      title: "Test task",
      type: 0,
      status: 0,
      start: 1,
      notes: "Some notes",
      startDate: (2026 << 16) | (4 << 12) | (18 << 7),
      deadline: null,
      creationDate: 800000000,
      project: "proj-uuid",
      projectTitle: "My Project",
      area: null,
      areaTitle: null,
      tags: "work,urgent",
      checklistItemsCount: 3,
      openChecklistItemsCount: 1,
    };

    const task = mapTask(raw);

    expect(task.uuid).toBe("abc123def456ghi789jkl0");
    expect(task.title).toBe("Test task");
    expect(task.type).toBe("task");
    expect(task.status).toBe("open");
    expect(task.start).toBe("started");
    expect(task.notes).toBe("Some notes");
    expect(task.startDate).toBe("2026-04-18");
    expect(task.deadline).toBeNull();
    expect(task.projectTitle).toBe("My Project");
    expect(task.tags).toEqual(["work", "urgent"]);
    expect(task.checklistCount).toBe(3);
    expect(task.openChecklistCount).toBe(1);
  });

  it("maps status values correctly", () => {
    const base = {
      uuid: "a", title: "t", type: 0, start: 0, notes: null,
      startDate: null, deadline: null, creationDate: null,
      project: null, projectTitle: null, area: null, areaTitle: null,
      tags: null, checklistItemsCount: 0, openChecklistItemsCount: 0,
    };

    expect(mapTask({ ...base, status: 0 }).status).toBe("open");
    expect(mapTask({ ...base, status: 2 }).status).toBe("cancelled");
    expect(mapTask({ ...base, status: 3 }).status).toBe("completed");
  });

  it("maps type values correctly", () => {
    const base = {
      uuid: "a", title: "t", status: 0, start: 0, notes: null,
      startDate: null, deadline: null, creationDate: null,
      project: null, projectTitle: null, area: null, areaTitle: null,
      tags: null, checklistItemsCount: 0, openChecklistItemsCount: 0,
    };

    expect(mapTask({ ...base, type: 0 }).type).toBe("task");
    expect(mapTask({ ...base, type: 1 }).type).toBe("project");
    expect(mapTask({ ...base, type: 2 }).type).toBe("heading");
  });

  it("splits tags correctly", () => {
    const base = {
      uuid: "a", title: "t", type: 0, status: 0, start: 0, notes: null,
      startDate: null, deadline: null, creationDate: null,
      project: null, projectTitle: null, area: null, areaTitle: null,
      checklistItemsCount: 0, openChecklistItemsCount: 0,
    };

    expect(mapTask({ ...base, tags: null }).tags).toEqual([]);
    expect(mapTask({ ...base, tags: "" }).tags).toEqual([]);
    expect(mapTask({ ...base, tags: "solo" }).tags).toEqual(["solo"]);
    expect(mapTask({ ...base, tags: "a,b,c" }).tags).toEqual(["a", "b", "c"]);
  });
});
