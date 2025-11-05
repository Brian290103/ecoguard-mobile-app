import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { Video } from "expo-av";
import type { Report } from "@/lib/types";

interface MediaTabProps {
  report: Report;
}

export default function MediaTab({ report }: MediaTabProps) {
  const hasImages = report.image_urls && report.image_urls.length > 0;
  const hasVideos = report.video_urls && report.video_urls.length > 0;

  return (
    <View style={styles.container}>
      {hasImages && (
        <View style={styles.mediaSection}>
          <Text style={styles.sectionTitle}>Images:</Text>
          <View style={styles.mediaGrid}>
            {report.image_urls.map((url, index) => (
              <View key={index} style={styles.mediaGridItem}>
                <Image
                  source={{ uri: url }}
                  style={styles.reportImage}
                  resizeMode="cover"
                />
              </View>
            ))}
          </View>
        </View>
      )}

      {hasVideos && (
        <View style={styles.mediaSection}>
          <Text style={styles.sectionTitle}>Videos:</Text>
          <View style={styles.mediaGrid}>
            {report.video_urls.map((url, index) => (
              <View key={index} style={styles.mediaGridItem}>
                <Video
                  source={{ uri: url }}
                  style={styles.reportVideo}
                  useNativeControls
                  resizeMode={Video.RESIZE_MODE_CONTAIN}
                />
              </View>
            ))}
          </View>
        </View>
      )}

      {!hasImages && !hasVideos && (
        <Text style={styles.noMediaText}>
          No media available for this report.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  mediaSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  mediaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between", // Distributes items evenly with space between them
  },
  mediaGridItem: {
    width: "48%", // Approximately half width, allowing for space between columns
    marginBottom: 15, // Space between rows
  },
  reportImage: {
    width: "100%", // Takes full width of its parent grid item
    height: 200,
    borderRadius: 8,
    backgroundColor: "#e0e0e0",
  },
  reportVideo: {
    width: "100%", // Takes full width of its parent grid item
    height: 300,
    borderRadius: 8,
    backgroundColor: "#e0e0e0",
  },
  noMediaText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 20,
  },
});
