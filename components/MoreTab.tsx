import { View, Text, StyleSheet } from "react-native";
import { Report } from "@/lib/types";
import React from "react";
import RejectedReportDetails from "./RejectedReportDetails";
import ResolvedReportDetails from "./ResolvedReportDetails";
import AssignedReportDetails from "./AssignedReportDetails"; // Import the new AssignedReportDetails component
import EscalatedReportDetails from "./EscalatedReportDetails"; // Import the new EscalatedReportDetails component

interface MoreTabProps {
  report: Report;
}

export default function MoreTab({ report }: MoreTabProps) {
  return (
    <View style={styles.container}>
      {report.status === "rejected" ? (
        <RejectedReportDetails reportId={report.id} />
      ) : report.status === "resolved" ||
        report.status === "assigned" ||
        report.status === "escalated" ? (
        <>
          <ResolvedReportDetails reportId={report.id} />
          <AssignedReportDetails reportId={report.id} />
          <EscalatedReportDetails reportId={report.id} />
        </>
      ) : (
        <View>
          <Text style={styles.title}>Additional Information</Text>
          {/* Display additional information here */}
          <Text>Report ID: {report.id}</Text>
          <Text>User ID: {report.user_id}</Text>
          {/* Add more fields as needed */}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
});
