import type { EntryType } from '@med-history/core';

export const entriesKeys = {
  all: ['entries'] as const,
  list: (profileId: string, code: string, type: EntryType) =>
    [...entriesKeys.all, 'list', profileId, code, type] as const,
  detail: (id: string) => [...entriesKeys.all, 'detail', id] as const,
};
