import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme.hook';

// Base size 64; scales with the active theme's figureScale.
export function PersonFigure({ base = 64 }: { base?: number }) {
  const theme = useTheme();
  const size = Math.round(base * theme.figureScale);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={7} r={3.2} fill={theme.colors.textPrimary} />
      <Path d="M5 21c0-4 3-6.5 7-6.5S19 17 19 21" stroke={theme.colors.textPrimary} strokeWidth={1.5} fill="none" />
    </Svg>
  );
}
