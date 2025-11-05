import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  SectionList,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { ReportHistory } from "@/lib/types";
import Colors from "@/lib/colors";
import { getStatusColor } from "@/lib/statusColors";

interface TimelineTabProps {
  reportId: string;
}

// Helper function to sort history items by created_at in descending order
const sortReportHistory = (items: ReportHistory[]) => {
  return [...items].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
};

export default function TimelineTab({ reportId }: TimelineTabProps) {
  const [history, setHistory] = useState<ReportHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reportId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null); // Clear previous errors when reportId changes or effect reruns

    // --- Supabase Realtime Subscription ---
    const channel = supabase
      .channel(`report_history_changes:${reportId}`) // Unique channel name for this report
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all events: INSERT, UPDATE, DELETE
          schema: "public",
          table: "report_history",
          filter: `report_id=eq.${reportId}`,
        },
        (payload) => {
          setHistory((currentHistory) => {
            let updatedHistory = [...currentHistory]; // Create a mutable copy

            if (payload.eventType === "INSERT") {
              const newRecord = payload.new as ReportHistory;
              updatedHistory.push(newRecord);
            } else if (payload.eventType === "UPDATE") {
              const updatedRecord = payload.new as ReportHistory;
              updatedHistory = updatedHistory.map((item) =>
                item.id === updatedRecord.id ? updatedRecord : item,
              );
            } else if (payload.eventType === "DELETE") {
              const deletedRecordId = (payload.old as ReportHistory).id;
              updatedHistory = updatedHistory.filter(
                (item) => item.id !== deletedRecordId,
              );
            }
            // Always re-sort the history after a real-time change to maintain order
            return sortReportHistory(updatedHistory);
          });
        },
      )
      .subscribe(); // Start listening for changes

    // --- Initial data fetch ---
    const fetchInitialHistory = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from("report_history")
          .select("*")
          .eq("report_id", reportId)
          .order("created_at", { ascending: false }); // Initial fetch already applies sorting

        if (fetchError) {
          throw fetchError;
        }
        setHistory(data || []); // Set initial data (already sorted)
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred while fetching report history.");
        }
      } finally {
        setLoading(false); // Initial load complete, regardless of success or failure
      }
    };

    fetchInitialHistory(); // Trigger initial fetch

    // Cleanup function: unsubscribe from the Supabase channel
    return () => {
      channel.unsubscribe();
    };
  }, [reportId]); // Re-run effect if reportId changes

  const groupHistoryByDate = (reportHistory: ReportHistory[]) => {
    const grouped: { [key: string]: ReportHistory[] } = {};
    reportHistory.forEach((item) => {
      const date = new Date(item.created_at).toLocaleDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(item);
    });

    return Object.keys(grouped).map((date) => ({
      title: date,
      data: grouped[date],
    }));
  };

  const sectionedData = groupHistoryByDate(history);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color={Colors.primary}
          style={{ marginVertical: 20 }}
        />
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

  if (history.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.noHistoryText}>
          No history available for this report.
        </Text>
      </View>
    );
  }

  return (
    <SectionList
      scrollEnabled={false}
      sections={sectionedData}
      keyExtractor={(item) => item.id}
      renderSectionHeader={({ section: { title } }) => (
        <Text style={styles.sectionHeader}>{title}</Text>
      )}
      renderItem={({ item }) => (
        <View style={styles.historyItem}>
          <Text style={styles.historyTime}>
            {new Date(item.created_at).toLocaleTimeString()}
          </Text>
          <View style={styles.historyDetails}>
            <Text style={styles.historyNotes}>{item.notes}</Text>
            <View
              style={[
                styles.statusContainer,
                { backgroundColor: getStatusColor(item.status) },
              ]}
            >
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
          </View>
        </View>
      )}
      style={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    backgroundColor: "#f0f0f0",
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 5,
    borderRadius: 5,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  historyTime: {
    fontSize: 14,
    color: "#888",
    marginRight: 10,
    width: 80, // Fixed width for time to align notes
  },
  historyDetails: {
    flex: 1,
  },
  historyNotes: {
    fontSize: 16,
    marginBottom: 5,
  },
  statusContainer: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 5,
    alignSelf: "flex-start", // Align status to the start of its container
  },
  statusText: {
    color: "white",
    fontSize: 12,
    textTransform: "capitalize",
  },
  errorText: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
  },
  noHistoryText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});
