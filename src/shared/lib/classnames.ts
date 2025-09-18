// Tiny helper to combine Tailwind class strings while skipping falsy values.
export function cn(
  ...values: Array<string | false | null | undefined>
): string {
  return values.filter(Boolean).join(" ");
}
