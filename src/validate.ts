import { error, hardenId } from "@howells/cli";

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
	hardenId(id, command, { label: "UUID" });
	if (!UUID_PATTERN.test(id)) {
		error(
			`Invalid UUID: "${id}". Things UUIDs are 22+ alphanumeric characters.`,
			command,
		);
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

export function validateDate(
	date: string,
	field: string,
	command: string,
): void {
	if (!DATE_PATTERN.test(date)) {
		error(`Invalid ${field}: "${date}". Must be YYYY-MM-DD.`, command);
	}
}
