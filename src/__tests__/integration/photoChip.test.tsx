import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import PhotoChip from '@/components/ui/PhotoChip';
import { chronicleLight } from '@/utils/colors';

jest.mock('expo-glass-effect', () => {
  const { View } = jest.requireActual('react-native');
  return {
    isLiquidGlassAvailable: jest.fn(),
    GlassView: (props: object) => <View {...props} testID="glass-view" />,
  };
});

const glassAvailable = isLiquidGlassAvailable as jest.Mock;

it('is Liquid Glass where iOS has it', async () => {
  glassAvailable.mockReturnValue(true);
  await render(
    <PhotoChip>
      <Text>Back</Text>
    </PhotoChip>,
  );

  expect(screen.getByTestId('glass-view')).toBeOnTheScreen();
  expect(screen.getByText('Back')).toBeOnTheScreen();
});

it('is a solid chip in the screen background elsewhere', async () => {
  glassAvailable.mockReturnValue(false);
  await render(
    <PhotoChip testID="chip">
      <Text>Back</Text>
    </PhotoChip>,
  );

  expect(screen.queryByTestId('glass-view')).not.toBeOnTheScreen();
  expect(screen.getByTestId('chip')).toHaveStyle({ backgroundColor: chronicleLight.background });
});
