import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet, Image } from "react-native";
import { supabase } from "@/lib/supabase";
import Colors from "@/lib/colors";
import Toast from "react-native-toast-message";
import type { AssignedReport } from "@/lib/types";

interface AssignedReportDetailsProps {
  reportId: string;
}

export default function AssignedReportDetails({
  reportId,
}: AssignedReportDetailsProps) {
  const [assignedReport, setAssignedReport] = useState<AssignedReport | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAssignedReportDetails() {
      setLoading(true);
      try {
        const { data: assignedReportData, error: assignedReportError } = await supabase
          .from("assigned_reports")
          .select(`*,
            organizations (name, logo)
          `)
          .eq("report_id", reportId)
          .single();

        if (assignedReportError) {
          if (assignedReportError.code === "PGRST116") {
            setAssignedReport(null);
            setLoading(false); // Ensure loading is set to false here
            return; // Exit early if no assigned report is found
          } else {
            throw assignedReportError;
          }
        }

        // If assignedReportData is null, it means no report was found, so we should not proceed.
        if (!assignedReportData) {
          setAssignedReport(null);
          setLoading(false);
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from("profile")
          .select("first_name, last_name")
          .eq("id", assignedReportData.user_id)
          .single();

        if (profileError) {
          throw profileError;
        }

        setAssignedReport({
          ...assignedReportData,
          profiles: profileData,
        } as AssignedReport);
      } catch (error: any) {
        console.error("Error fetching assigned report details:", error);
        Toast.show({
          type: "error",
          text1: "Error",
          text2:
            error.message || "Failed to load assigned report details.",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchAssignedReportDetails();
  }, [reportId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!assignedReport) {
    return null;
  }

  const assignedByFullName = assignedReport.profiles
    ? `${assignedReport.profiles.first_name} ${assignedReport.profiles.last_name}`
    : "N/A";

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Assignment Details</Text>
      <View style={styles.detailCard}>
        <Text style={styles.label}>Assigned To Organization:</Text>
        <View style={styles.organizationInfo}>
          {assignedReport.organizations?.logo && (
            <Image
              source={{ uri: assignedReport.organizations.logo }}
              style={styles.organizationLogo}
            />
          )}
          <Text style={styles.value}>
            {assignedReport.organizations?.name || "N/A"}
          </Text>
        </View>
      </View>
      <View style={styles.detailCard}>
        <Text style={styles.label}>Assigned By:</Text>
        <Text style={styles.value}>{assignedByFullName}</Text>
      </View>
      <View style={styles.detailCard}>
        <Text style={styles.label}>Assignment Date:</Text>
        <Text style={styles.value}>
          {new Date(assignedReport.created_at).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    padding: 15,
    backgroundColor: Colors.white,
    borderRadius: 8,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: Colors.primary,
    textAlign: "center",
  },
  detailCard: {
    backgroundColor: Colors.lightGray,
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.darkGray,
    marginBottom: 5,
  },
  value: {
    fontSize: 16,
    color: Colors.gray,
  },
  organizationInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  organizationLogo: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
    backgroundColor: Colors.gray,
  },
  noDetailsText: {
    fontSize: 16,
    color: Colors.gray,
  },
});
