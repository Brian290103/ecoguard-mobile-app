import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet, Image } from "react-native";
import { supabase } from "@/lib/supabase";
import Colors from "@/lib/colors";
import Toast from "react-native-toast-message";
import type { Profile } from "@/lib/types"; // Assuming Profile type is available

interface Agency {
  name: string;
  logo_url: string;
}

interface EscalatedReport {
  id: string;
  created_at: string;
  report_id: string;
  agency_id: string;
  user_id: string;
  agencies: Agency | null;
  profiles: Profile | null;
}

interface EscalatedReportDetailsProps {
  reportId: string;
}

export default function EscalatedReportDetails({
  reportId,
}: EscalatedReportDetailsProps) {
  const [escalatedReport, setEscalatedReport] = useState<EscalatedReport | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEscalatedReportDetails() {
      setLoading(true);
      try {
        const { data: escalatedReportData, error: escalatedReportError } = await supabase
          .from("escalated_reports")
          .select(`*,
            agencies (name, logo_url)
          `)
          .eq("report_id", reportId)
          .single();

        if (escalatedReportError) {
          if (escalatedReportError.code === "PGRST116") {
            setEscalatedReport(null);
            setLoading(false);
            return;
          } else {
            throw escalatedReportError;
          }
        }

        if (!escalatedReportData) {
          setEscalatedReport(null);
          setLoading(false);
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from("profile")
          .select("first_name, last_name")
          .eq("id", escalatedReportData.user_id)
          .single();

        if (profileError) {
          throw profileError;
        }

        setEscalatedReport({
          ...escalatedReportData,
          profiles: profileData,
        } as EscalatedReport);
      } catch (error: any) {
        console.error("Error fetching escalated report details:", error);
        Toast.show({
          type: "error",
          text1: "Error",
          text2:
            error.message || "Failed to load escalated report details.",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchEscalatedReportDetails();
  }, [reportId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!escalatedReport) {
    return null;
  }

  const escalatedByFullName = escalatedReport.profiles
    ? `${escalatedReport.profiles.first_name} ${escalatedReport.profiles.last_name}`
    : "N/A";

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Escalation Details</Text>
      <View style={styles.detailCard}>
        <Text style={styles.label}>Escalated To Agency:</Text>
        <View style={styles.agencyInfo}>
          {escalatedReport.agencies?.logo_url && (
            <Image
              source={{ uri: escalatedReport.agencies.logo_url }}
              style={styles.agencyLogo}
            />
          )}
          <Text style={styles.value}>
            {escalatedReport.agencies?.name || "N/A"}
          </Text>
        </View>
      </View>
      <View style={styles.detailCard}>
        <Text style={styles.label}>Escalated By:</Text>
        <Text style={styles.value}>{escalatedByFullName}</Text>
      </View>
      <View style={styles.detailCard}>
        <Text style={styles.label}>Escalation Date:</Text>
        <Text style={styles.value}>
          {new Date(escalatedReport.created_at).toLocaleDateString()}
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
  agencyInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  agencyLogo: {
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
