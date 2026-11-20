import {
  StyleSheet,
  Text,
  FlatList,
  Pressable,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';

interface YearFilterListProps {
  years: string[];
  selected: string | null;
  allLabel: string;
  onSelect: (year: string | null) => void;
}

type YearFilterStyles = {
  item: ViewStyle;
  text: TextStyle;
  textActive: TextStyle;
};

function YearFilterItem({
  year,
  isLast,
  isActive,
  label,
  onSelect,
  styles,
}: {
  year: string | null;
  isLast: boolean;
  isActive: boolean;
  label: string;
  onSelect: (year: string | null) => void;
  styles: YearFilterStyles;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.item,
        { borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth },
        { opacity: pressed ? 0.7 : 1 },
      ]}
      onPress={() => onSelect(year)}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
    >
      <Text style={[styles.text, isActive && styles.textActive]}>{label}</Text>
    </Pressable>
  );
}

function yearFilterKeyExtractor(item: string | null) {
  return item ?? 'all';
}

export default function YearFilterList({
  years,
  selected,
  allLabel,
  onSelect,
}: YearFilterListProps) {
  const colors = useChronicleColors();
  const styles = StyleSheet.create({
    item: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomColor: colors.border,
    },
    text: { ...Type.body, color: colors.textPrimary },
    textActive: { ...Type.headline, color: colors.accent },
  });
  const data: (string | null)[] = [null, ...years];
  const renderItem = ({ item: year, index }: { item: string | null; index: number }) => (
    <YearFilterItem
      year={year}
      isLast={index === data.length - 1}
      isActive={selected === year}
      label={year ?? allLabel}
      onSelect={onSelect}
      styles={styles}
    />
  );
  return (
    <FlatList
      data={data}
      keyExtractor={yearFilterKeyExtractor}
      keyboardShouldPersistTaps="handled"
      renderItem={renderItem}
    />
  );
}
