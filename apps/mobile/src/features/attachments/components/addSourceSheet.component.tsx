import { useState } from 'react';
import { Modal, Platform, Pressable, Text } from 'react-native';
import { useTheme } from '@/hooks/useTheme.hook';
import { Icon, type IconName } from '@/components/icon.component';
import type { AttachmentSource } from '../schemas/attachment.schema';
import { makeAddSourceSheetStyles } from './addSourceSheet.styles';

const OPTIONS: { source: AttachmentSource; label: string; icon: IconName }[] = [
  { source: 'library', label: 'Photo Library', icon: 'image' },
  { source: 'camera', label: 'Take Photo', icon: 'camera' },
  { source: 'files', label: 'Files', icon: 'folder' },
];

export function AddSourceSheet({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (source: AttachmentSource) => void;
}) {
  const theme = useTheme();
  const styles = makeAddSourceSheetStyles(theme);
  const [pending, setPending] = useState<AttachmentSource | null>(null);

  // iOS cannot present a picker (or its permission dialog) while this modal is
  // still dismissing, so close first and fire the selection from onDismiss once
  // dismissal completes. Android has no such restriction and no onDismiss event,
  // so it fires immediately.
  function handlePress(source: AttachmentSource) {
    if (Platform.OS === 'ios') {
      setPending(source);
      onClose();
    } else {
      onClose();
      onSelect(source);
    }
  }

  function handleDismiss() {
    if (pending) {
      const source = pending;
      setPending(null);
      onSelect(source);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      onDismiss={handleDismiss}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Add attachment</Text>
          {OPTIONS.map((opt) => (
            <Pressable key={opt.source} style={styles.option} onPress={() => handlePress(opt.source)}>
              <Icon name={opt.icon} size={22} color={theme.colors.accent} />
              <Text style={styles.optionLabel}>{opt.label}</Text>
            </Pressable>
          ))}
          <Pressable style={styles.cancel} onPress={onClose}>
            <Text style={styles.cancelLabel}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
