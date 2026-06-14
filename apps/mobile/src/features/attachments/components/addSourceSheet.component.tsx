import { Modal, Pressable, Text, View } from 'react-native';
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
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Add attachment</Text>
          {OPTIONS.map((opt) => (
            <Pressable key={opt.source} style={styles.option} onPress={() => onSelect(opt.source)}>
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
