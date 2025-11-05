import React, { useState, useEffect } from "react";
import {
  View,
  Button,
  StyleSheet,
  Alert,
  Text,
  TouchableOpacity,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../lib/supabase";
import Styles from "@/lib/styles";
import { Video } from "expo-av";

interface VideoUploaderProps {
  onUrlsChange: (urls: string[]) => void;
}

export default function VideoUploader({ onUrlsChange }: VideoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);

  const showVideoPickerOptions = () => {
    Alert.alert(
      "Select Video",
      "Choose an option",
      [
        { text: "Take Video", onPress: takeVideo },
        { text: "Choose from Gallery", onPress: pickVideo },
        { text: "Cancel", style: "cancel" },
      ],
      { cancelable: true },
    );
  };

  const takeVideo = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });
    if (!result.canceled) {
      uploadVideo(result.assets[0]);
    }
  };

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });
    if (!result.canceled) {
      uploadVideo(result.assets[0]);
    }
  };

  const uploadVideo = async (asset: ImagePicker.ImagePickerAsset) => {
    try {
      setUploading(true);
      const arraybuffer = await fetch(asset.uri).then((res) =>
        res.arrayBuffer(),
      );
      const fileExt = asset.uri?.split(".").pop()?.toLowerCase() ?? "mp4";
      const path = `${Date.now()}.${fileExt}`;
      const { data, error: uploadError } = await supabase.storage
        .from("reports")
        .upload(path, arraybuffer, {
          contentType: asset.mimeType ?? "video/mp4",
        });

      if (uploadError) {
        throw uploadError;
      }

      const newUrl = supabase.storage.from("reports").getPublicUrl(data.path)
        .data.publicUrl;
      const newVideoUrls = [...videoUrls, newUrl];
      setVideoUrls(newVideoUrls);
      onUrlsChange(newVideoUrls);
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

  const removeVideo = (index: number) => {
    const newVideoUrls = [...videoUrls];
    newVideoUrls.splice(index, 1);
    setVideoUrls(newVideoUrls);
    onUrlsChange(newVideoUrls);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={Styles.outlineButton}
        onPress={showVideoPickerOptions}
        disabled={uploading}
      >
        <Text style={Styles.outlineButtonText}>
          {uploading ? "Uploading..." : "Add Video"}
        </Text>
      </TouchableOpacity>
      <View style={styles.videoList}>
        {videoUrls.map((url, index) => (
          <View key={index} style={styles.videoContainer}>
            <Video
              source={{ uri: url }}
              style={styles.video}
              useNativeControls
              resizeMode={Video.RESIZE_MODE_CONTAIN}
            />
            <TouchableOpacity
              onPress={() => removeVideo(index)}
              style={styles.removeButton}
            >
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
  videoList: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
  },
  videoContainer: {
    position: "relative",
    margin: 5,
  },
  video: {
    width: 150,
    height: 100,
    borderRadius: 5,
  },
  removeButton: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 10,
    padding: 2,
  },
  removeButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
});
