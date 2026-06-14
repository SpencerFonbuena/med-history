import { useState } from 'react';
import { Alert } from 'react-native';
import { useAttachmentActions } from '../hooks/useAttachmentActions.hook';
import { isImage } from '../services/providers/attachmentPaths.provider';
import { AttachmentsGrid, type GridItem } from '../components/attachmentsGrid.component';
import { AddSourceSheet } from '../components/addSourceSheet.component';
import { AttachmentViewerModal } from '../components/attachmentViewerModal.component';
import type { AttachmentSource, PendingPick } from '../schemas/attachment.schema';

/** Create-flow attachments: picks are held in memory and committed when the entry is saved. */
export function StagedAttachments({
  picks,
  onChange,
}: {
  picks: PendingPick[];
  onChange: (picks: PendingPick[]) => void;
}) {
  const { pick, open } = useAttachmentActions();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [viewerUri, setViewerUri] = useState<string | null>(null);

  const items: GridItem[] = picks.map((p, i) => ({
    key: `${i}-${p.uri}`,
    uri: p.uri,
    isImage: isImage(p.mimeType),
    name: p.name,
  }));

  async function choose(source: AttachmentSource) {
    setSheetOpen(false);
    try {
      const picked = await pick(source);
      if (picked) onChange([...picks, picked]);
    } catch (e) {
      Alert.alert('Could not add attachment', (e as Error).message);
    }
  }

  function openItem(item: GridItem) {
    const p = picks.find((x) => x.uri === item.uri);
    if (!p) return;
    if (item.isImage) setViewerUri(item.uri);
    else void open(p.uri, p.mimeType).catch((e) => Alert.alert('Could not open file', (e as Error).message));
  }

  return (
    <>
      <AttachmentsGrid
        items={items}
        onAdd={() => setSheetOpen(true)}
        onOpen={openItem}
        onRemove={(item) => onChange(picks.filter((x) => x.uri !== item.uri))}
      />
      <AddSourceSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} onSelect={choose} />
      <AttachmentViewerModal uri={viewerUri} onClose={() => setViewerUri(null)} />
    </>
  );
}
