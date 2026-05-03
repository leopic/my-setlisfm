import { useState, useMemo } from 'react';
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
const RIGHT_PAD = 50;

export default function LineChart({ series, xLabels = [], height = 100 }: LineChartProps) {
  const colors = useChronicleColors();
  const [chartWidth, setChartWidth] = useState(0);
  const totalHeight = height + LABEL_HEIGHT + 4;
  const chartW = Math.max(0, chartWidth - RIGHT_PAD);

  const points = useMemo(() => {
    if (chartWidth === 0 || chartW === 0) return [];
    const allVals = series.flatMap((s) => s.data);
    const maxY = Math.max(...allVals, 1);
    const nPts = Math.max(...series.map((s) => s.data.length), 2);
    return series.map((s) => ({
      ...s,
      pts: s.data.map((v, i) => ({
        x: (i / (nPts - 1)) * chartW,
        y: height - (v / maxY) * height,
      })),
    }));
  }, [series, height, chartW, chartWidth]);

  const nPts = Math.max(...series.map((s) => s.data.length), 2);

  return (
    <View
      style={{ width: '100%', height: totalHeight }}
      onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}
    >
      {chartWidth > 0 && (
        <Svg width={chartWidth} height={totalHeight} viewBox={`0 0 ${chartWidth} ${totalHeight}`}>
          <Defs>
            <ClipPath id="lc">
              <Rect x={0} y={0} width={chartW} height={height} />
            </ClipPath>
          </Defs>

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

          {points.map((s) => {
            const ptStr = s.pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
            const last = s.pts[s.pts.length - 1];
            return (
              <G key={s.label} clipPath="url(#lc)">
                <Polyline
                  points={ptStr}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Circle cx={last.x} cy={last.y} r={3} fill={s.color} />
              </G>
            );
          })}

          {/* End labels rendered outside clip so they appear in the right pad */}
          {points.map((s) => {
            const last = s.pts[s.pts.length - 1];
            return (
              <SvgText
                key={`lbl-${s.label}`}
                x={chartW + 6}
                y={last.y + 4}
                fontSize={10}
                fontWeight="500"
                fill={s.color}
              >
                {s.label.split(' ')[0]}
              </SvgText>
            );
          })}

          {xLabels.map((lbl, i) => {
            if (i % 2 !== 0) return null;
            const x = (i / (nPts - 1)) * chartW;
            return (
              <SvgText
                key={lbl}
                x={x}
                y={height + LABEL_HEIGHT}
                fontSize={10}
                fontWeight="400"
                fill={colors.textMuted}
                textAnchor="middle"
              >
                {lbl}
              </SvgText>
            );
          })}
        </Svg>
      )}
    </View>
  );
}
