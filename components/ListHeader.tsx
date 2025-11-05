import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/lib/colors";

interface ListHeaderProps {
  title: string;
  linkText: string;
  onPressLink: () => void;
}

export default function ListHeader({ title, linkText, onPressLink }: ListHeaderProps) {
  return (
    <View style={styles.headerContainer}>
      <Text style={styles.title}>{title}</Text>
      <TouchableOpacity onPress={onPressLink} style={styles.linkContainer}>
        <Text style={styles.linkText}>{linkText}</Text>
        <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  title: {
    fontSize: 17,
    fontWeight: "bold",
  },
  linkContainer: {
    flexDirection: "row",
    gap: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  linkText: {
    color: Colors.primary,
  },
});
