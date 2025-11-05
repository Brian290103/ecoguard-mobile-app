import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import Colors from "@/lib/colors";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          onPress: async () => {
            setLoading(true);
            try {
              const { error } = await supabase.auth.signOut();
              if (error) {
                throw error;
              }
              Toast.show({
                type: "success",
                text1: "Logged Out",
                text2: "You have been successfully logged out.",
              });
              router.replace("/");
            } catch (error) {
              if (error instanceof Error) {
                Toast.show({
                  type: "error",
                  text1: "Logout Error",
                  text2: error.message,
                });
              } else {
                Toast.show({
                  type: "error",
                  text1: "Logout Error",
                  text2: "An unknown error occurred.",
                });
              }
            } finally {
              setLoading(false);
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  return (
    <View style={styles.logoutButtonContainer}>
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text style={styles.logoutButtonText}>Logout</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  logoutButtonContainer: {
    margin: 10,
    backgroundColor: Colors.white,
    borderRadius: 5,
    padding: 20,
    elevation: 0.5,
    width: "100%",
  },
  logoutButton: {
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    height: 40,
    backgroundColor: Colors.red,
  },
  logoutButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
});
