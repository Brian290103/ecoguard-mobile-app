import React, { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import ListHeader from "@/components/ListHeader";
import { supabase } from "@/lib/supabase";
import ReportCard from "@/components/ReportCard";
import Colors from "@/lib/colors";
import { router } from "expo-router";
import { Report } from "@/lib/types";

export default function LatestReportsList() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLatestReports = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session?.user) {
          setError("User not authenticated");
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("reports")
          .select("*")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false })
          .limit(5);

        if (error) {
          throw error;
        }
        setReports(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred while fetching reports.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLatestReports();

    const channel = supabase
      .channel("latest-reports-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reports" },
        (payload) => {
          fetchLatestReports();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  if (reports.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ListHeader
        title="Latest Reports"
        linkText="View All"
        onPressLink={() => router.push("/home/user/reports")}
      />
      {/*<ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalScrollContainer}
      >*/}
      {reports.map((item) => (
        <ReportCard key={item.id} report={item} />
      ))}
      {/*</ScrollView>*/}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: "bold",
  },
  errorText: {
    color: "red",
    textAlign: "center",
  },
  noReportsText: {
    textAlign: "center",
    color: Colors.gray,
  },
  horizontalScrollContainer: {
    paddingRight: 20, // Add some padding at the end of the scroll view
  },
});
