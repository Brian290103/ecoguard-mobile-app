import React, { useState } from 'react';
import { View, StyleSheet, Alert, Text, TouchableOpacity } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '../lib/supabase';
import Styles from '@/lib/styles';

interface FileUploaderProps {
  onUrlChange: (url: string) => void;
}

export default function FileUploader({ onUrlChange }: FileUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
      });

      if (result.canceled === false) {
        uploadFile(result.assets[0]);
      }
    } catch (error) {
        Alert.alert('Error picking document', error instanceof Error ? error.message : 'An unknown error occurred.');
    }
  };

  const uploadFile = async (asset: DocumentPicker.DocumentPickerAsset) => {
    try {
      setUploading(true);
      const fileContent = await fetch(asset.uri).then(res => res.arrayBuffer());
      const fileExt = asset.name.split('.').pop()?.toLowerCase() ?? 'pdf';
      const path = `${Date.now()}.${fileExt}`;
      
      const { data, error: uploadError } = await supabase.storage
        .from('resources') // bucket name
        .upload(path, fileContent, {
          contentType: asset.mimeType ?? 'application/pdf',
        });

      if (uploadError) {
        throw uploadError;
      }

      const newUrl = supabase.storage.from('resources').getPublicUrl(data.path).data.publicUrl;
      setFileUrl(newUrl);
      setFileName(asset.name);
      onUrlChange(newUrl);
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Upload Error', error.message);
      } else {
        Alert.alert('Upload Error', 'An unknown error occurred during file upload.');
      }
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setFileUrl(null);
    setFileName(null);
    onUrlChange('');
  };

  return (
    <View style={styles.container}>
      {!fileUrl && (
        <TouchableOpacity
          style={Styles.outlineButton}
          onPress={pickDocument}
          disabled={uploading}
        >
          <Text style={Styles.outlineButtonText}>{uploading ? 'Uploading...' : 'Add PDF File'}</Text>
        </TouchableOpacity>
      )}
      {fileUrl && (
        <View style={styles.fileContainer}>
          <Text>{fileName}</Text>
          <TouchableOpacity onPress={removeFile} style={styles.removeButton}>
            <Text style={styles.removeButtonText}>X</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    marginTop: 10,
  },
  removeButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    padding: 5,
    marginLeft: 10,
  },
  removeButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});