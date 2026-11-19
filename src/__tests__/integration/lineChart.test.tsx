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
function svgTextOf(label: string) {
  const texts = screen.container.queryAll((n) => n.type === 'RNSVGText');
  return texts.find((n) => n.queryAll((c) => c.props.content === label).length > 0);
}

function anchorOf(label: string) {
  return svgTextOf(label)?.props.font.textAnchor;
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

describe('end labels and dots', () => {
  const CHART_WIDTH = 300;

  // End labels are measured by invisible RN Text copies; Jest has no layout, so report one.
  async function renderWithEndLabel(label: string, measuredWidth: number) {
    await render(
      <LineChart series={[{ label, color: '#000', data: [1, 2] }]} xLabels={["'24", "'25"]} />,
    );
    const frame = screen.container.queryAll((n) => typeof n.props.onLayout === 'function')[0];
    await fireEvent(frame, 'layout', {
      nativeEvent: { layout: { width: CHART_WIDTH, height: 120 } },
    });
    await fireEvent(screen.getByText(label, { includeHiddenElements: true }), 'layout', {
      nativeEvent: { layout: { width: measuredWidth, height: 12 } },
    });
  }

  it('makes room for the longest end label', async () => {
    await renderWithEndLabel('Arctic Monkeys', 80);
    const x = svgTextOf('Arctic Monkeys')?.props.x[0];
    expect(x + 80).toBeLessThanOrEqual(CHART_WIDTH);
  });

  it('cuts an end label short when it is wider than the room it can get', async () => {
    const label = 'Godspeed You! Black Emperor';
    await renderWithEndLabel(label, 200);
    expect(svgTextOf(label)).toBeUndefined();
    const shown = screen.container.queryAll((n) => /…$/.test(String(n.props.content ?? '')));
    expect(shown).toHaveLength(1);
    expect(label.startsWith(shown[0].props.content.slice(0, -1))).toBe(true);
  });

  it('draws the end dots outside the clip, so they are not cut in half', async () => {
    await renderWithEndLabel('Radiohead', 50);
    const dots = screen.container.queryAll((n) => n.props.r === 3);
    expect(dots.length).toBeGreaterThan(0);
    for (const dot of dots) {
      for (let n = dot.parent; n; n = n.parent) expect(n.props.clipPath).toBeUndefined();
    }
  });
});
