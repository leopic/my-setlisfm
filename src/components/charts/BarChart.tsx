import { useState, useMemo } from 'react';
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
const GAP = 3;

export default function BarChart({ data, color, height = 80, showLabels = true }: BarChartProps) {
  const colors = useChronicleColors();
  const barColor = color ?? colors.accent;
  const totalHeight = height + (showLabels ? LABEL_HEIGHT + 4 : 0);
  const [chartWidth, setChartWidth] = useState(0);

  const max = useMemo(() => Math.max(...data.map((d) => d.value), 1), [data]);

  if (!data.length) return null;

  const n = data.length;
  const labelStride = n > 14 ? 2 : 1;
  const barW = chartWidth > 0 ? (chartWidth - GAP * (n - 1)) / n : 0;

  return (
    <View
      style={{ width: '100%', height: totalHeight }}
      onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}
    >
      {chartWidth > 0 && (
        <Svg width={chartWidth} height={totalHeight} viewBox={`0 0 ${chartWidth} ${totalHeight}`}>
          <G>
            {data.map((d, i) => {
              const ratio = d.value / max;
              const bx = i * (barW + GAP);
              const bh = Math.max(2, ratio * height);
              const by = height - bh;
              const opacity = ratio === 1 ? 1 : ratio > 0.5 ? 0.55 : 0.25;
              return (
                <G key={i}>
                  <Rect
                    x={bx}
                    y={by}
                    width={barW}
                    height={bh}
                    rx={2}
                    fill={barColor}
                    opacity={opacity}
                  />
                  {showLabels && i % labelStride === 0 && (
                    <SvgText
                      x={bx + barW / 2}
                      y={height + LABEL_HEIGHT}
                      fontSize={10}
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
      )}
    </View>
  );
}
