import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { supabase } from "@/lib/supabase";

export default function Layout() {
  const [userRole, setUserRole] = useState<string | null>(null);
  // const { expoPushToken, notification } = usePushNotifications();

  useEffect(() => {
    const fetchUserRole = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile, error } = await supabase
          .from("profile")
          .select("role")
          .eq("id", session.user.id)
          .single();
        if (profile) {
          setUserRole(profile.role);
        }
      }
    };
    fetchUserRole();
  }, []);

  // useEffect(() => {
  //   if (notification) {
  //     Alert.alert(
  //       notification.request.content.title || "Notification",
  //       notification.request.content.body,
  //     );
  //   }
  // }, [notification]);
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="user" options={{ headerShown: false }} />
      <Stack.Screen name="officer" options={{ headerShown: false }} />
      <Stack.Screen name="org" options={{ headerShown: false }} />

      <Stack.Screen name="single-report" options={{ headerShown: false }} />
      <Stack.Screen name="single-event" options={{ headerShown: false }} />
      <Stack.Screen name="single-community" options={{ headerShown: false }} />

      <Stack.Screen
        name="news"
        options={{
          title: userRole === "user" ? "All News" : "My Posted News",
        }}
      />
      <Stack.Screen
        name="events"
        options={{
          title: userRole === "user" ? "All Events" : "My Posted Events",
        }}
      />
      <Stack.Screen
        name="resources"
        options={{
          title: userRole === "user" ? "All Resources" : "My Posted Resources",
        }}
      />
    </Stack>
  );
}
