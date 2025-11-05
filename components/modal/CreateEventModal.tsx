import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Modal } from "react-native";
import EventsForm from "../EventsForm";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../lib/colors";

interface CreateEventModalProps {
  isVisible: boolean;
  onClose: () => void;
  userId: string;
}

const CreateEventModal = ({ isVisible, onClose, userId }: CreateEventModalProps) => {
  return (
    <Modal
      visible={isVisible}
      onRequestClose={onClose}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Create New Event</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.gray[700]} />
          </TouchableOpacity>
        </View>
        <EventsForm userId={userId} onEventCreated={onClose} />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    flex: 1,
    backgroundColor: "white",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.gray[800],
  },
  closeButton: {
    padding: 5,
  },
});

export default CreateEventModal;
