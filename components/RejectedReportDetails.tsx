import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { supabase } from "@/lib/supabase";
import Colors from "@/lib/colors";

interface RejectedReportDetailsProps {
  reportId: string;
}

interface RejectedReport {
  id: string;
  created_at: string;
  report_id: string;
  reason: string;
  user_id: string;
}

export default function RejectedReportDetails({
  reportId,
}: RejectedReportDetailsProps) {
  const [rejectedReport, setRejectedReport] = useState<RejectedReport | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRejectedReport = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from("rejected_reports")
          .select("*")
          .eq("report_id", reportId)
          .single();

        if (fetchError) {
          if (fetchError.code === "PGRST116") {
            setRejectedReport(null);
          } else {
            throw fetchError;
          }
        }
        setRejectedReport(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(
            "An unknown error occurred while fetching rejection details.",
          );
        }
      } finally {
        setLoading(false);
      }
    };

    if (reportId) {
      fetchRejectedReport();
    }
  }, [reportId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  if (!rejectedReport) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rejection Details</Text>
      <Text style={styles.label}>Reason:</Text>
      <Text style={styles.value}>{rejectedReport.reason}</Text>
      <Text style={styles.label}>Rejected On:</Text>
      <Text style={styles.value}>
        {new Date(rejectedReport.created_at).toLocaleString()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: Colors.white,
    borderRadius: 5,
    marginVertical: 5,
    elevation: 0.5,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: Colors.red,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 8,
  },
  value: {
    fontSize: 16,
    marginBottom: 4,
    color: Colors.gray,
  },
  errorText: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
  },
  noDetailsText: {
    fontSize: 16,
    color: Colors.gray,
    textAlign: "center",
  },
});
