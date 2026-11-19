import { fireEvent, render, screen } from '@testing-library/react-native';
import LineChart from '@/components/charts/LineChart';

const series = [{ label: 'Radiohead', color: '#000', data: [1, 2, 3] }];

// Year labels sit under their points; the first point is on the chart's left edge.
async function renderChart() {
  await render(<LineChart series={series} xLabels={["'09", "'10", "'11"]} />);
  const frame = screen.container.queryAll((n) => typeof n.props.onLayout === 'function')[0];
  await fireEvent(frame, 'layout', { nativeEvent: { layout: { width: 300, height: 120 } } });
}

// SVG text renders as RNSVGText (anchor in `font.textAnchor`) holding an RNSVGTSpan
// (label in `content`); neither is a host Text, so text queries can't see them.
function anchorOf(label: string) {
  const texts = screen.container.queryAll((n) => n.props.font?.textAnchor !== undefined);
  const match = texts.find((n) => n.queryAll((c) => c.props.content === label).length > 0);
  return match?.props.font.textAnchor;
}

it('keeps the first year label inside the chart', async () => {
  await renderChart();
  expect(anchorOf("'09")).toBe('start');
});

it('centres the other year labels under their points', async () => {
  await renderChart();
  expect(anchorOf("'10")).toBe('middle');
  expect(anchorOf("'11")).toBe('middle');
});
