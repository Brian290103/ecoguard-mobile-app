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
import { Image } from "expo-image";
import Colors from "@/lib/colors";
import Styles from "@/lib/styles";
import { supabase } from "@/lib/supabase";
import { Report } from "@/lib/types";
import ReportCard from "@/components/ReportCard";
import SearchBox from "@/components/SearchBox";
import DashboardMetricCard from "@/components/DashboardMetricCard";
import LatestReportsList from "@/components/LatestReportsList";
import LatestEventsList from "@/components/LatestEventsList";
import LatestNewsList from "@/components/LatestNewsList";
import LatestResourcesList from "@/components/LatestResourcesList";
import DashboardHeader from "@/components/DashboardHeader";
import NotificationButton from "@/components/NotificationButton";
import ListHeader from "@/components/ListHeader";

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

      const { data: reportsData, error: reportsError } = await supabase
        .from("reports")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(3);

      if (reportsError) {
        throw reportsError;
      }
      setReports(reportsData);

      const { count, error: countError } = await supabase
        .from("reports")
        .select("id", { count: "exact" })
        .eq("user_id", session.user.id);

      if (countError) {
        throw countError;
      }
      setTotalReports(count || 0);

      // Fetch total number of resolved reports by the current user
      const { count: resolvedCount, error: resolvedCountError } = await supabase
        .from("reports")
        .select("id", { count: "exact" })
        .eq("user_id", session.user.id)
        .eq("status", "resolved");

      if (resolvedCountError) {
        throw resolvedCountError;
      }
      setResolvedReportsCount(resolvedCount || 0);

      // Fetch total number of rejected reports by the current user
      const { count: rejectedCount, error: rejectedCountError } = await supabase
        .from("reports")
        .select("id", { count: "exact" })
        .eq("user_id", session.user.id)
        .eq("status", "rejected");

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
    if (!query) return;
    setSearching(true);
    setSearchError(null);
    try {
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
      <Stack.Screen
        options={{
          headerTitle: "",
          headerLeft: () => <DashboardHeader />,
          headerRight: () => <NotificationButton />,
        }}
      />

      <ScrollView>
        {/*<WelcomeUser />*/}

        <View style={{ paddingHorizontal: 20 }}>
          <Image
            source={require("@/assets/images/banner.png")}
            style={{ width: "100%", height: 170, borderRadius: 20 }}
          />
        </View>
        <View style={{ padding: 20 }}>
          <SearchBox onSearch={handleSearch} searching={searching} />

          {searchResults.length > 0 && (
            <View
              style={{
                backgroundColor: Colors.background,
                borderRadius: 5,
                padding: 10,
              }}
            >
              <ListHeader
                title="Search Results"
                linkText="Clear"
                onPressLink={() => clearSearch()}
              />
              {searchResults.map((result) => (
                <View key={result.id} style={styles.searchResultItem}>
                  <ReportCard report={result} />
                </View>
              ))}
            </View>
          )}

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
          <TouchableOpacity
            style={Styles.primaryButton}
            onPress={() => router.push("/home/user/create-report")}
          >
            <Text style={Styles.primaryButtonText}>Create a Report</Text>
          </TouchableOpacity>
        </View>
        <LatestReportsList />
        <LatestNewsList />
        <LatestEventsList />
        <LatestResourcesList />
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
