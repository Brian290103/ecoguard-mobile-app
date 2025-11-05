import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  Linking, // Added Linking import
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import Colors from "@/lib/colors";
import type { User } from "@supabase/supabase-js";
import { Feather } from "@expo/vector-icons";
import referenceTableColors from "@/lib/referenceTableColors";

interface Notification {
  id: string;
  created_at: string;
  title: string;
  message: string;
  user_id: string;
  is_read: boolean;
  reference_table?: string;
  reference_row_id?: string;
}

type Tab = "Latest" | "All";

interface Section {
  title: string;
  data: Notification[];
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const groupNotificationsByDate = (notifications: Notification[]): Section[] => {
  if (!notifications || notifications.length === 0) {
    return [];
  }

  const grouped: { [key: string]: Notification[] } = {};
  for (const notification of notifications) {
    if (notification?.created_at) {
      const dateKey = formatDate(notification.created_at);
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(notification);
    }
  }

  const sections: Section[] = [];
  for (const dateKey in grouped) {
    if (Object.hasOwn(grouped, dateKey)) {
      sections.push({
        title: dateKey,
        data: grouped[dateKey],
      });
    }
  }

  return sections;
};

export default function Notifications() {
  const [notifications, setNotifications] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [selectedTab, setSelectedTab] = useState<Tab>("Latest");

  const fetchUserAndNotifications = useCallback(
    async (isRefreshing = false) => {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        let query = supabase
          .from("notifications")
          .select("*")
          .eq("user_id", session.user.id);

        if (selectedTab === "Latest") {
          const threeDaysAgo = new Date();
          threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
          query = query.gt("created_at", threeDaysAgo.toISOString());
        }

        const { data, error } = await query.order("created_at", {
          ascending: false,
        });

        if (error) {
          console.error("Error fetching notifications:", error);
          setNotifications([]);
        } else {
          setNotifications(groupNotificationsByDate(data as Notification[]));
        }
      } else {
        setNotifications([]);
      }
      setLoading(false);
      setRefreshing(false);
    },
    [selectedTab],
  );

  useEffect(() => {
    fetchUserAndNotifications();
  }, [fetchUserAndNotifications]);

  const onRefresh = useCallback(() => {
    fetchUserAndNotifications(true);
  }, [fetchUserAndNotifications]);

  useEffect(() => {
    if (user?.id) {
      const notificationChannel = supabase
        .channel("notifications_channel")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log("Change received!", payload);
            fetchUserAndNotifications(true);
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(notificationChannel);
      };
    }
  }, [user?.id, fetchUserAndNotifications]);

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    if (error) {
      console.error("Error marking notification as read:", error);
    } else {
      // No need to manually fetch, real-time subscription will handle the update
    }
  };

  const router = useRouter();

  const renderNotification = ({ item }: { item: Notification }) => {
    const handlePress = async () => {
      if (!item.is_read) {
        await markAsRead(item.id);
      }
      if (item.reference_table === "reports" && item.reference_row_id) {
        router.push(`/home/single-report/${item.reference_row_id}`);
      } else if (item.reference_table === "news" && item.reference_row_id) {
        router.push(`/home/single-news/${item.reference_row_id}`);
      } else if (item.reference_table === "events" && item.reference_row_id) {
        router.push(`/home/single-event/${item.reference_row_id}`);
      } else if (
        item.reference_table === "resources" &&
        item.reference_row_id
      ) {
        // Fetch resource_url from the 'resources' table
        const { data: resourceData, error: resourceError } = await supabase
          .from("resources")
          .select("resource_url")
          .eq("id", item.reference_row_id)
          .single();

        if (resourceError) {
          console.error("Error fetching resource URL:", resourceError);
        } else if (resourceData?.resource_url) {
          Linking.openURL(resourceData.resource_url).catch((err) =>
            console.error("Failed to open URL:", err),
          );
        }
      } else if (
        item.reference_table === "community" &&
        item.reference_row_id
      ) {
        router.push(`/home/single-community/${item.reference_row_id}`);
      }
    };

    const isClickable =
      (item.reference_table === "reports" ||
        item.reference_table === "news" ||
        item.reference_table === "events" ||
        item.reference_table === "resources" ||
        item.reference_table === "community") && // Added 'community'
      item.reference_row_id;

    let iconName: keyof typeof Feather.glyphMap = "bell";
    let itemColor = Colors.primary;

    if (item.reference_table === "reports") {
      iconName = "file-text"; // Using file-text for reports
      itemColor = referenceTableColors.reports || Colors.primary;
    } else if (item.reference_table === "news") {
      iconName = "book-open"; // Using book-open for news
      itemColor = referenceTableColors.news || Colors.primary;
    } else if (item.reference_table === "events") {
      iconName = "calendar"; // Using calendar for events
      itemColor = referenceTableColors.events || Colors.primary;
    } else if (item.reference_table === "resources") {
      // Added 'resources'
      iconName = "external-link"; // Using external-link for resources
      itemColor = referenceTableColors.resources || Colors.primary;
    } else if (item.reference_table === "community") {
      iconName = "users"; // Using users for community
      itemColor = referenceTableColors.community || Colors.primary;
    }

    return (
      <TouchableOpacity
        onPress={isClickable ? handlePress : undefined}
        disabled={!isClickable}
        style={[
          styles.notificationContainer,
          { backgroundColor: item.is_read ? "#fff" : Colors.background },
        ]}
      >
        <Feather
          name={iconName}
          size={24}
          color={itemColor}
          style={styles.icon}
        />
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationMessage}>{item.message}</Text>
          <View style={styles.notificationFooter}>
            <Text style={styles.notificationDate}>
              {new Date(item.created_at).toLocaleString()}
            </Text>
            {item.reference_table && (
              <View
                style={[
                  styles.referenceTableBadge,
                  { backgroundColor: itemColor },
                ]}
              >
                <Text style={styles.referenceTableText}>
                  {item.reference_table.toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      {/* Type assertion to ensure `tab` is `Tab` */}
      {(["Latest", "All"] as Tab[]).map((tab) => (
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
            {tab === "Latest" ? "Latest" : "All"}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{ title: "Notifications", headerShadowVisible: false }}
      />
      {renderTabs()}
      {loading ? (
        <ActivityIndicator
          size="large"
          color={Colors.primary}
          style={styles.loader}
        />
      ) : notifications.length > 0 ? (
        <SectionList
          sections={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.sectionHeader}>{title}</Text>
          )}
          contentContainerStyle={styles.listContainer}
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
        <View style={styles.noNotificationsContainer}>
          <Text style={styles.noNotificationsText}>
            {selectedTab === "Latest"
              ? "You have no notifications in the last 3 days."
              : "You have no notifications."}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  listContainer: {
    padding: 20,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  notificationContainer: {
    flexDirection: "row",
    padding: 15,
    borderRadius: 5,
    marginBottom: 15,
    elevation: 0.5,
  },
  icon: {
    marginRight: 15,
    alignSelf: "center",
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  notificationMessage: {
    fontSize: 14,
    color: "#333",
  },
  notificationFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  notificationDate: {
    fontSize: 12,
    color: "#999",
  },
  markAsReadButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  markAsReadButtonText: {
    color: "#fff",
    fontSize: 12,
  },
  noNotificationsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noNotificationsText: {
    fontSize: 18,
    color: "#666",
  },
  referenceTableBadge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  referenceTableText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
});
