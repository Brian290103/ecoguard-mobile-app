import React, { useEffect, useState } from "react";
import { ScrollView, View, Text, ActivityIndicator, StyleSheet } from "react-native";
import ListHeader from "@/components/ListHeader";
import { supabase } from "@/lib/supabase";
import NewsCard from "@/components/NewsCard";
import Colors from "@/lib/colors";
import { router } from "expo-router";

interface News {
  id: string;
  created_at: string;
  title: string;
  description: string;
  caption: string;
  poster_url: string;
  updated_at: string;
  user_id: string;
}

export default function LatestNewsList() {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLatestNews = async () => {
      try {
        const { data, error } = await supabase
          .from("news")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5);

        if (error) {
          throw error;
        }
        setNews(data);
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

    fetchLatestNews();

    const channel = supabase
      .channel("latest-news-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "news" },
        (payload) => {
          fetchLatestNews();
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

  if (news.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noNewsText}>No latest news available.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ListHeader
        title="Latest News"
        linkText="View All"
        onPressLink={() => router.push("/home/news")}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalScrollContainer}
      >
        {news.map((item) => (
          <NewsCard key={item.id} news={item} isDetailed={false} />
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
  noNewsText: {
    textAlign: "center",
    color: Colors.gray,
  },
  horizontalScrollContainer: {
    paddingRight: 20, // Add some padding at the end of the scroll view
  },
});
