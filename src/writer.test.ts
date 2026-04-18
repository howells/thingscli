import { describe, expect, it } from "vitest";
import { buildUrl } from "./writer.ts";

describe("buildUrl", () => {
  it("builds a simple add URL", () => {
    const url = buildUrl("add", { title: "Fix bug" });
    expect(url).toBe("things:///add?title=Fix%20bug");
  });

  it("includes auth token", () => {
    const url = buildUrl("update", {
      "auth-token": "tok123",
      id: "abc",
      completed: "true",
    });
    expect(url).toBe(
      "things:///update?auth-token=tok123&id=abc&completed=true",
    );
  });

  it("encodes special characters", () => {
    const url = buildUrl("add", { title: "Fix & deploy" });
    expect(url).toBe("things:///add?title=Fix%20%26%20deploy");
  });

  it("filters out empty values", () => {
    const url = buildUrl("add", { title: "Test", tags: "", notes: "hi" });
    expect(url).toBe("things:///add?title=Test&notes=hi");
  });

  it("handles newlines in to-dos list", () => {
    const url = buildUrl("add-project", {
      title: "Proj",
      "to-dos": "Task 1\nTask 2\nTask 3",
    });
    expect(url).toContain("to-dos=Task%201%0ATask%202%0ATask%203");
  });
});
