export const attachmentKeys = {
  all: ['attachments'] as const,
  byEntry: (entryId: string) => [...attachmentKeys.all, 'entry', entryId] as const,
};
