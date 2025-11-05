import { useCallback, useState, useEffect } from "react";
import { View, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { supabase } from "@/lib/supabase";
import CommunityList from "@/components/CommunityList";
import CreateCommunityFloatingButton from "@/components/CreateCommunityFloatingButton";

export default function Community() {
  const [communities, setCommunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCommunities = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("community")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setCommunities(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCommunities();

    const channel = supabase
      .channel("community-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "community" },
        () => {
          fetchCommunities();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCommunities();
    setRefreshing(false);
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Stack.Screen options={{ title: "Community" }} />
      <View style={{ flex: 1 }}>
        <CommunityList
          communities={communities}
          loading={loading}
          error={error}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
        <CreateCommunityFloatingButton />
      </View>
    </SafeAreaView>
  );
}