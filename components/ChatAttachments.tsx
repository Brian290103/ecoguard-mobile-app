import React from 'react';
import { TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/lib/colors';

interface ChatAttachmentsProps {
  onTakePhoto: () => void;
  onPickImage: () => void;
  onPickDocument: () => void;
}

const ChatAttachments = ({ onTakePhoto, onPickImage, onPickDocument }: ChatAttachmentsProps) => {
  const showImagePickerOptions = () => {
    Alert.alert(
      'Select Attachment',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: onTakePhoto },
        { text: 'Choose from Gallery', onPress: onPickImage },
        { text: 'Choose Document', onPress: onPickDocument },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  return (
    <TouchableOpacity style={styles.container} onPress={showImagePickerOptions}>
      <Ionicons name="attach" size={24} color={Colors.gray} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatAttachments;
