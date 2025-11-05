import { View } from "react-native";
import CreateEventFloatingButton from "@/components/CreateEventFloatingButton";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import EventList from "@/components/EventList";
import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { UserProfile } from "@/lib/types";

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

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const fetchUserEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        setError("User not authenticated.");
        setLoading(false);
        return;
      }

      // Fetch user profile to determine role
      const { data: profileData, error: profileError } = await supabase
        .from("profile")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profileError || !profileData) {
        setError("Could not fetch user profile.");
        setLoading(false);
        return;
      }

      setUserProfile(profileData);

      let eventsQuery = supabase.from("events").select("*");

      if (profileData.role !== "user") {
        // Officer and Org roles only see their own events
        eventsQuery = eventsQuery.eq("user_id", session.user.id);
      }

      const { data: eventsData, error: fetchError } = await eventsQuery.order(
        "created_at",
        { ascending: false },
      );

      if (fetchError) {
        throw fetchError;
      }
      setEvents(eventsData || []);
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

  useEffect(() => {
    fetchUserEvents();

    const channel = supabase
      .channel("events-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events" },
        () => {
          fetchUserEvents();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUserEvents();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <EventList events={events} loading={loading} error={error} refreshing={refreshing} onRefresh={handleRefresh} />
      {userProfile && userProfile.role !== "user" && <CreateEventFloatingButton />}
    </SafeAreaView>
  );
}