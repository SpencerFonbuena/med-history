import { EmptyState } from '@/components/emptyState.component';

export function ProfilesEmptyState({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon="people"
      title="No profiles yet"
      subtitle="Add a profile to start tracking medical history on this device."
      actionLabel={onAdd ? 'Add profile' : undefined}
      onAction={onAdd}
    />
  );
}
