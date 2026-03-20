import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Modal,
} from 'react-native';
import type { SetlistWithDetails } from '../types/database';
import { formatDate } from '../utils/date';
import { useColors } from '../utils/colors';

interface ConcertWithDetails extends SetlistWithDetails {
  artistName: string;
  venueName: string;
  cityName?: string;
  stateName?: string;
  countryName?: string;
}

interface ConcertListModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  concerts: ConcertWithDetails[];
  loading: boolean;
  onConcertPress: (concert: ConcertWithDetails) => void;
}

export default function ConcertListModal({
  visible,
  onClose,
  title,
  concerts,
  loading,
  onConcertPress,
}: ConcertListModalProps) {
  const colors = useColors();
  const styles = useMemo(() => StyleSheet.create({
    modalContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      backgroundColor: colors.backgroundCard,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    closeButton: {
      padding: 10,
    },
    closeButtonText: {
      fontSize: 24,
      color: colors.textSecondary,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.textPrimary,
      flex: 1,
      textAlign: 'center',
    },
    placeholder: {
      width: 50,
    },
    concertsList: {
      flex: 1,
      padding: 20,
    },
    concertItem: {
      backgroundColor: colors.backgroundCard,
      borderRadius: 12,
      borderCurve: 'continuous' as const,
      padding: 20,
      marginBottom: 15,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    concertHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    concertMainName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.textPrimary,
    },
    concertDate: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    concertDetails: {
      marginTop: 5,
    },
    concertLocation: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    tourName: {
      fontSize: 14,
      color: colors.primary,
      fontStyle: 'italic',
      marginTop: 5,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 18,
      color: colors.textSecondary,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyStateText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  }), [colors]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        {/* Modal Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>X</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{title}</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Concerts List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading concerts...</Text>
          </View>
        ) : (
          <ScrollView style={styles.concertsList} contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false}>
            {concerts.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No concerts found</Text>
              </View>
            ) : (
              concerts.map((concert) => (
                <TouchableOpacity
                  key={concert.id}
                  style={styles.concertItem}
                  onPress={() => onConcertPress(concert)}
                >
                  <View style={styles.concertHeader}>
                    <Text style={styles.concertMainName}>
                      {title.includes('Artist') ? concert.venueName : concert.artistName}
                    </Text>
                    <Text style={styles.concertDate}>{formatDate(concert.eventDate ?? '')}</Text>
                  </View>

                  <View style={styles.concertDetails}>
                    <Text style={styles.concertLocation}>
                      {concert.cityName}
                      {concert.stateName && `, ${concert.stateName}`}
                      {concert.countryName && `, ${concert.countryName}`}
                    </Text>
                  </View>

                  {concert.tour?.name && <Text style={styles.tourName}>{concert.tour.name}</Text>}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}
