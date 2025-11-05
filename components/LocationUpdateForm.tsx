import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Location from "expo-location";
import Toast from "react-native-toast-message";
import { supabase } from "@/lib/supabase";
import Styles from "@/lib/styles";
import Colors from "@/lib/colors";
import type { UserProfile } from "@/lib/types";

interface LocationUpdateFormProps {
  userProfile: UserProfile;
  onProfileUpdated: (updatedProfile: UserProfile) => void;
}

export default function LocationUpdateForm({
  userProfile,
  onProfileUpdated,
}: LocationUpdateFormProps) {
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const hasLocation =
    userProfile.latitude !== null && userProfile.longitude !== null;

  useEffect(() => {
    // Optionally, you could try to get the current location on mount
    // or just wait for the user to press the button.
    // For now, we'll just rely on the button press.
  }, []);

  const getLocationAndSave = async () => {
    setLoading(true);
    setErrorMsg(null);
    Toast.show({
      type: "info",
      text1: "Getting Location",
      text2: "Please wait while we fetch your current location...",
    });

    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        const message = "Permission to access location was denied.";
        setErrorMsg(message);
        Toast.show({
          type: "error",
          text1: "Permission Denied",
          text2: message,
        });
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);

      const updates = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("profile")
        .update(updates)
        .eq("id", userProfile.id);

      if (error) {
        throw error;
      }

      Toast.show({
        type: "success",
        text1: "Location Updated",
        text2: "Your location has been successfully updated.",
      });
      onProfileUpdated({ ...userProfile, ...updates });
    } catch (error) {
      if (error instanceof Error) {
        Toast.show({
          type: "error",
          text1: "Location Update Error",
          text2: error.message,
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Location Update Error",
          text2: "An unknown error occurred.",
        });
      }
      console.error("Location update error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.formContainer}>
      {hasLocation ? (
        <View style={styles.locationDisplay}>
          <Text style={styles.locationText}>
            Latitude: {userProfile.latitude?.toFixed(4)}
          </Text>
          <Text style={styles.locationText}>
            Longitude: {userProfile.longitude?.toFixed(4)}
          </Text>
        </View>
      ) : (
        <Text style={styles.noLocationText}>
          No location set. Please set your location.
        </Text>
      )}

      {errorMsg && <Text style={Styles.inputError}>{errorMsg}</Text>}

      <TouchableOpacity
        style={Styles.primaryButton}
        onPress={getLocationAndSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text style={Styles.primaryButtonText}>
            {hasLocation ? "Update Location" : "Set Location"}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    padding: 20,
    marginHorizontal: 10,
    backgroundColor: "white",
    borderRadius: 5,
    elevation: 0.5,
    marginTop: 10,
    marginBottom: 10,
    width: "100%",
  },
  locationDisplay: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: Colors.lightGray,
    borderRadius: 5,
  },
  locationText: {
    fontSize: 16,
    color: Colors.darkGray,
    marginBottom: 5,
  },
  noLocationText: {
    fontSize: 16,
    color: Colors.gray,
    marginBottom: 15,
    textAlign: "center",
    fontStyle: "italic",
  },
});
