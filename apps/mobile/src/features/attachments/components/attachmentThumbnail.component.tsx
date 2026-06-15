import { Image, Pressable, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme.hook';
import { Icon } from '@/components/icon.component';
import { makeAttachmentThumbnailStyles } from './attachmentThumbnail.styles';

export function AttachmentThumbnail({
  uri,
  isImage,
  name,
  onPress,
  onRemove,
}: {
  uri: string;
  isImage: boolean;
  name: string | null;
  onPress: () => void;
  onRemove: () => void;
}) {
  const theme = useTheme();
  const styles = makeAttachmentThumbnailStyles(theme);
  return (
    <Pressable style={styles.tile} onPress={onPress} accessibilityLabel={name ?? 'Attachment'}>
      {isImage ? (
        <Image source={{ uri }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.doc}>
          <Icon name="document" size={28} color={theme.colors.accent} />
          <Text style={styles.docName} numberOfLines={2}>
            {name ?? 'Document'}
          </Text>
        </View>
      )}
      <Pressable style={styles.remove} onPress={onRemove} accessibilityLabel="Remove attachment" hitSlop={8}>
        <Icon name="close" size={14} color={theme.colors.textSecondary} />
      </Pressable>
    </Pressable>
  );
}
