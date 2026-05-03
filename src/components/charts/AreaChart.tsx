import { useState, useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Polyline, Polygon, Circle, Line, Text as SvgText, G } from 'react-native-svg';
import { useChronicleColors } from '@/utils/colors';

export interface Milestone {
  /** Index into the data array */
  index: number;
  label: string;
}

interface AreaChartProps {
  /** Cumulative values — one per year, ascending */
  data: number[];
  milestones?: Milestone[];
  color?: string;
  height?: number;
}

const LABEL_HEIGHT = 14;

export default function AreaChart({ data, milestones = [], color, height = 110 }: AreaChartProps) {
  const colors = useChronicleColors();
  const lineColor = color ?? colors.accent;
  const [chartWidth, setChartWidth] = useState(0);
  const totalHeight = height + LABEL_HEIGHT + 4;

  const max = useMemo(() => Math.max(...data, 1), [data]);
  const n = data.length;

  const pts = useMemo(() => {
    if (chartWidth === 0) return [];
    return data.map((v, i) => ({
      x: n <= 1 ? chartWidth / 2 : (i / (n - 1)) * chartWidth,
      y: height - (v / max) * height,
    }));
  }, [data, height, max, n, chartWidth]);

  const linePts = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const fillPts = `0,${height} ${linePts} ${chartWidth},${height}`;

  const annotated = milestones.map((m, idx) => {
    const pt = pts[Math.min(m.index, pts.length - 1)];
    return { ...m, pt, above: idx % 2 === 0 };
  });

  return (
    <View
      style={{ width: '100%', height: totalHeight }}
      onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}
    >
      {chartWidth > 0 && pts.length > 0 && (
        <Svg width={chartWidth} height={totalHeight} viewBox={`0 0 ${chartWidth} ${totalHeight}`}>
          <Polygon points={fillPts} fill={lineColor} opacity={0.08} />

          {[0.25, 0.5, 0.75].map((f) => {
            const gy = height - f * height;
            return (
              <Line
                key={f}
                x1={0}
                y1={gy}
                x2={chartWidth}
                y2={gy}
                stroke={colors.border}
                strokeWidth={1}
              />
            );
          })}

          <Polyline
            points={linePts}
            fill="none"
            stroke={lineColor}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {annotated.map((m) => {
            if (!m.pt) return null;
            const labelY = m.above ? m.pt.y - 8 : m.pt.y + 16;
            const textAnchor =
              m.pt.x < chartWidth * 0.1 ? 'start' : m.pt.x > chartWidth * 0.9 ? 'end' : 'middle';
            return (
              <G key={m.label}>
                <Circle
                  cx={m.pt.x}
                  cy={m.pt.y}
                  r={4}
                  fill={lineColor}
                  stroke={colors.background}
                  strokeWidth={2}
                />
                <SvgText
                  x={m.pt.x}
                  y={labelY}
                  fontSize={12}
                  fontWeight="700"
                  fill={lineColor}
                  textAnchor={textAnchor}
                >
                  {m.label}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      )}
    </View>
  );
}
