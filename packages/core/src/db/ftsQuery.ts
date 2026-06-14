/** Turn raw user text into an FTS5 prefix MATCH query: alnum tokens, each a prefix, AND-ed. */
export function buildFtsQuery(input: string): string {
  const tokens = input.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 0);
  if (tokens.length === 0) return '';
  return tokens.map((t) => `${t}*`).join(' ');
}
