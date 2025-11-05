import {
  SectionList,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import CommunityCard from "@/components/CommunityCard";
import Colors from "@/lib/colors";
import { format } from "date-fns";

interface Community {
  id: string;
  created_at: string;
  name: string;
  about: string;
  icon: string;
}

interface CommunitySection {
  title: string;
  data: Community[];
}

interface CommunityListProps {
  communities: Community[];
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  onRefresh: () => void;
}

const groupCommunitiesByDate = (
  communities: Community[],
): CommunitySection[] => {
  const grouped: { [key: string]: Community[] } = {};

  communities.forEach((communityItem) => {
    const date = format(new Date(communityItem.created_at), "PPP"); // e.g., October 24th, 2025
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(communityItem);
  });

  return Object.keys(grouped)
    .map((date) => ({
      title: date,
      data: grouped[date],
    }))
    .sort((a, b) => new Date(b.title).getTime() - new Date(a.title).getTime()); // Sort sections by date, newest first
};

export default function CommunityList({
  communities,
  loading,
  error,
  refreshing,
  onRefresh,
}: CommunityListProps) {
  const communitySections = groupCommunitiesByDate(communities);

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
      {communitySections.length === 0 ? (
        <Text style={styles.noCommunitiesText}>No communities found.</Text>
      ) : (
        <SectionList
          sections={communitySections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <CommunityCard community={item} />}
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
    paddingBottom: 80, // To ensure CreateCommunityFloatingButton doesn't cover content
  },
  noCommunitiesText: {
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
