import { Platform } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { Chevron } from '@/components/ui';

it("takes the row arrow's color and place, and VoiceOver skips it", async () => {
  await render(<Chevron style={{ color: '#4a5e80', fontSize: 17, marginLeft: 8 }} />);

  expect(screen.queryByTestId('row-chevron')).not.toBeOnTheScreen();
  const chevron = screen.getByTestId('row-chevron', { includeHiddenElements: true });
  expect(chevron.props.tintColor).toBe('#4a5e80');
  expect(chevron).toHaveStyle({ marginLeft: 8 });
});

it('draws the Ionicons chevron off iOS, in the same color', async () => {
  jest.replaceProperty(Platform, 'OS', 'android');
  await render(<Chevron style={{ color: '#4a5e80' }} />);

  const chevron = screen.getByTestId('row-chevron', { includeHiddenElements: true });
  expect(chevron.props.tintColor).toBeUndefined();
  expect(chevron).toHaveStyle({ color: '#4a5e80' });
});
