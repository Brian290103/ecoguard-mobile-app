import { useRouter } from "expo-router";
import {
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
  SectionList,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Report } from "@/lib/types";
import Colors from "@/lib/colors";
import { getRelativeDateGroup } from "@/lib/utils";
import ReportCard from "@/components/ReportCard";

interface Section {
  title: string;
  data: Report[];
}

export default function Reports() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<Section[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const groupReportsByDate = (reports: Report[]): Section[] => {
    const grouped: { [key: string]: Report[] } = {};
    reports.forEach((report) => {
      const dateGroup = getRelativeDateGroup(report.created_at);
      if (!grouped[dateGroup]) {
        grouped[dateGroup] = [];
      }
      grouped[dateGroup].push(report);
    });

    return Object.keys(grouped).map((date) => ({
      title: date,
      data: grouped[date],
    }));
  };

  const fetchReports = async () => {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        setError("User not authenticated");
        return;
      }

      const { data, error } = await supabase
        .from("reports")
        .select("*")

        .order("created_at", { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        setSections(groupReportsByDate(data));
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();

    const channel = supabase
      .channel("custom-all-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reports" },
        (payload) => {
          console.log("Change received!", payload);
          fetchReports();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchReports]); // Added fetchReports to dependency array

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchReports();
    setRefreshing(false);
  }, [fetchReports]); // Added fetchReports to dependency array

  const renderSectionHeader = ({
    section: { title },
  }: {
    section: Section;
  }) => <Text style={styles.sectionHeader}>{title}</Text>;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: "All Reports" }} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: "All Reports" }} />
        <View style={styles.center}>
          <Text>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "All Reports" }} />
      {sections.length === 0 ? (
        <View style={styles.center}>
          <Text>No reports found.</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          renderItem={({ item }) => (
            <ReportCard report={item} isDetailed={true} />
          )}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    marginTop: 20,
  },
});
