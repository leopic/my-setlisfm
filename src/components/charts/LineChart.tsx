import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
import { Type } from '@/utils/typography';

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

const LABEL_HEIGHT = Type.caption.lineHeight;
const END_LABEL_FONT_SIZE = Type.caption.fontSize;
const END_LABEL_GAP = 6; // between the last point and its label
const END_LABEL_EDGE = 4; // between the longest label and the chart's right edge
const MIN_RIGHT_PAD = 40;
const MAX_RIGHT_PAD_RATIO = 0.4;
// Width guess per character until the hidden labels report their real width
// (and under Jest, where nothing lays out).
const AVG_CHAR_WIDTH = 0.62 * END_LABEL_FONT_SIZE;
const LABEL_MIN_SPACING = Type.caption.lineHeight;
const LABEL_MIN_Y = 12;
const TOP_PAD = 10; // prevent highest data point from hitting the clip boundary
const EMPTY_LABELS: string[] = [];

export default function LineChart({
  series,
  xLabels = EMPTY_LABELS,
  height = 100,
}: LineChartProps) {
  const colors = useChronicleColors();
  const [chartWidth, setChartWidth] = useState(0);
  const [labelWidths, setLabelWidths] = useState<Record<string, number>>({});
  const totalHeight = height + LABEL_HEIGHT + 4;

  // The right pad holds the end labels, so it grows with the longest one, up to a share
  // of the chart. A label longer than that is cut short with an ellipsis.
  const widthOf = (label: string) => labelWidths[label] ?? label.length * AVG_CHAR_WIDTH;
  const longestLabel = Math.max(0, ...series.map((s) => widthOf(s.label)));
  const rightPad = Math.min(
    Math.max(longestLabel + END_LABEL_GAP + END_LABEL_EDGE, MIN_RIGHT_PAD),
    chartWidth * MAX_RIGHT_PAD_RATIO,
  );
  const labelRoom = rightPad - END_LABEL_GAP - END_LABEL_EDGE;
  const fitLabel = (label: string) => {
    const width = widthOf(label);
    if (width <= labelRoom) return label;
    const keep = Math.max(1, Math.floor((label.length * labelRoom) / width) - 1);
    return `${label.slice(0, keep).trimEnd()}…`;
  };
  const chartW = Math.max(0, chartWidth - rightPad);

  const points = (() => {
    if (chartWidth === 0 || chartW === 0) return [];
    const allVals = series.flatMap((s) => s.data);
    const maxY = Math.max(...allVals, 1);
    const nPts = Math.max(...series.map((s) => s.data.length), 2);
    const drawH = height - TOP_PAD;
    return series.map((s) => ({
      ...s,
      pts: s.data.map((v, i) => ({
        x: (i / (nPts - 1)) * chartW,
        y: TOP_PAD + drawH * (1 - v / maxY),
      })),
    }));
  })();

  const nPts = Math.max(...series.map((s) => s.data.length), 2);

  // Spread end-labels so they don't overlap when lines converge
  const labelYs = (() => {
    if (points.length === 0) return new Map<string, number>();
    const sorted = [...points].sort(
      (a, b) => (a.pts[a.pts.length - 1]?.y ?? 0) - (b.pts[b.pts.length - 1]?.y ?? 0),
    );
    const map = new Map<string, number>();
    let prevY = -Infinity;
    for (const s of sorted) {
      const raw = (s.pts[s.pts.length - 1]?.y ?? 0) + 4;
      const y = Math.max(raw, prevY + LABEL_MIN_SPACING, LABEL_MIN_Y);
      map.set(s.label, y);
      prevY = y;
    }
    return map;
  })();

  return (
    <View
      style={{ width: '100%', height: totalHeight }}
      onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}
    >
      {/* Invisible copies of the end labels, laid out only to measure their width */}
      <View
        style={styles.measure}
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {series.map((s) => (
          <Text
            key={s.label}
            style={styles.measureText}
            // SvgText ignores the system font size, so the copy must too.
            allowFontScaling={false}
            numberOfLines={1}
            onLayout={(e) => {
              const { width } = e.nativeEvent.layout;
              setLabelWidths((prev) =>
                prev[s.label] === width ? prev : { ...prev, [s.label]: width },
              );
            }}
          >
            {s.label}
          </Text>
        ))}
      </View>
      {chartWidth > 0 && (
        <Svg width={chartWidth} height={totalHeight} viewBox={`0 0 ${chartWidth} ${totalHeight}`}>
          <Defs>
            <ClipPath id="lc">
              <Rect x={0} y={0} width={chartW} height={height} />
            </ClipPath>
          </Defs>

          {[0.25, 0.5, 0.75].map((f) => {
            const gy = TOP_PAD + (height - TOP_PAD) * (1 - f);
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
              </G>
            );
          })}

          {/* End dots sit on the clip's right edge, so they're drawn outside it */}
          {points.map((s) => {
            const last = s.pts[s.pts.length - 1];
            return <Circle key={`dot-${s.label}`} cx={last.x} cy={last.y} r={3} fill={s.color} />;
          })}

          {/* End labels rendered outside clip so they appear in the right pad */}
          {points.map((s) => (
            <SvgText
              key={`lbl-${s.label}`}
              x={chartW + 6}
              y={labelYs.get(s.label) ?? (s.pts[s.pts.length - 1]?.y ?? 0) + 4}
              fontSize={END_LABEL_FONT_SIZE}
              fontWeight="500"
              fill={s.color}
            >
              {fitLabel(s.label)}
            </SvgText>
          ))}

          {xLabels.map((lbl, i) => {
            const x = (i / (nPts - 1)) * chartW;
            return (
              <SvgText
                key={lbl}
                x={x}
                y={height + LABEL_HEIGHT}
                fontSize={Type.caption.fontSize}
                fontWeight="400"
                fill={colors.textMuted}
                // The first point sits on the left edge: a centred label would hang half outside.
                textAnchor={i === 0 ? 'start' : 'middle'}
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

const styles = StyleSheet.create({
  measure: { position: 'absolute', top: 0, left: 0, opacity: 0, alignItems: 'flex-start' },
  measureText: { fontSize: END_LABEL_FONT_SIZE, fontWeight: '500' },
});
