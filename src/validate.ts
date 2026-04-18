import { error } from "./output.ts";

const UUID_PATTERN = /^[a-zA-Z0-9_-]{22,}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const WHEN_VALUES = new Set([
  "today",
  "tomorrow",
  "evening",
  "anytime",
  "someday",
]);

export function validateUuid(id: string, command: string): void {
  if (!UUID_PATTERN.test(id)) {
    error(
      `Invalid UUID: "${id}". Things UUIDs are 22+ alphanumeric characters.`,
      command,
    );
  }
  // Reject path traversals and control characters
  if (id.includes("..") || id.includes("/") || id.includes("\\")) {
    error(`Invalid UUID: contains path traversal characters.`, command);
  }
  if (/[\x00-\x1f]/.test(id)) {
    error(`Invalid UUID: contains control characters.`, command);
  }
}

export function validateWhen(when: string, command: string): void {
  if (WHEN_VALUES.has(when)) return;
  if (DATE_PATTERN.test(when)) {
    const parts = when.split("-").map(Number);
    const year = parts[0] ?? 0;
    const month = parts[1] ?? 0;
    const day = parts[2] ?? 0;
    if (year < 2000 || year > 2100) {
      error(`Invalid when date: year ${year} out of range.`, command);
    }
    if (month < 1 || month > 12) {
      error(`Invalid when date: month ${month} out of range.`, command);
    }
    if (day < 1 || day > 31) {
      error(`Invalid when date: day ${day} out of range.`, command);
    }
    return;
  }
  error(
    `Invalid when value: "${when}". Must be one of: ${[...WHEN_VALUES].join(", ")}, or YYYY-MM-DD.`,
    command,
  );
}

export function validateDate(date: string, field: string, command: string): void {
  if (!DATE_PATTERN.test(date)) {
    error(`Invalid ${field}: "${date}". Must be YYYY-MM-DD.`, command);
  }
}

export function validateTitle(title: string, command: string): void {
  if (!title || title.trim().length === 0) {
    error("Title is required and cannot be empty.", command);
  }
  if (title.length > 4000) {
    error(
      `Title too long: ${title.length} characters (max 4000).`,
      command,
    );
  }
}
