import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Report } from "@/lib/types";
import { getStatusColor } from "@/lib/statusColors";
import { Link, useRouter } from "expo-router";

interface ReportCardProps {
  report: Report;
  isDetailed?: boolean;
}

export default function ReportCard({
  report,
  isDetailed = false,
}: ReportCardProps) {
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() => router.push(`/home/single-report/${report.id}`)}
      style={styles.reportContainer}
    >
      <View style={styles.topView}>
        {report.image_urls && report.image_urls.length > 0 && (
          <Image
            source={{ uri: report.image_urls[0] }}
            style={styles.reportImage}
          />
        )}
        <View style={styles.centerView}>
          <Text style={styles.reportTitle}>{report.title}</Text>
          <View style={styles.reportSubHeader}>
            <Text style={styles.reportNumber}>{report.report_number}</Text>
            <View
              style={[
                styles.statusContainer,
                { backgroundColor: getStatusColor(report.status) },
              ]}
            >
              <Text style={styles.statusText}>{report.status}</Text>
            </View>
          </View>
        </View>
      </View>
      {isDetailed && (
        <View style={styles.bottomView}>
          <Text>{report.description}</Text>
          <Text style={styles.dateText}>
            Created at: {new Date(report.created_at).toLocaleDateString()}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  reportContainer: {
    backgroundColor: "#fff",
    borderRadius: 5,
    marginBottom: 15,
    elevation: 0.5,
    width: "100%",
  },
  topView: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
  },
  reportImage: {
    width: 50,
    height: 50,
    borderRadius: 5,
    marginRight: 15,
  },
  centerView: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  reportSubHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reportNumber: {
    fontSize: 12,
    color: "#666",
  },
  statusContainer: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 5,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    textTransform: "capitalize",
  },
  bottomView: {
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  dateText: {
    fontSize: 12,
    color: "#666",
    marginTop: 10,
  },
});
