export interface CliResult {
  ok: boolean;
  data?: unknown;
  error?: string;
  command?: string;
}

export function success(data: unknown, command?: string): never {
  const result: CliResult = { ok: true, data };
  if (command) result.command = command;
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exit(0);
}

export function error(message: string, command?: string): never {
  const result: CliResult = { ok: false, error: message };
  if (command) result.command = command;
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exit(1);
}

export function filterFields(
  tasks: Record<string, unknown>[],
  fields: string | undefined,
): Record<string, unknown>[] {
  if (!fields) return tasks;
  const keys = fields.split(",").map((f) => f.trim());
  return tasks.map((task) => {
    const filtered: Record<string, unknown> = {};
    for (const key of keys) {
      if (key in task) filtered[key] = task[key];
    }
    return filtered;
  });
}
