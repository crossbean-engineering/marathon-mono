/**
 * Coercers for reading Omni response bodies, which are typed
 * `additionalProperties: true` and therefore arrive as unknown values.
 */

export function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

/**
 * Distinguishes an explicit JSON null from an absent key. The checkout session
 * uses null to mean "the customer has not chosen this yet", which is different
 * information from the field being missing.
 */
export function nullableString(value: unknown): string | null | undefined {
  if (value === null) return null;
  return typeof value === 'string' ? value : undefined;
}
