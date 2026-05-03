import { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { dbOperations } from '@/database/operations';
import type { SetlistWithDetails, SetWithSongs } from '@/types/database';
import Setlist from '@/components/Setlist';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';

interface Props {
  concertId: string | null;
}

export default function SetlistDetailPane({ concertId }: Props) {
  const colors = useChronicleColors();
  const [setlist, setSetlist] = useState<SetlistWithDetails | null>(null);
  const [sets, setSets] = useState<SetWithSongs[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!concertId) {
      setSetlist(null);
      setSets([]);
      return;
    }
    load(concertId);
  }, [concertId]);

  const load = async (id: string) => {
    setLoading(true);
    try {
      const data = await dbOperations.getSetlistById(id);
      if (data) {
        setSetlist(data);
        setSets(data.sets ?? []);
      } else {
        setSetlist(null);
        setSets([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        placeholder: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
        placeholderText: { ...Type.body, color: colors.textMuted },
      }),
    [colors],
  );

  if (!concertId) {
    return (
      <View style={styles.container}>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Select a concert</Text>
        </View>
      </View>
    );
  }

  if (loading || !setlist) {
    return <View style={styles.container} />;
  }

  // Setlist uses TabScrollView internally — wrap in a plain View so it fills the pane
  return (
    <View style={styles.container}>
      <Setlist setlist={setlist} sets={sets} />
    </View>
  );
}
