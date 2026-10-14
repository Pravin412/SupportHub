type SearchMatch = { contains: string; mode: "insensitive" };
export type SearchField<T> = (match: SearchMatch) => T;

export function buildSearchFilter<T>(query: string | undefined, fields: readonly SearchField<T>[]): { OR?: T[] } {
  const contains = query?.trim();
  if (!contains || fields.length === 0) return {};
  const match: SearchMatch = { contains, mode: "insensitive" };
  return { OR: fields.map((field) => field(match)) };
}
