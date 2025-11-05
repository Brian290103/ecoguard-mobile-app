import { Text, View, ActivityIndicator, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { UserProfile } from "@/lib/types";
import UserProfileForm from "@/components/UserProfileForm";
import OfficerAdditionalInformationForm from "@/components/OfficerAdditionalInformationForm";
import LogoutButton from "@/components/LogoutButton";
import LocationUpdateForm from "@/components/LocationUpdateForm";
import Colors from "@/lib/colors";

export default function Profile() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        setIsAuthenticated(false);
        setUserProfile(null);
        setLoading(false);
        return;
      }

      setIsAuthenticated(true);
      const { data: profile, error: profileError } = await supabase
        .from("profile")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profileError || !profile) {
        console.error("Error fetching user profile:", profileError);
        setUserProfile(null);
      } else {
        setUserProfile(profile);
      }
      setLoading(false);
    };

    fetchUserProfile();
  }, []);

  const handleProfileUpdated = (updatedProfile: UserProfile) => {
    setUserProfile(updatedProfile);
  };

  if (loading) {
    return (
      <SafeAreaView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (!isAuthenticated || !userProfile) {
    return (
      <SafeAreaView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <Text>Please log in to view your profile.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        paddingHorizontal: 10,
      }}
    >
      <Stack.Screen options={{ title: "Profile" }} />
      <ScrollView style={{ flex: 1 }}>
        <UserProfileForm
          userProfile={userProfile}
          onProfileUpdated={handleProfileUpdated}
        />

        <Text
          style={{
            fontSize: 16,
            fontWeight: "bold",
            marginTop: 10,
            marginHorizontal: 10,
          }}
        >
          Additional Information
        </Text>

        <OfficerAdditionalInformationForm
          userProfile={userProfile}
          onProfileUpdated={handleProfileUpdated}
        />

        <Text
          style={{
            fontSize: 16,
            fontWeight: "bold",
            marginTop: 10,
            marginHorizontal: 10,
          }}
        >
          Location Information
        </Text>
        <LocationUpdateForm
          userProfile={userProfile}
          onProfileUpdated={handleProfileUpdated}
        />

        <Text
          style={{
            fontSize: 16,
            fontWeight: "bold",
            marginTop: 10,
            marginHorizontal: 10,
          }}
        >
          SignOut
        </Text>
        <LogoutButton />
      </ScrollView>
    </SafeAreaView>
  );
}
