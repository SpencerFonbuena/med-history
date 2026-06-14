import { useState } from 'react';
import { Alert } from 'react-native';
import { useEntryAttachments } from '../hooks/useEntryAttachments.hook';
import { useAttachmentActions } from '../hooks/useAttachmentActions.hook';
import { AttachmentsGrid, type GridItem } from '../components/attachmentsGrid.component';
import { AddSourceSheet } from '../components/addSourceSheet.component';
import { AttachmentViewerModal } from '../components/attachmentViewerModal.component';
import type { AttachmentSource } from '../schemas/attachment.schema';

/** Edit-flow attachments: add/remove persist immediately against an existing entry. */
export function LiveAttachments({ profileId, entryId }: { profileId: string; entryId: string }) {
  const { attachments, add, remove } = useEntryAttachments(profileId, entryId);
  const { pick, open } = useAttachmentActions();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [viewerUri, setViewerUri] = useState<string | null>(null);

  const items: GridItem[] = attachments.map((a) => ({ key: a.id, uri: a.uri, isImage: a.isImage, name: a.originalFilename }));

  // The sheet closes itself before invoking this (see AddSourceSheet), so the
  // picker presents cleanly on iOS.
  async function choose(source: AttachmentSource) {
    try {
      const picked = await pick(source);
      if (picked) await add(picked);
    } catch (e) {
      Alert.alert('Could not add attachment', (e as Error).message);
    }
  }

  function openItem(item: GridItem) {
    const a = attachments.find((x) => x.id === item.key);
    if (!a) return;
    if (a.isImage) setViewerUri(a.uri);
    else void open(a.uri, a.mimeType).catch((e) => Alert.alert('Could not open file', (e as Error).message));
  }

  return (
    <>
      <AttachmentsGrid
        items={items}
        onAdd={() => setSheetOpen(true)}
        onOpen={openItem}
        onRemove={(item) => {
          const a = attachments.find((x) => x.id === item.key);
          if (a) void remove(a).catch((e) => Alert.alert('Could not remove', (e as Error).message));
        }}
      />
      <AddSourceSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} onSelect={choose} />
      <AttachmentViewerModal uri={viewerUri} onClose={() => setViewerUri(null)} />
    </>
  );
}
