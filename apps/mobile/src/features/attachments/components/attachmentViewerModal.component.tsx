import { Image, Modal, Pressable } from 'react-native';
import { Icon } from '@/components/icon.component';
import { useTheme } from '@/hooks/useTheme.hook';
import { makeAttachmentViewerStyles } from './attachmentViewerModal.styles';

export function AttachmentViewerModal({
  uri,
  onClose,
}: {
  uri: string | null;
  onClose: () => void;
}) {
  const theme = useTheme();
  const styles = makeAttachmentViewerStyles(theme);
  return (
    <Modal visible={uri !== null} transparent={false} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        {uri && <Image source={{ uri }} style={styles.image} resizeMode="contain" />}
        <Pressable style={styles.close} onPress={onClose} accessibilityLabel="Close">
          <Icon name="close" size={22} color="#ffffff" />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
