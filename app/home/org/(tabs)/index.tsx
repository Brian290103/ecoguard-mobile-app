import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity, // Added back for Clear Search button
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import DashboardMetricCardList from "@/components/DashboardMetricCardList";
import DashboardStackHeader from "@/components/DashboardStackHeader";
import ReportCard from "@/components/ReportCard";
import SearchBox from "@/components/SearchBox";
import WelcomeOrgRep from "@/components/WelcomeOrgRep";
import WelcomeUser from "@/components/WelcomeUser";
import Colors from "@/lib/colors";
import {
  getAssignedReports,
  getAssignedReportsMetrics,
  getOrganizationId,
  searchAssignedReports,
} from "@/lib/orgReports";
import { supabase } from "@/lib/supabase";
import { Report } from "@/lib/types"; // Explicitly import Report type

export default function User() {
  // router is not used in the provided code block, so useRouter import and router declaration are removed.
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [totalReports, setTotalReports] = useState(0);
  const [resolvedReportsCount, setResolvedReportsCount] = useState(0);
  const [rejectedReportsCount, setRejectedReportsCount] = useState(0);
  const [newsCount, setNewsCount] = useState(0);
  const [eventsCount, setEventsCount] = useState(0);
  const [resourcesCount, setResourcesCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Report[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  // Memoize fetchData with useCallback to ensure it's stable and doesn't cause unnecessary re-renders in useEffect
  const fetchData = useCallback(async () => {
    setLoading(true); // Ensure loading is active for every data fetch
    setError(null); // Clear previous errors
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

      // Calculate today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1); // Start of tomorrow

      const todayStart = today.toISOString();
      const todayEnd = tomorrow.toISOString();

      // Fetch organization_id from org_reps table
      const orgId = await getOrganizationId(session.user.id);

      if (!orgId) {
        setError("Organization not found or not approved.");
        setLoading(false);
        return;
      }
      setOrganizationId(orgId); // Update state

      // Fetch news count for the logged-in user
      const { count: userNewsCount, error: newsError } = await supabase
        .from("news")
        .select("id", { count: "exact" })
        .eq("user_id", session.user.id);

      if (newsError) {
        throw newsError;
      }
      setNewsCount(userNewsCount || 0);

      // Fetch events count for the logged-in user
      const { count: userEventsCount, error: eventsError } = await supabase
        .from("events")
        .select("id", { count: "exact" })
        .eq("user_id", session.user.id);

      if (eventsError) {
        throw eventsError;
      }
      setEventsCount(userEventsCount || 0);

      // Fetch resources count for the logged-in user
      const { count: userResourcesCount, error: resourcesError } = await supabase
        .from("resources")
        .select("id", { count: "exact" })
        .eq("user_id", session.user.id);

      if (resourcesError) {
        throw resourcesError;
      }
      setResourcesCount(userResourcesCount || 0);

      // Fetch assigned reports
      const reportsData = await getAssignedReports(
        orgId, // Use the fetched orgId
        todayStart,
        todayEnd,
      );
      setReports(reportsData);

      const assignedReportIds = reportsData.map((report) => report.id);

      // Fetch metrics for assigned reports
      const { total, resolved, rejected } = await getAssignedReportsMetrics(
        orgId, // Use the fetched orgId
        assignedReportIds,
      );
      setTotalReports(total);
      setResolvedReportsCount(resolved);
      setRejectedReportsCount(rejected);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unknown error occurred while fetching data.");
      }
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array means this function is created once and stable

  useEffect(() => {
    fetchData(); // Call fetchData on component mount

    const channel = supabase
      .channel("custom-index-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reports" },
        () => {
          // payload is unused, so it's removed
          fetchData(); // Re-fetch data on database changes
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]); // Dependency array includes fetchData to ensure the effect re-runs if fetchData changes (which it won't with useCallback([]))

  const handleSearch = async (query: string) => {
    if (!query) {
      clearSearch();
      return;
    }
    if (!organizationId) {
      setSearchError("Organization ID not available for search.");
      return;
    }
    setSearching(true);
    setSearchError(null);
    try {
      const data = await searchAssignedReports(organizationId, query);
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
  }; // Fixed missing closing brace

  const metricCardsData = [
    {
      icon: "bar-chart-outline" as keyof typeof Ionicons.glyphMap,
      title: "Total Reports",
      value: totalReports,
      color: Colors.blue,
      url: "/home/org/(tabs)/reports",
    },
    {
      icon: "checkmark-circle-outline" as keyof typeof Ionicons.glyphMap,
      title: "Resolved Reports",
      value: resolvedReportsCount,
      color: Colors.green,
      url: "/home/org/(tabs)/reports",
    },
    {
      icon: "close-circle-outline" as keyof typeof Ionicons.glyphMap,
      title: "Rejected Reports",
      value: rejectedReportsCount,
      color: Colors.red,
      url: "/home/org/(tabs)/reports",
    },
    {
      icon: "newspaper-outline" as keyof typeof Ionicons.glyphMap,
      title: "News",
      value: newsCount,
      color: Colors.orange,
      url: "/home/news",
    },
    {
      icon: "calendar-outline" as keyof typeof Ionicons.glyphMap,
      title: "Events",
      value: eventsCount,
      color: Colors.purple,
      url: "/home/events",
    },
    {
      icon: "book-outline" as keyof typeof Ionicons.glyphMap,
      title: "Resources",
      value: resourcesCount,
      color: Colors.teal,
      url: "/home/resources",
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <DashboardStackHeader />

      <ScrollView>
        <WelcomeUser />
        {/* Only show WelcomeOrgRep if an organization ID has been successfully fetched */}
        {organizationId && <WelcomeOrgRep />}

        <View style={{ padding: 20 }}>
          <SearchBox onSearch={handleSearch} searching={searching} />
          <DashboardMetricCardList cards={metricCardsData} />
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          {showSearchResults ? (
            <View>
              <View style={styles.searchResultsHeader}>
                <Text style={styles.latestReportsTitle}>Search Results</Text>
                <TouchableOpacity onPress={clearSearch}>
                  <Text style={{ color: Colors.primary }}>Clear Search</Text>
                </TouchableOpacity>
              </View>
              {searching ? (
                <ActivityIndicator size="large" color={Colors.primary} />
              ) : searchError ? (
                <Text>{searchError}</Text>
              ) : searchResults.length === 0 ? (
                <Text>No results found.</Text>
              ) : (
                searchResults.map((report) => (
                  <ReportCard key={report.id} report={report} />
                ))
              )}
            </View>
          ) : (
            <>
              <Text style={styles.latestReportsTitle}>
                Today&apos;s Reports
              </Text>
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
            </>
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
});
