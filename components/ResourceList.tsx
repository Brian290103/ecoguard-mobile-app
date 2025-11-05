import {
  SectionList,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import ResourceCard from "@/components/ResourceCard";
import Colors from "@/lib/colors";
import { format } from "date-fns";

interface Resource {
  id: string;
  created_at: string;
  title: string;
  caption: string;
  poster_url: string;
  type: string;
  resource_url: string;
  user_id: string;
}

interface ResourceSection {
  title: string;
  data: Resource[];
}

interface ResourceListProps {
  resources: Resource[];
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  onRefresh: () => void;
}

const groupResourcesByDate = (resources: Resource[]): ResourceSection[] => {
  const grouped: { [key: string]: Resource[] } = {};

  resources.forEach((resourceItem) => {
    const date = format(new Date(resourceItem.created_at), "PPP"); // e.g., October 24th, 2025
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(resourceItem);
  });

  return Object.keys(grouped)
    .map((date) => ({
      title: date,
      data: grouped[date],
    }))
    .sort((a, b) => new Date(b.title).getTime() - new Date(a.title).getTime()); // Sort sections by date, newest first
};

export default function ResourceList({
  resources,
  loading,
  error,
  refreshing,
  onRefresh,
}: ResourceListProps) {
  const resourceSections = groupResourcesByDate(resources);

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
      {resourceSections.length === 0 ? (
        <Text style={styles.noResourcesText}>No resources found.</Text>
      ) : (
        <SectionList
          sections={resourceSections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ResourceCard isDetailed={true} resource={item} />
          )}
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
    paddingBottom: 80, // To ensure CreateResourceFloatingButton doesn't cover content
  },
  noResourcesText: {
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
