import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import Colors from "@/lib/colors";
import { supabase } from "@/lib/supabase";
import type { Report } from "@/lib/types";
import MediaTab from "@/components/MediaTab";
import LocationTab from "@/components/LocationTab";
import TimelineTab from "@/components/TimelineTab";
import MoreTab from "@/components/MoreTab"; // Import the new MoreTab component
import { getStatusColor } from "@/lib/statusColors";
import Ionicons from "@expo/vector-icons/Ionicons";
import ReportActions from "@/components/ReportActions";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ReportDetails() {
  const { reportId } = useLocalSearchParams();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<"officer" | "nat" | "org" | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<
    "media" | "location" | "timeline" | "more"
  >("media");

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!reportId || typeof reportId !== "string") {
          setError("Invalid Report ID provided.");
          setLoading(false);
          return;
        }

        // Fetch report details
        const { data: reportData, error: reportError } = await supabase
          .from("reports")
          .select("*")
          .eq("id", reportId)
          .single();

        if (reportError) {
          throw reportError;
        }
        setReport(reportData);

        // Fetch user role
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          const { data: profile, error: profileError } = await supabase
            .from("profile")
            .select("role")
            .eq("id", session.user.id)
            .single();

          if (profileError) {
            throw profileError;
          }
          setUserRole(profile.role);
        }
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("An unknown error occurred.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (reportId) {
      fetchData();
    }

    // Set up real-time subscription
    const reportSubscription = supabase
      .channel(`report:${reportId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "reports",
          filter: `id=eq.${reportId}`,
        },
        (payload) => {
          setReport(payload.new as Report);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(reportSubscription);
    };
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

  if (!report) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFoundText}>Report not found.</Text>
      </View>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "media":
        return <MediaTab report={report} />;
      case "location":
        return <LocationTab report={report} />;
      case "timeline":
        return <TimelineTab reportId={report.id} />;
      case "more":
        return <MoreTab report={report} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        <Stack.Screen options={{ title: `#${report.report_number}` }} />

        <Text style={styles.reportTitle}>{report.title}</Text>
        <Text style={styles.reportDescription}>{report.description}</Text>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Status:</Text>
          <View
            style={[
              styles.statusContainer,
              { backgroundColor: getStatusColor(report.status) },
            ]}
          >
            <Text style={styles.statusText}>{report.status}</Text>
          </View>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Report Number:</Text>
          <Text style={styles.value}>{report.report_number}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Created At:</Text>
          <Text style={styles.value}>
            {new Date(report.created_at).toLocaleString()}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Last Updated:</Text>
          <Text style={styles.value}>
            {new Date(report.updated_at).toLocaleString()}
          </Text>
        </View>

        {userRole && report && (
          <ReportActions role={userRole} report={report} />
        )}

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "media" && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab("media")}
          >
            <Ionicons
              name="image"
              size={20}
              color={activeTab === "media" ? Colors.primary : "#666"}
            />
            <Text
              style={[
                styles.tabButtonText,
                activeTab === "media" && styles.activeTabButtonText,
              ]}
            >
              Media
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "location" && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab("location")}
          >
            <Ionicons
              name="location"
              size={20}
              color={activeTab === "location" ? Colors.primary : "#666"}
            />
            <Text
              style={[
                styles.tabButtonText,
                activeTab === "location" && styles.activeTabButtonText,
              ]}
            >
              Location
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "timeline" && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab("timeline")}
          >
            <Ionicons
              name="time"
              size={20}
              color={activeTab === "timeline" ? Colors.primary : "#666"}
            />
            <Text
              style={[
                styles.tabButtonText,
                activeTab === "timeline" && styles.activeTabButtonText,
              ]}
            >
              Timeline
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "more" && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab("more")}
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={20}
              color={activeTab === "more" ? Colors.primary : "#666"}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.tabContent}>{renderTabContent()}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
  },
  reportTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  reportDescription: {
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 24,
    color: "#555",
    paddingHorizontal: 20,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    marginRight: 5,
    color: "#333",
  },
  value: {
    fontSize: 14,
    color: "#666",
    flexShrink: 1,
  },
  statusContainer: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 5,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    textTransform: "capitalize",
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
    marginTop: 20,
  },
  tabButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#666",
  },
  activeTabButtonText: {
    color: Colors.primary,
  },
  tabContent: {
    flex: 1,
  },
  errorText: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
  },
  notFoundText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});
