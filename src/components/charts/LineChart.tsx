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
  /** Values in chronological order — one per x position */
  data: number[];
}

interface LineChartProps {
  series: LineSeries[];
  xLabels?: string[];
  height?: number;
}

const LABEL_HEIGHT = 14;
const RIGHT_PAD = 80; // space for end labels

export default function LineChart({ series, xLabels = [], height = 100 }: LineChartProps) {
  const colors = useChronicleColors();

  const VW = 1000;
  const chartW = VW - RIGHT_PAD;
  const totalHeight = height + LABEL_HEIGHT + 4;

  const { points, maxY } = useMemo(() => {
    const allVals = series.flatMap((s) => s.data);
    const maxY = Math.max(...allVals, 1);
    const nPts = Math.max(...series.map((s) => s.data.length));

    const points = series.map((s) => ({
      ...s,
      pts: s.data.map((v, i) => ({
        x: nPts === 1 ? chartW / 2 : (i / (nPts - 1)) * chartW,
        y: height - (v / maxY) * height,
      })),
    }));
    return { points, maxY };
  }, [series, height, chartW]);

  const nPts = points[0]?.pts.length ?? 0;
  const gridValues = [Math.round(maxY * 0.25), Math.round(maxY * 0.5), Math.round(maxY * 0.75)];

  return (
    <View style={{ width: '100%', height: totalHeight }}>
      <Svg
        width="100%"
        height={totalHeight}
        viewBox={`0 0 ${VW} ${totalHeight}`}
        preserveAspectRatio="none"
      >
        <Defs>
          <ClipPath id="lc-clip">
            <Rect x={0} y={0} width={chartW} height={height} />
          </ClipPath>
        </Defs>

        {/* Grid lines */}
        {gridValues.map((v) => {
          const gy = height - (v / maxY) * height;
          return (
            <Line
              key={v}
              x1={0}
              y1={gy}
              x2={chartW}
              y2={gy}
              stroke={colors.border}
              strokeWidth={1}
            />
          );
        })}

        {/* Series lines */}
        {points.map((s) => {
          const ptStr = s.pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
          const lastPt = s.pts[s.pts.length - 1];
          return (
            <G key={s.label} clipPath="url(#lc-clip)">
              <Polyline
                points={ptStr}
                fill="none"
                stroke={s.color}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Circle cx={lastPt.x} cy={lastPt.y} r={4} fill={s.color} />
            </G>
          );
        })}

        {/* End labels (outside clip) */}
        {points.map((s) => {
          const lastPt = s.pts[s.pts.length - 1];
          return (
            <SvgText
              key={`lbl-${s.label}`}
              x={chartW + 8}
              y={lastPt.y + 5}
              fontSize={22}
              fontWeight="500"
              fill={s.color}
            >
              {s.label.split(' ')[0]}
            </SvgText>
          );
        })}

        {/* X-axis labels */}
        {xLabels.map((lbl, i) => {
          if (nPts <= 1) return null;
          const x = (i / (nPts - 1)) * chartW;
          if (i % 2 !== 0) return null;
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
