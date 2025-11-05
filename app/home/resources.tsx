import CreateResourceFloatingButton from "@/components/CreateResourceFloatingButton";
import ResourceList from "@/components/ResourceList";
import { supabase } from "@/lib/supabase";
import Styles from "@/lib/styles";
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { UserProfile } from "@/lib/types";

interface Resource {
  id: string;
  created_at: string;
  title: string;
  caption: string;
  type: string;
  resource_url: string;
  poster_url: string;
  user_id: string;
}

export default function Resources() {
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState<Resource[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const fetchResources = async () => {
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

      let resourcesQuery = supabase.from("resources").select("*");

      if (profileData.role !== "user") {
        // Officer and Org roles only see their own resources
        resourcesQuery = resourcesQuery.eq("user_id", session.user.id);
      }

      const { data: resourcesData, error: fetchError } = await resourcesQuery.order(
        "created_at",
        { ascending: false },
      );

      if (fetchError) {
        throw fetchError;
      }
      setResources(resourcesData || []);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred while fetching resources.");
      }
    }
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();

    const channel = supabase
      .channel("resources-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "resources" },
        () => {
          fetchResources();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchResources();
    setRefreshing(false);
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={Styles.container}>
        <ResourceList
          resources={resources}
          loading={loading}
          error={error}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      </View>
      {userProfile && userProfile.role !== "user" && <CreateResourceFloatingButton />}
    </View>
  );
}
