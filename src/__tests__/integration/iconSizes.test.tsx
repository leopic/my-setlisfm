import { render, screen } from '@testing-library/react-native';
import { SearchInput } from '@/components/ui';
import DataSection from '@/components/settings/DataSection';
import { useSettingsStyles } from '@/components/settings/useSettingsStyles';

type Node = { props: Record<string, unknown>; children: (Node | string)[] | null };

// The size of each SF Symbol on screen, by name.
const symbolSizes = () => {
  const sizes: Record<string, unknown> = {};
  const walk = (node: Node | string) => {
    if (typeof node === 'string') return;
    if (typeof node.props.name === 'string') sizes[node.props.name] = node.props.size;
    node.children?.forEach(walk);
  };
  const tree = screen.toJSON();
  (Array.isArray(tree) ? tree : [tree]).forEach((node) => node && walk(node as Node));
  return sizes;
};

it('draws the search icon at the size of the field text', async () => {
  await render(<SearchInput value="the" onChangeText={jest.fn()} />);
  expect(symbolSizes()).toMatchObject({ magnifyingglass: 17 });
});

it('ends Clear All Data with the shared row arrow', async () => {
  function Section() {
    return <DataSection styles={useSettingsStyles()} onClearData={jest.fn()} />;
  }
  await render(<Section />);
  expect(screen.getByTestId('row-chevron', { includeHiddenElements: true })).toBeTruthy();
});
