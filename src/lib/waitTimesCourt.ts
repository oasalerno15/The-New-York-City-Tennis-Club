/** Map legacy DB values to the canonical key used in UI + new inserts. */
export function normalizeCourtNameFromDb(name: string): string {
  if (name === 'Brian Watkins Courts') return 'Brian Watkins Tennis Courts';
  return name;
}
