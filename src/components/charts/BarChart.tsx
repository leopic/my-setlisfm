import { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Rect, Text as SvgText, G } from 'react-native-svg';
import { useChronicleColors } from '@/utils/colors';

interface BarChartProps {
  data: Array<{ label: string; value: number }>;
  color?: string;
  height?: number;
  showLabels?: boolean;
}

const LABEL_HEIGHT = 14;

export default function BarChart({ data, color, height = 80, showLabels = true }: BarChartProps) {
  const colors = useChronicleColors();
  const barColor = color ?? colors.accent;
  const totalHeight = height + (showLabels ? LABEL_HEIGHT + 4 : 0);

  const max = useMemo(() => Math.max(...data.map((d) => d.value), 1), [data]);

  if (!data.length) return null;

  const n = data.length;
  const VW = 1000;
  const gap = Math.max(4, VW * 0.012);
  const barW = (VW - gap * (n - 1)) / n;

  return (
    <View style={{ width: '100%', height: totalHeight }}>
      <Svg
        width="100%"
        height={totalHeight}
        viewBox={`0 0 ${VW} ${totalHeight}`}
        preserveAspectRatio="none"
      >
        <G>
          {data.map((d, i) => {
            const ratio = d.value / max;
            const bx = i * (barW + gap);
            const bh = Math.max(3, ratio * height);
            const by = height - bh;
            const opacity = ratio === 1 ? 1 : ratio > 0.5 ? 0.55 : 0.25;
            return (
              <G key={i}>
                <Rect
                  x={bx}
                  y={by}
                  width={barW}
                  height={bh}
                  rx={3}
                  fill={barColor}
                  opacity={opacity}
                />
                {showLabels && (
                  <SvgText
                    x={bx + barW / 2}
                    y={height + LABEL_HEIGHT}
                    fontSize={barW > 30 ? 22 : 18}
                    fontWeight="400"
                    fill={colors.textMuted}
                    textAnchor="middle"
                  >
                    {d.label}
                  </SvgText>
                )}
              </G>
            );
          })}
        </G>
      </Svg>
    </View>
  );
}
