import React from "react";
import { View, StyleSheet } from "react-native";
import DashboardMetricCard from "./DashboardMetricCard";
import { Ionicons } from "@expo/vector-icons";

interface DashboardMetricCardData {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: number;
  color?: string;
  url?: string;
}

interface DashboardMetricCardListProps {
  cards: DashboardMetricCardData[];
}

export default function DashboardMetricCardList({
  cards,
}: DashboardMetricCardListProps) {
  return (
    <View style={styles.metricCardsContainer}>
      {cards.map((card, index) => (
        <View key={index} style={styles.cardWrapper}>
          <DashboardMetricCard {...card} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  metricCardsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 10,
  },
  cardWrapper: {
    width: "31%", // Approximately 1/3 of the width, accounting for margins
    marginBottom: 10,
    marginHorizontal: "1%",
  },
});