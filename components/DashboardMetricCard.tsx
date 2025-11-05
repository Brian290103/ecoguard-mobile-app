import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Colors from "@/lib/colors";
import { Ionicons } from "@expo/vector-icons";

import { useRouter } from "expo-router";
import { TouchableOpacity } from "react-native";

interface DashboardMetricCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: number;
  color?: string;
  url?: string;
}

export default function DashboardMetricCard({
  icon,
  title,
  value,
  color,
  url,
}: DashboardMetricCardProps) {
  const router = useRouter();

  const handlePress = () => {
    if (url) {
      router.push(url);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={!url}
      style={styles.touchableContainer}
    >
      <View style={styles.container}>
      <View style={styles.topSection}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={24} color={color || Colors.primary} />
        </View>
        <Text style={styles.value}>{value}</Text>
      </View>
      <View style={styles.bottomSection}>
        <Text style={styles.title}>{title}</Text>
      </View>
    </View>
  </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 5,
    padding: 15,
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "flex-start",
    elevation: 0.5,
    minHeight: 80,
  },
  topSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  iconContainer: {
    // No specific styles needed here
  },
  title: {
    fontSize: 12,
    color: Colors.gray,
  },
  bottomSection: {
    width: "100%",
    alignItems: "flex-start",
  },
  value: {
    fontSize: 24,
    fontWeight: "bold",
  },
  touchableContainer: {
    flex: 1,
  },
});
