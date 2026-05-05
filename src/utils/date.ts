export function formatDate(value: Date | string | number | undefined): string {
  if (!value) return "unknown date";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "unknown date";
  return date.toISOString().replace("T", " ").slice(0, 16);
}

export function basenamePath(pathValue: string | undefined): string {
  if (!pathValue) return "unknown cwd";
  return pathValue.replace(/[\\/]+$/, "").split(/[\\/]/).pop() || pathValue;
}
