export const bodyKeys = {
  all: ['body'] as const,
  map: (profileId: string) => [...bodyKeys.all, 'map', profileId] as const,
};
