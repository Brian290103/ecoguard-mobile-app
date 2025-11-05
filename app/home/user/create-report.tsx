import { useRouter } from "expo-router";
import { Text, View, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import React, { useState, useEffect } from "react";
import * as Location from "expo-location";
import Toast from "react-native-toast-message";

import { supabase } from "@/lib/supabase";
import ReportForm from "@/components/ReportForm";
import Colors from "@/lib/colors";

export default function CreateReport() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState("Getting user info...");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingMessage("Getting user info...");
        Toast.show({
          type: "info",
          text1: "Loading",
          text2: "Getting user info...",
        });
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session?.user) {
          const message = "User not authenticated";
          setErrorMsg(message);
          Toast.show({
            type: "error",
            text1: "Error",
            text2: message,
          });
          setLoading(false);
          return;
        }
        setUserId(session.user.id);
        setLoadingMessage("Getting your location...");
        Toast.show({
          type: "info",
          text1: "Loading",
          text2: "Getting your location...",
        });

        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          const message = "Permission to access location was denied";
          setErrorMsg(message);
          Toast.show({
            type: "error",
            text1: "Error",
            text2: message,
          });
          setLoading(false);
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        setLocation(location);
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Location fetched successfully",
        });
      } catch (error) {
        const message = "An error occurred while fetching data.";
        setErrorMsg(message);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: message,
        });
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: "Reports" }} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text>{loadingMessage}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (errorMsg) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: "Reports" }} />
        <View style={styles.center}>
          <Text>{errorMsg}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (userId && location) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <Stack.Screen options={{ title: "New Report" }} />
        <ReportForm
          userId={userId}
          latitude={location.coords.latitude}
          longitude={location.coords.longitude}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Reports" }} />
      <View style={styles.center}>
        <Text>Something went wrong.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
