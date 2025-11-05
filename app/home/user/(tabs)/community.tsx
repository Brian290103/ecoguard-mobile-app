import { useCallback, useState, useEffect } from "react";
import {
  View,
  RefreshControl,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Stack } from "expo-router";
import { supabase } from "@/lib/supabase";
import CommunityCard from "@/components/CommunityCard";
import Colors from "@/lib/colors";

interface CommunityItem {
  id: string;
  name: string;
  about: string;
  icon: string;
  created_at: string;
  user_id: string;
}

type Tab = "Joined" | "Discover";

export default function Community() {
  const [allCommunities, setAllCommunities] = useState<CommunityItem[]>([]);
  const [joinedCommunityIds, setJoinedCommunityIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<Tab>("Joined");

  const fetchCommunities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userData?.user) {
        setError("User not logged in.");
        setLoading(false);
        return;
      }
      const userId = userData.user.id;

      // Fetch joined communities
      const { data: participantsData, error: participantsError } =
        await supabase
          .from("comm_participants")
          .select("comm_id")
          .eq("user_id", userId);

      if (participantsError) {
        throw participantsError;
      }
      const joinedIds = participantsData?.map((p) => p.comm_id) || [];
      setJoinedCommunityIds(joinedIds);

      // Fetch all communities
      const { data: communitiesData, error: communitiesError } = await supabase
        .from("community")
        .select("*")
        .order("created_at", { ascending: false });

      if (communitiesError) {
        throw communitiesError;
      }
      setAllCommunities(communitiesData as CommunityItem[]);
    } catch (err: any) {
      console.error("Error fetching communities:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCommunities();

    const channel = supabase
      .channel("realtime-community")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "community" },
        () => {
          fetchCommunities();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comm_participants" },
        () => {
          fetchCommunities();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCommunities]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCommunities();
    setRefreshing(false);
  }, [fetchCommunities]);

  const filteredCommunities = allCommunities.filter((community) =>
    selectedTab === "Joined"
      ? joinedCommunityIds.includes(community.id)
      : !joinedCommunityIds.includes(community.id),
  );

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      {(["Joined", "Discover"] as Tab[]).map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.tab, selectedTab === tab && styles.selectedTab]}
          onPress={() => setSelectedTab(tab)}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === tab && styles.selectedTabText,
            ]}
          >
            {tab === "Joined" ? "Joined Communities" : "Discover Communities"}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{ title: "Community", headerShadowVisible: false }}
        />
        {renderTabs()}
        <ActivityIndicator
          size="large"
          color={Colors.primary}
          style={styles.loader}
        />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{ title: "Community", headerShadowVisible: false }}
        />
        {renderTabs()}
        <View style={styles.emptyStateContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{ title: "Community", headerShadowVisible: false }}
      />
      {renderTabs()}
      <View style={{ flex: 1 }}>
        {filteredCommunities.length > 0 ? (
          <FlatList
            data={filteredCommunities}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <CommunityCard community={item} />}
            contentContainerStyle={styles.listContentContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[Colors.primary]}
                tintColor={Colors.primary}
              />
            }
          />
        ) : (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>
              {selectedTab === "Joined"
                ? "You haven't joined any communities yet."
                : "No new communities to discover."}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  tabsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    width: "100%",
    elevation: 2,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    width: "50%",
    justifyContent: "center",
    alignItems: "center",
  },
  selectedTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    color: Colors.primary,
    fontWeight: "bold",
  },
  selectedTabText: {
    color: "#fff",
  },
  listContentContainer: {
    padding: 20,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.gray[600],
    textAlign: "center",
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: "center",
  },
});
