import { Stack } from 'expo-router';

type Props = { placeholder: string; onChangeText: (text: string) => void };

/**
 * The search field in the native bar under a large title (see searchInHeader). Render it in the
 * loading branch too: a bar added to a header iOS already laid out starts the list with the
 * large title collapsed. hideWhenScrolling: with the default, iOS starts the bar hidden until
 * the list is pulled down. Stack.SearchBar also sets headerShown, so keep it out of branches
 * that hide the header.
 */
export default function HeaderSearchBar({ placeholder, onChangeText }: Props) {
  return (
    <Stack.SearchBar
      placeholder={placeholder}
      autoCapitalize="none"
      hideWhenScrolling={false}
      onChangeText={(event) => onChangeText(event.nativeEvent.text)}
      onCancelButtonPress={() => onChangeText('')}
    />
  );
}
