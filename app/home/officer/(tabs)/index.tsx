import { useRouter } from "expo-router";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import React, { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";

import WelcomeUser from "@/components/WelcomeUser";
import Colors from "@/lib/colors";
import Styles from "@/lib/styles";
import { supabase } from "@/lib/supabase";
import { Report } from "@/lib/types";
import ReportCard from "@/components/ReportCard";
import DashboardMetricCard from "@/components/DashboardMetricCard";
import SearchBox from "@/components/SearchBox";
import DashboardStackHeader from "@/components/DashboardStackHeader";

export default function User() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [totalReports, setTotalReports] = useState(0);
  const [resolvedReportsCount, setResolvedReportsCount] = useState(0);
  const [rejectedReportsCount, setRejectedReportsCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Report[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const fetchData = async () => {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        setError("User not authenticated");
        setLoading(false); // Ensure loading is stopped if unauthenticated
        return;
      }

      // Calculate today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1); // Start of tomorrow

      const todayStart = today.toISOString();
      const todayEnd = tomorrow.toISOString();

      // Fetch all reports created today (officer view)
      const { data: reportsData, error: reportsError } = await supabase
        .from("reports")
        .select("*")
        // Removed .eq("user_id", session.user.id) for officer view (officers see all reports)
        .gte("created_at", todayStart) // Reports from the start of today
        .lt("created_at", todayEnd) // Until the start of tomorrow
        .order("created_at", { ascending: false });
      // Removed .limit(3) as per prompt

      if (reportsError) {
        throw reportsError;
      }
      setReports(reportsData);

      // Fetch total number of all reports in the system (officer view)
      const { count, error: countError } = await supabase
        .from("reports")
        .select("id", { count: "exact" });
      // Removed .eq("user_id", session.user.id) for officer view (officers see total system reports)

      if (countError) {
        throw countError;
      }
      setTotalReports(count || 0);

      // Fetch total number of resolved reports by the current officer
      const { count: resolvedCount, error: resolvedCountError } = await supabase
        .from("resolved_reports")
        .select("id", { count: "exact" })
        .eq("user_id", session.user.id);

      if (resolvedCountError) {
        throw resolvedCountError;
      }
      setResolvedReportsCount(resolvedCount || 0);

      // Fetch total number of rejected reports by the current officer
      const { count: rejectedCount, error: rejectedCountError } = await supabase
        .from("rejected_reports")
        .select("id", { count: "exact" })
        .eq("user_id", session.user.id);

      if (rejectedCountError) {
        throw rejectedCountError;
      }
      setRejectedReportsCount(rejectedCount || 0);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unknown error occurred while fetching data.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel("custom-index-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reports" },
        (payload) => {
          fetchData();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSearch = async (query: string) => {
    if (!query) {
      clearSearch(); // Clear results if query becomes empty
      return;
    }
    setSearching(true);
    setSearchError(null);
    try {
      // Search across all reports (officer view)
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .or(
          `title.ilike.%${query}%,description.ilike.%${query}%,report_number.ilike.%${query}%`,
        );

      if (error) {
        throw error;
      }
      setSearchResults(data);
      setShowSearchResults(true);
    } catch (error) {
      if (error instanceof Error) {
        setSearchError(error.message);
      } else {
        setSearchError("An unknown error occurred during search.");
      }
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setShowSearchResults(false);
    setSearchResults([]);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <DashboardStackHeader />
      <ScrollView>
        <WelcomeUser />

        <View style={{ padding: 20 }}>
          <SearchBox onSearch={handleSearch} searching={searching} />
          <View style={styles.metricCardsContainer}>
            <View style={styles.cardWrapper}>
              <DashboardMetricCard
                icon="bar-chart-outline"
                title="Total Reports"
                value={totalReports}
                color={Colors.blue}
              />
            </View>
            <View style={styles.cardWrapper}>
              <DashboardMetricCard
                icon="checkmark-circle-outline"
                title="Resolved Reports"
                value={resolvedReportsCount}
                color={Colors.green}
              />
            </View>
            <View style={styles.cardWrapper}>
              <DashboardMetricCard
                icon="close-circle-outline"
                title="Rejected Reports"
                value={rejectedReportsCount}
                color={Colors.red}
              />
            </View>
          </View>
          {/* Removed Create a Report button as per prompt */}
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          <Text style={styles.latestReportsTitle}>Today&apos;s Reports</Text>
          {/* Changed title */}
          {loading ? (
            <ActivityIndicator size="large" color={Colors.primary} />
          ) : error ? (
            <Text>{error}</Text>
          ) : reports.length === 0 ? (
            <Text>No reports found for today.</Text>
          ) : (
            reports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  latestReportsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  searchResultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
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
