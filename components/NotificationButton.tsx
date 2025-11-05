import { Pressable, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Colors from "@/lib/colors";
import { useUnreadNotificationsCount } from "@/hooks/useUnreadNotificationsCount";

export default function NotificationButton() {
  const router = useRouter();
  const unreadCount = useUnreadNotificationsCount();

  return (
    <Pressable
      style={styles.container}
      onPress={() => {
        router.push("/home/notifications");
      }}
    >
      <Ionicons
        name="notifications-outline"
        size={24}
        color={Colors.primary}
      />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginRight: 20,
    position: "relative",
  },
  badge: {
    position: "absolute",
    right: -5,
    top: -5,
    backgroundColor: "red",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
});
