// Joins class names and skips empty values, so we don't need an extra library.
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}