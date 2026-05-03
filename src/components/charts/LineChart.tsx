import { useMemo } from 'react';
import { View } from 'react-native';
import Svg, {
  Polyline,
  Circle,
  Line,
  Text as SvgText,
  G,
  Defs,
  ClipPath,
  Rect,
} from 'react-native-svg';
import { useChronicleColors } from '@/utils/colors';

export interface LineSeries {
  label: string;
  color: string;
  /** Cumulative values in chronological order */
  data: number[];
}

interface LineChartProps {
  series: LineSeries[];
  xLabels?: string[];
  height?: number;
}

const LABEL_HEIGHT = 14;
const RIGHT_PAD = 90;

export default function LineChart({ series, xLabels = [], height = 100 }: LineChartProps) {
  const colors = useChronicleColors();

  const VW = 1000;
  const chartW = VW - RIGHT_PAD;
  const totalHeight = height + LABEL_HEIGHT + 4;

  const { points } = useMemo(() => {
    const allVals = series.flatMap((s) => s.data);
    const maxY = Math.max(...allVals, 1);
    const nPts = Math.max(...series.map((s) => s.data.length), 2);

    const points = series.map((s) => ({
      ...s,
      pts: s.data.map((v, i) => ({
        x: (i / (nPts - 1)) * chartW,
        y: height - (v / maxY) * height,
      })),
    }));
    return { points, maxY };
  }, [series, height, chartW]);

  const nPts = Math.max(...series.map((s) => s.data.length), 2);

  return (
    <View style={{ width: '100%', height: totalHeight }}>
      <Svg
        width="100%"
        height={totalHeight}
        viewBox={`0 0 ${VW} ${totalHeight}`}
        preserveAspectRatio="none"
      >
        <Defs>
          <ClipPath id="lc">
            <Rect x={0} y={0} width={chartW} height={height} />
          </ClipPath>
        </Defs>

        {/* Subtle grid */}
        {[0.25, 0.5, 0.75].map((f) => {
          const gy = height - f * height;
          return (
            <Line
              key={f}
              x1={0}
              y1={gy}
              x2={chartW}
              y2={gy}
              stroke={colors.border}
              strokeWidth={1}
            />
          );
        })}

        {/* Series */}
        {points.map((s) => {
          const ptStr = s.pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
          const last = s.pts[s.pts.length - 1];
          return (
            <G key={s.label} clipPath="url(#lc)">
              <Polyline
                points={ptStr}
                fill="none"
                stroke={s.color}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Circle cx={last.x} cy={last.y} r={4} fill={s.color} />
            </G>
          );
        })}

        {/* End labels (outside clip) */}
        {points.map((s) => {
          const last = s.pts[s.pts.length - 1];
          return (
            <SvgText
              key={`lbl-${s.label}`}
              x={chartW + 8}
              y={last.y + 5}
              fontSize={22}
              fontWeight="500"
              fill={s.color}
            >
              {s.label.split(' ')[0]}
            </SvgText>
          );
        })}

        {/* X-axis labels — every other to avoid crowding */}
        {xLabels.map((lbl, i) => {
          if (i % 2 !== 0) return null;
          const x = (i / (nPts - 1)) * chartW;
          return (
            <SvgText
              key={lbl}
              x={x}
              y={height + LABEL_HEIGHT}
              fontSize={22}
              fontWeight="400"
              fill={colors.textMuted}
              textAnchor="middle"
            >
              {lbl}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}
