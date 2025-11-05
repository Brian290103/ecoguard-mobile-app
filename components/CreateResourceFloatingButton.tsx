import React, { useState, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/lib/colors";
import Toast from "react-native-toast-message";
import { supabase } from "@/lib/supabase";
import CreateResourceModal from "@/components/modal/CreateResourceModal";

export default function CreateResourceFloatingButton() {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        setUserId(session.user.id);
      } else {
        Toast.show({
          type: "error",
          text1: "Authentication Error",
          text2: "User not logged in.",
        });
      }
      setLoadingUser(false);
    };

    fetchUser();
  }, []);

  if (loadingUser || userId === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <>
      {userId !== null && (
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setIsFormVisible(true)}
        >
          <Ionicons name="add-circle" size={50} color={Colors.primary} />
        </TouchableOpacity>
      )}

      <CreateResourceModal
        isVisible={isFormVisible}
        onClose={() => setIsFormVisible(false)}
        userId={userId}
      />

      <Toast />
    </>
  );
}

const styles = StyleSheet.create({
  createButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    zIndex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
