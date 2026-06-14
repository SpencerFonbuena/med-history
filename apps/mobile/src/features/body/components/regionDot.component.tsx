import { Circle, G } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme.hook';
import type { Dot } from '../schemas/bodyMap';

/** One region marker: an enlarged transparent hit area, an optional lit halo, and the dot. */
export function RegionDot({ dot, onPress }: { dot: Dot; onPress: () => void }) {
  const theme = useTheme();
  return (
    <G onPress={onPress}>
      <Circle cx={dot.cx} cy={dot.cy} r={7} fill="transparent" />
      {dot.lit && (
        <Circle cx={dot.cx} cy={dot.cy} r={4.2} fill={theme.colors.accent} fillOpacity={0.22} />
      )}
      <Circle
        cx={dot.cx}
        cy={dot.cy}
        r={dot.lit ? 2.4 : 1.8}
        fill={dot.lit ? theme.colors.accent : theme.colors.dotDim}
      />
    </G>
  );
}
