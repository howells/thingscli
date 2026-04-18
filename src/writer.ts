import { execSync } from "node:child_process";

export interface AddOptions {
  title: string;
  when?: string;
  deadline?: string;
  tags?: string;
  list?: string;
  heading?: string;
  notes?: string;
  checklist?: string;
  authToken?: string;
}

export interface UpdateOptions {
  id: string;
  title?: string;
  when?: string;
  deadline?: string;
  addTags?: string;
  notes?: string;
  appendNotes?: string;
  completed?: boolean;
  cancelled?: boolean;
  authToken: string;
}

function encode(value: string): string {
  return encodeURIComponent(value);
}

function buildUrl(command: string, params: Record<string, string>): string {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${k}=${encode(v)}`)
    .join("&");
  return `things:///${command}?${qs}`;
}

function openUrl(url: string): void {
  execSync(`open "${url}"`, { stdio: "ignore" });
}

export function add(opts: AddOptions): void {
  const params: Record<string, string> = { title: opts.title };
  if (opts.authToken) params["auth-token"] = opts.authToken;
  if (opts.when) params.when = opts.when;
  if (opts.deadline) params.deadline = opts.deadline;
  if (opts.tags) params.tags = opts.tags;
  if (opts.list) params.list = opts.list;
  if (opts.heading) params.heading = opts.heading;
  if (opts.notes) params.notes = opts.notes;
  if (opts.checklist) params["checklist-items"] = opts.checklist;
  openUrl(buildUrl("add", params));
}

export function update(opts: UpdateOptions): void {
  const params: Record<string, string> = {
    "auth-token": opts.authToken,
    id: opts.id,
  };
  if (opts.title) params.title = opts.title;
  if (opts.when) params.when = opts.when;
  if (opts.deadline) params.deadline = opts.deadline;
  if (opts.addTags) params["add-tags"] = opts.addTags;
  if (opts.notes) params.notes = opts.notes;
  if (opts.appendNotes) params["append-notes"] = opts.appendNotes;
  if (opts.completed) params.completed = "true";
  if (opts.cancelled) params.canceled = "true";
  openUrl(buildUrl("update", params));
}

export function complete(id: string, authToken: string): void {
  update({ id, completed: true, authToken });
}

export function addProject(opts: {
  title: string;
  when?: string;
  deadline?: string;
  tags?: string;
  area?: string;
  todos?: string[];
  notes?: string;
  authToken?: string;
}): void {
  const params: Record<string, string> = { title: opts.title };
  if (opts.authToken) params["auth-token"] = opts.authToken;
  if (opts.when) params.when = opts.when;
  if (opts.deadline) params.deadline = opts.deadline;
  if (opts.tags) params.tags = opts.tags;
  if (opts.area) params.area = opts.area;
  if (opts.notes) params.notes = opts.notes;
  if (opts.todos) params["to-dos"] = opts.todos.join("\n");
  openUrl(buildUrl("add-project", params));
}
