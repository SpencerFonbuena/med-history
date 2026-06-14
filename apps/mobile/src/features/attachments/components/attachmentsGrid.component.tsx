import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme.hook';
import { Icon } from '@/components/icon.component';
import { AttachmentThumbnail } from './attachmentThumbnail.component';
import { makeAttachmentsGridStyles } from './attachmentsGrid.styles';

export interface GridItem {
  key: string;
  uri: string;
  isImage: boolean;
  name: string | null;
}

export function AttachmentsGrid({
  items,
  onAdd,
  onOpen,
  onRemove,
}: {
  items: GridItem[];
  onAdd: () => void;
  onOpen: (item: GridItem) => void;
  onRemove: (item: GridItem) => void;
}) {
  const theme = useTheme();
  const styles = makeAttachmentsGridStyles(theme);
  return (
    <View>
      <Text style={styles.label}>Attachments</Text>
      <View style={styles.grid}>
        {items.map((item) => (
          <AttachmentThumbnail
            key={item.key}
            uri={item.uri}
            isImage={item.isImage}
            name={item.name}
            onPress={() => onOpen(item)}
            onRemove={() => onRemove(item)}
          />
        ))}
        <Pressable style={styles.addTile} onPress={onAdd} accessibilityLabel="Add attachment">
          <Icon name="add" size={24} color={theme.colors.accent} />
          <Text style={styles.addLabel}>Add</Text>
        </Pressable>
      </View>
    </View>
  );
}
