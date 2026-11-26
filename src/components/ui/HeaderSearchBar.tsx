import { Stack } from 'expo-router';

type Props = { placeholder: string; onChangeText: (text: string) => void };

/**
 * The search field in the native bar under a large title (see searchInHeader). Render it in the
 * loading branch too: iOS lays out the bar with the first scroll view it sees, and a search bar
 * added later starts hidden, under the title, until the list is pulled down.
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
