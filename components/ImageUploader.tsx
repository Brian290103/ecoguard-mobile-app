import React, { useState, useEffect } from 'react';
import { View, Button, Image, StyleSheet, Alert, Text, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import Styles from '@/lib/styles';

interface ImageUploaderProps {
  onUrlsChange: (urls: string[]) => void;
  type?: 'single' | 'multiple'; // 'single' or 'multiple', defaults to 'multiple'
}

export default function ImageUploader({ onUrlsChange, type = 'multiple' }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const showImagePickerOptions = () => {
    Alert.alert(
      'Select Image',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Gallery', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled) {
      uploadImage(result.assets[0]);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled) {
      uploadImage(result.assets[0]);
    }
  };

  const uploadImage = async (asset: ImagePicker.ImagePickerAsset) => {
    try {
      setUploading(true);
      const arraybuffer = await fetch(asset.uri).then((res) => res.arrayBuffer());
      const fileExt = asset.uri?.split('.').pop()?.toLowerCase() ?? 'jpeg';
      const path = `${Date.now()}.${fileExt}`;
      const { data, error: uploadError } = await supabase.storage
        .from('reports')
        .upload(path, arraybuffer, {
          contentType: asset.mimeType ?? 'image/jpeg',
        });

      if (uploadError) {
        throw uploadError;
      }

      const newUrl = supabase.storage.from('reports').getPublicUrl(data.path).data.publicUrl;
      const newImageUrls = type === 'single' ? [newUrl] : [...imageUrls, newUrl];
      setImageUrls(newImageUrls);
      onUrlsChange(newImageUrls);
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message);
      } else {
        throw error;
      }
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const newImageUrls = type === 'single' ? [] : [...imageUrls];
    if (type === 'multiple') {
      newImageUrls.splice(index, 1);
    }
    setImageUrls(newImageUrls);
    onUrlsChange(newImageUrls);
  };

  return (
    <View style={styles.container}>
      {!(type === 'single' && imageUrls.length > 0) && (
        <TouchableOpacity
          style={Styles.outlineButton}
          onPress={showImagePickerOptions}
          disabled={uploading}
        >
          <Text style={Styles.outlineButtonText}>{uploading ? 'Uploading...' : 'Add Image'}</Text>
        </TouchableOpacity>
      )}
      <View style={styles.imageList}>
        {imageUrls.map((url, index) => (
          <View key={index} style={styles.imageContainer}>
            <Image source={{ uri: url }} style={styles.image} />
            <TouchableOpacity onPress={() => removeImage(index)} style={styles.removeButton}>
              <Text style={styles.removeButtonText}>X</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  imageList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  imageContainer: {
    position: 'relative',
    margin: 5,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 5,
  },
  removeButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    padding: 2,
  },
  removeButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
