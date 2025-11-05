import { SectionList, StyleSheet, Text, View, ActivityIndicator, RefreshControl } from "react-native";
import EventCard from "@/components/EventCard";
import Colors from "@/lib/colors";
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

interface EventSection {
  title: string;
  data: Event[];
}

interface EventListProps {
  events: Event[];
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  onRefresh: () => void;
}

const groupEventsByDate = (events: Event[]): EventSection[] => {
  const grouped: { [key: string]: Event[] } = {};

  events.forEach((eventItem) => {
    const date = format(new Date(eventItem.start_date), "PPP"); // e.g., October 24th, 2025
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(eventItem);
  });

  return Object.keys(grouped)
    .map((date) => ({
      title: date,
      data: grouped[date],
    }))
    .sort((a, b) => new Date(b.title).getTime() - new Date(a.title).getTime()); // Sort sections by date, newest first
};

export default function EventList({ events, loading, error, refreshing, onRefresh }: EventListProps) {
  const eventSections = groupEventsByDate(events);

  if (loading && !refreshing) {
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

  return (
    <View style={{ flex: 1 }}>
      {eventSections.length === 0 ? (
        <Text style={styles.noEventsText}>No events found.</Text>
      ) : (
        <SectionList
          sections={eventSections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <EventCard event={item} isDetailed={true} />}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.sectionHeader}>{title}</Text>
          )}
          contentContainerStyle={styles.sectionListContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "red",
    fontSize: 16,
  },
  sectionListContent: {
    paddingHorizontal: 20,
    paddingBottom: 80, // To ensure CreateEventFloatingButton doesn't cover content
  },
  noEventsText: {
    fontSize: 16,
    color: Colors.gray,
    textAlign: "center",
    marginTop: 20,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 15,
  },
});
