import { Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View, Text } from "react-native";
import { supabase } from "@/lib/supabase";
import type { UserProfile } from "@/lib/types";
import LocationUpdateForm from "@/components/LocationUpdateForm";
import OfficerAdditionalInformationForm from "@/components/OfficerAdditionalInformationForm";
import LogoutButton from "@/components/LogoutButton";
import { SafeAreaView } from "react-native-safe-area-context";
import Colors from "@/lib/colors";

export default function Layout() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data, error } = await supabase
          .from("profile")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
        } else if (data) {
          setUserProfile(data);
        }
      }
      setLoading(false);
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    if (!userProfile?.id) return; // Only subscribe if userProfile.id is available

    const channel = supabase
      .channel('public:profile')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profile',
          filter: `id=eq.${userProfile.id}`, // Only listen for updates to the current user's profile
        },
        (payload) => {
          if (payload.new) {
            setUserProfile(payload.new as UserProfile);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfile?.id]); // Re-subscribe if userProfile.id changes

  const handleProfileUpdated = (updatedProfile: UserProfile) => {
    setUserProfile(updatedProfile);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text>Loading profile...</Text>
      </View>
    );
  }

  if (!userProfile) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Error: User profile not found.</Text>
      </View>
    );
  }

  const isLocationMissing =
    userProfile.latitude === null || userProfile.longitude === null;
  const isOfficerInfoMissing =
    !userProfile.county || !userProfile.sub_county || !userProfile.job_title;
  const isApproved = userProfile.is_approved;

  if (isLocationMissing || isOfficerInfoMissing) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          padding: 20,
          backgroundColor: Colors.primary,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            marginBottom: 10,
            backgroundColor: "white",
            padding: 20,
            marginHorizontal: 10,
            borderRadius: 5,
            width: "100%",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            elevation: 0.5,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "bold",
              marginBottom: 10,
              textAlign: "center",
              color: Colors.primary,
            }}
          >
            Complete Your Profile & Location
          </Text>
          <Text style={{ textAlign: "center" }}>
            Please provide your missing profile details and current location.
            This information is required to access the full functionality of the
            app.
          </Text>
        </View>

        {isOfficerInfoMissing && (
          <OfficerAdditionalInformationForm
            userProfile={userProfile}
            onProfileUpdated={handleProfileUpdated}
          />
        )}
        {isLocationMissing && (
          <LocationUpdateForm
            userProfile={userProfile}
            onProfileUpdated={handleProfileUpdated}
          />
        )}

        <LogoutButton />
      </SafeAreaView>
    );
  }

  if (!isApproved) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          padding: 20,
          backgroundColor: Colors.red,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            marginBottom: 10,
            backgroundColor: "white",
            padding: 20,
            marginHorizontal: 10,
            borderRadius: 5,
            width: "100%",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            elevation: 0.5,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "bold",
              marginBottom: 10,
              textAlign: "center",
              color: Colors.red,
            }}
          >
            Account Pending Approval
          </Text>
          <Text
            style={{
              textAlign: "center",
            }}
          >
            Your account is currently pending approval by an administrator. You
            will be able to access the app&apos;s features once your account has
            been approved.
          </Text>
        </View>
        <LogoutButton />
      </SafeAreaView>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
