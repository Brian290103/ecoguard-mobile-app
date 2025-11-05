import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
} from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import Colors from "@/lib/colors";
import { supabase } from "@/lib/supabase";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";

interface Event {
  id: string;
  created_at: string;
  title: string;
  description: string;
  poster_url: string;
  start_date: string;
  start_time: string;
  event_fees: number;
  location: string;
  updated_at: string;
  user_id: string;
}

export default function EventDetails() {
  const { eventId } = useLocalSearchParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!eventId || typeof eventId !== "string") {
          setError("Invalid Event ID provided.");
          setLoading(false);
          return;
        }

        // Fetch event details
        const { data: eventData, error: eventError } = await supabase
          .from("events")
          .select("*")
          .eq("id", eventId)
          .single();

        if (eventError) {
          throw eventError;
        }
        setEvent(eventData);
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

    if (eventId) {
      fetchData();
    }
  }, [eventId]);

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

  if (!event) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFoundText}>Event not found.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        <Stack.Screen options={{ title: event.title }} />

        {event.poster_url && (
          <Image source={{ uri: event.poster_url }} style={styles.eventPoster} />
        )}

        <Text style={styles.eventTitle}>{event.title}</Text>
        <Text style={styles.eventDescription}>{event.description}</Text>

        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={18} color={Colors.gray} style={styles.icon} />
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.value}>
            {format(new Date(event.start_date), "PPP")}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={18} color={Colors.gray} style={styles.icon} />
          <Text style={styles.label}>Time:</Text>
          <Text style={styles.value}>
            {event.start_time.substring(0, 5)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={18} color={Colors.gray} style={styles.icon} />
          <Text style={styles.label}>Location:</Text>
          <Text style={styles.value}>{event.location}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="pricetag-outline" size={18} color={Colors.gray} style={styles.icon} />
          <Text style={styles.label}>Fees:</Text>
          <Text style={styles.value}>
            {event.event_fees === 0 ? "Free" : `Ksh ${event.event_fees}`}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Created At:</Text>
          <Text style={styles.value}>
            {new Date(event.created_at).toLocaleString()}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Last Updated:</Text>
          <Text style={styles.value}>
            {new Date(event.updated_at).toLocaleString()}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    paddingHorizontal: 20,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
  },
  eventPoster: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
    resizeMode: "cover",
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
  },
  eventDescription: {
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 24,
    color: "#555",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  icon: {
    marginRight: 5,
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
