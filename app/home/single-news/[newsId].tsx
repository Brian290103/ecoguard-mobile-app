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

export default function NewsDetails() {
  const { newsId } = useLocalSearchParams();
  const [news, setNews] = useState<News | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!newsId || typeof newsId !== "string") {
          setError("Invalid News ID provided.");
          setLoading(false);
          return;
        }

        // Fetch news details
        const { data: newsData, error: newsError } = await supabase
          .from("news")
          .select("*")
          .eq("id", newsId)
          .single();

        if (newsError) {
          throw newsError;
        }
        setNews(newsData);
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

    if (newsId) {
      fetchData();
    }
  }, [newsId]);

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

  if (!news) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFoundText}>News not found.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        <Stack.Screen options={{ title: news.title }} />

        {news.poster_url && (
          <Image source={{ uri: news.poster_url }} style={styles.newsPoster} />
        )}

        <Text style={styles.newsTitle}>{news.title}</Text>
        <Text style={styles.newsCaption}>{news.caption}</Text>
        <Text style={styles.newsDescription}>{news.description}</Text>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Created At:</Text>
          <Text style={styles.value}>
            {new Date(news.created_at).toLocaleString()}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Last Updated:</Text>
          <Text style={styles.value}>
            {new Date(news.updated_at).toLocaleString()}
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
  newsPoster: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
    resizeMode: "cover",
  },
  newsTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
  },
  newsCaption: {
    fontSize: 16,
    color: "#666",
    marginBottom: 15,
    lineHeight: 22,
  },
  newsDescription: {
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 24,
    color: "#555",
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 8,
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
