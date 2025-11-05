import { Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View, Text } from "react-native";
import { supabase } from "@/lib/supabase";
import type { UserProfile, OrgRep } from "@/lib/types";
import LocationUpdateForm from "@/components/LocationUpdateForm";
import OfficerAdditionalInformationForm from "@/components/OfficerAdditionalInformationForm";
import LogoutButton from "@/components/LogoutButton";
import { SafeAreaView } from "react-native-safe-area-context";
import Colors from "@/lib/colors";
import OrganizationSelection from "@/components/OrganizationSelection";

export default function Layout() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [orgRep, setOrgRep] = useState<OrgRep | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasOrgRepLoaded, setHasOrgRepLoaded] = useState(false);

  const fetchProfileAndOrgRep = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Fetch User Profile
      const { data: profileData, error: profileError } = await supabase
        .from("profile")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
      } else if (profileData) {
        setUserProfile(profileData);
      }

      // Fetch OrgRep status
      const { data: orgRepData, error: orgRepError } = await supabase
        .from("org_reps")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (orgRepError && orgRepError.code !== "PGRST116") {
        // PGRST116 means no rows found
        console.error("Error fetching org rep status:", orgRepError);
      } else if (orgRepData) {
        setOrgRep(orgRepData);
      }
      setHasOrgRepLoaded(true);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfileAndOrgRep();
  }, []);

  useEffect(() => {
    if (!userProfile?.id) return; // Only subscribe if userProfile.id is available

    const profileChannel = supabase
      .channel("public:profile")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profile",
          filter: `id=eq.${userProfile.id}`, // Only listen for updates to the current user's profile
        },
        (payload) => {
          if (payload.new) {
            setUserProfile(payload.new as UserProfile);
          }
        },
      )
      .subscribe();

    const orgRepChannel = supabase
      .channel("public:org_reps")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "org_reps",
          filter: `user_id=eq.${userProfile.id}`,
        },
        (payload) => {
          if (payload.new) {
            setOrgRep(payload.new as OrgRep);
          } else if (payload.eventType === "DELETE") {
            setOrgRep(null);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(orgRepChannel);
    };
  }, [userProfile?.id]); // Re-subscribe if userProfile.id changes

  const handleProfileUpdated = (updatedProfile: UserProfile) => {
    setUserProfile(updatedProfile);
  };

  const handleOrgSelectionSuccess = () => {
    fetchProfileAndOrgRep(); // Re-fetch to update orgRep status
  };

  if (loading || !hasOrgRepLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text>Loading profile and organization status...</Text>
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

  const isApproved = userProfile.is_approved;

  // Org Rep specific logic
  if (!orgRep) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: Colors.background,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 20,
        }}
      >
        {/*<View style={{ flex: 1, width: "100%", paddingHorizontal: 20 }}>*/}
        <OrganizationSelection onSelectionSuccess={handleOrgSelectionSuccess} />
        {/*</View>*/}

        <LogoutButton />
      </SafeAreaView>
    );
  }

  if (!orgRep.is_approved) {
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
            Organization Selection Pending Approval
          </Text>
          <Text
            style={{
              textAlign: "center",
            }}
          >
            Your request to represent an organization is currently pending
            approval. You will be able to access the organization features once
            your selection has been approved.
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
