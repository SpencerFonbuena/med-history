import type { ReactNode } from 'react';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme.hook';
import { SILHOUETTE_PATH, BODY_VIEWBOX } from '../data/silhouette';

/** The square figure canvas: the outline path plus any dot children, sized by the caller. */
export function BodySilhouette({ size, children }: { size: number; children: ReactNode }) {
  const theme = useTheme();
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${BODY_VIEWBOX} ${BODY_VIEWBOX}`}>
      <Path
        d={SILHOUETTE_PATH}
        fill="none"
        stroke={theme.colors.figureStroke}
        strokeWidth={0.9}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {children}
    </Svg>
  );
}
