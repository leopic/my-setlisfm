import { render, screen } from '@testing-library/react-native';
import BarChart from '@/components/charts/BarChart';

it('says each bar with shows, with its full name', async () => {
  await render(
    <BarChart
      data={[
        { id: 'mon', label: 'M', spokenLabel: 'Monday', value: 1 },
        { id: 'tue', label: 'T', spokenLabel: 'Tuesday', value: 0 },
        { id: 'fri', label: 'F', value: 3 },
      ]}
    />,
  );
  expect(screen.getByRole('image', { name: 'Monday: 1 show, F: 3 shows' })).toBeOnTheScreen();
});

// With every bar at 0 there is nothing to say, so it is not a bare "image" for VoiceOver.
it('is not an image when every bar is 0', async () => {
  await render(<BarChart data={[{ id: 'mon', label: 'M', value: 0 }]} />);
  expect(screen.queryByRole('image')).not.toBeOnTheScreen();
});
