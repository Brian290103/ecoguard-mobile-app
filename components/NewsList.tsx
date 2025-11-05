import { SectionList, StyleSheet, Text, View, ActivityIndicator, RefreshControl } from "react-native";
import NewsCard from "@/components/NewsCard";
import Colors from "@/lib/colors";
import { format } from "date-fns";

interface News {
  id: string;
  created_at: string;
  title: string;
  description: string;
  poster_url: string;
  updated_at: string;
  user_id: string;
}

interface NewsSection {
  title: string;
  data: News[];
}

interface NewsListProps {
  news: News[];
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  onRefresh: () => void;
}

const groupNewsByDate = (news: News[]): NewsSection[] => {
  const grouped: { [key: string]: News[] } = {};

  news.forEach((newsItem) => {
    const date = format(new Date(newsItem.created_at), "PPP"); // e.g., October 24th, 2025
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(newsItem);
  });

  return Object.keys(grouped)
    .map((date) => ({
      title: date,
      data: grouped[date],
    }))
    .sort((a, b) => new Date(b.title).getTime() - new Date(a.title).getTime()); // Sort sections by date, newest first
};

export default function NewsList({ news, loading, error, refreshing, onRefresh }: NewsListProps) {
  const newsSections = groupNewsByDate(news);

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
      {newsSections.length === 0 ? (
        <Text style={styles.noNewsText}>No news posts found.</Text>
      ) : (
        <SectionList
          sections={newsSections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <NewsCard news={item} isDetailed={true} />}
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
    paddingBottom: 80, // To ensure CreateNewsModal doesn't cover content
  },
  noNewsText: {
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
