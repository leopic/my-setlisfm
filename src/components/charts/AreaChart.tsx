import { useMemo } from 'react';
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

  const VW = 1000;
  const totalHeight = height + LABEL_HEIGHT + 4;
  const max = useMemo(() => Math.max(...data, 1), [data]);
  const n = data.length;

  const pts = useMemo(
    () =>
      data.map((v, i) => ({
        x: n <= 1 ? VW / 2 : (i / (n - 1)) * VW,
        y: height - (v / max) * height,
      })),
    [data, height, max, n],
  );

  const linePts = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const fillPts = `0,${height} ${linePts} ${VW},${height}`;

  const annotated = milestones.map((m, idx) => {
    const pt = pts[Math.min(m.index, pts.length - 1)];
    return { ...m, pt, above: idx % 2 === 0 };
  });

  return (
    <View style={{ width: '100%', height: totalHeight }}>
      <Svg
        width="100%"
        height={totalHeight}
        viewBox={`0 0 ${VW} ${totalHeight}`}
        preserveAspectRatio="none"
      >
        {/* Fill area */}
        <Polygon points={fillPts} fill={lineColor} opacity={0.08} />

        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((f) => {
          const gy = height - f * height;
          return (
            <Line key={f} x1={0} y1={gy} x2={VW} y2={gy} stroke={colors.border} strokeWidth={1} />
          );
        })}

        {/* Growth line */}
        <Polyline
          points={linePts}
          fill="none"
          stroke={lineColor}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Milestone annotations */}
        {annotated.map((m) => {
          const labelY = m.above ? m.pt.y - 10 : m.pt.y + 22;
          return (
            <G key={m.label}>
              <Circle
                cx={m.pt.x}
                cy={m.pt.y}
                r={5}
                fill={lineColor}
                stroke={colors.background}
                strokeWidth={2}
              />
              <SvgText
                x={m.pt.x}
                y={labelY}
                fontSize={22}
                fontWeight="700"
                fill={lineColor}
                textAnchor="middle"
              >
                {m.label}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}
