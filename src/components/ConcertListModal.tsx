import React from 'react';
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
            <Text style={styles.closeButtonText}>✕</Text>
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
          <ScrollView style={styles.concertsList} showsVerticalScrollIndicator={false}>
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
                    <Text style={styles.concertDate}>{formatDate(concert.eventDate!)}</Text>
                  </View>
                  
                  <View style={styles.concertDetails}>
                    <Text style={styles.concertLocation}>
                      {concert.cityName}
                      {concert.stateName && `, ${concert.stateName}`}
                      {concert.countryName && `, ${concert.countryName}`}
                    </Text>
                  </View>

                  {concert.tour?.name && (
                    <Text style={styles.tourName}>{concert.tour.name}</Text>
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  closeButton: {
    padding: 10,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
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
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
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
    color: '#333',
  },
  concertDate: {
    fontSize: 14,
    color: '#666',
  },
  concertDetails: {
    marginTop: 5,
  },
  concertLocation: {
    fontSize: 13,
    color: '#666',
  },
  tourName: {
    fontSize: 14,
    color: '#007AFF',
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
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
