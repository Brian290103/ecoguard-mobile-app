import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Image, ScrollView } from "react-native";
import { supabase } from "@/lib/supabase";
import Colors from "@/lib/colors";

interface ResolvedReportDetailsProps {
  reportId: string;
}

interface ResolvedReport {
  id: string;
  created_at: string;
  report_id: string;
  user_id: string;
  title: string;
  description: string;
  images_urls: string[];
  updated_at: string;
}

export default function ResolvedReportDetails({ reportId }: ResolvedReportDetailsProps) {
  const [resolvedReport, setResolvedReport] = useState<ResolvedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResolvedReport = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from("resolved_reports")
          .select("*")
          .eq("report_id", reportId)
          .single();

        if (fetchError) {
          if (fetchError.code === "PGRST116") {
            // No rows found, which is expected for some report IDs
            setResolvedReport(null);
          } else {
            throw fetchError;
          }
        } else {
          setResolvedReport(data);
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred while fetching resolution details.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (reportId) {
      fetchResolvedReport();
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

  if (!resolvedReport) {
    return null;
  }

  const hasImages = resolvedReport.images_urls && resolvedReport.images_urls.length > 0;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Resolution Details</Text>
      <Text style={styles.label}>Title:</Text>
      <Text style={styles.value}>{resolvedReport.title}</Text>
      <Text style={styles.label}>Description:</Text>
      <Text style={styles.value}>{resolvedReport.description}</Text>
      <Text style={styles.label}>Resolved On:</Text>
      <Text style={styles.value}>{new Date(resolvedReport.created_at).toLocaleString()}</Text>

      {hasImages && (
        <View style={styles.mediaSection}>
          <Text style={styles.label}>Images:</Text>
          <View style={styles.mediaGrid}>
            {resolvedReport.images_urls.map((url, index) => (
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
    </ScrollView>
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
    color: Colors.primary,
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
  mediaSection: {
    marginTop: 15,
  },
  mediaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 10,
  },
  mediaGridItem: {
    width: "48%",
    marginBottom: 10,
  },
  reportImage: {
    width: "100%",
    height: 150,
    borderRadius: 8,
    backgroundColor: Colors.lightGray,
  },
});
