export const medicationKeys = {
  all: ['medications'] as const,
  seed: ['medications', 'seed'] as const,
  search: (query: string) => ['medications', 'search', query] as const,
};
