import { View } from "react-native";
import CreateNewsModal from "@/components/modal/CreateNewsModal";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import NewsList from "@/components/NewsList";
import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { UserProfile } from "@/lib/types";

interface News {
  id: string;
  created_at: string;
  title: string;
  description: string;
  poster_url: string;
  updated_at: string;
  user_id: string;
}

export default function News() {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const fetchUserNews = async () => {
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

      let newsQuery = supabase.from("news").select("*");

      if (profileData.role !== "user") {
        // Officer and Org roles only see their own news
        newsQuery = newsQuery.eq("user_id", session.user.id);
      }

      const { data: newsData, error: fetchError } = await newsQuery.order(
        "created_at",
        { ascending: false },
      );

      if (fetchError) {
        throw fetchError;
      }
      setNews(newsData || []);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred while fetching news.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserNews();

    const channel = supabase
      .channel("news-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "news" },
        () => {
          fetchUserNews();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUserNews();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <NewsList
        news={news}
        loading={loading}
        error={error}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />
      {userProfile && userProfile.role !== "user" && <CreateNewsModal />}
    </SafeAreaView>
  );
}
