import React, { useEffect, useState } from "react";
import { ScrollView, View, Text, ActivityIndicator, StyleSheet } from "react-native";
import ListHeader from "@/components/ListHeader";
import { supabase } from "@/lib/supabase";
import EventCard from "@/components/EventCard";
import Colors from "@/lib/colors";
import { router } from "expo-router";

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

export default function LatestEventsList() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLatestEvents = async () => {
      try {
        const { data, error } = await supabase
          .from("events")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5);

        if (error) {
          throw error;
        }
        setEvents(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred while fetching events.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLatestEvents();

    const channel = supabase
      .channel("latest-events-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events" },
        (payload) => {
          fetchLatestEvents();
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

  if (events.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noEventsText}>No latest events available.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ListHeader
        title="Latest Events"
        linkText="View All"
        onPressLink={() => router.push("/home/events")}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalScrollContainer}
      >
        {events.map((item) => (
          <EventCard key={item.id} event={item} isDetailed={false} />
        ))}
      </ScrollView>
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
  noEventsText: {
    textAlign: "center",
    color: Colors.gray,
  },
  horizontalScrollContainer: {
    paddingRight: 20, // Add some padding at the end of the scroll view
  },
});
