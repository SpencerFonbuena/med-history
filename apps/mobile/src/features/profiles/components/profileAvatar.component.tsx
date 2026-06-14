import Svg, { Circle, Path } from 'react-native-svg';
import type { Sex } from '@med-history/core';
import { useTheme } from '@/hooks/useTheme.hook';

/** Head-and-shoulders silhouette in a circle; female adds a hairline. Scales with figureScale. */
export function ProfileAvatar({ sex, base = 44 }: { sex: Sex; base?: number }) {
  const theme = useTheme();
  const size = Math.round(base * theme.figureScale);
  const fg = theme.colors.textSecondary;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={12} fill={theme.colors.bgSelected} />
      <Circle cx={12} cy={9} r={3.2} fill={fg} />
      <Path d="M5.5 20c0-3.6 2.9-5.8 6.5-5.8s6.5 2.2 6.5 5.8" stroke={fg} strokeWidth={1.5} fill="none" />
      {sex === 'female' && <Path d="M8.5 8.2c1-2.2 6-2.2 7 0" stroke={fg} strokeWidth={1.5} fill="none" />}
    </Svg>
  );
}
