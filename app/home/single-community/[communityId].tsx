import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from "react-native";
import React, { useEffect, useState } from "react";
import { Stack, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";
import Styles from "@/lib/styles";
import Colors from "@/lib/colors";
import { Community } from "@/lib/types";
import Chat from '@/components/Chat';
import CommunityInfoModal from '@/components/modal/CommunityInfoModal';
import { saveActionMessage } from "@/utils/chatActions";

const CommunityDetails = () => {
  const { communityId } = useLocalSearchParams();
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isParticipant, setIsParticipant] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (communityId) {
      const fetchCommunity = async () => {
        const { data: communityData, error: communityError } = await supabase
          .from("community")
          .select("*")
          .eq("id", communityId)
          .single();

        if (communityError) {
          console.error("Error fetching community:", communityError);
          setLoading(false);
          return;
        }

        if (communityData && communityData.user_id) {
          const { data: profileData, error: profileError } = await supabase
            .from("profile")
            .select("first_name, last_name")
            .eq("id", communityData.user_id)
            .single();

          if (profileError) {
            console.error("Error fetching profile:", profileError);
            setCommunity({
              ...communityData,
              profiles: { full_name: "Unknown" },
            });
          } else {
            const fullName = `${profileData.first_name} ${profileData.last_name}`;
            setCommunity({
              ...communityData,
              profiles: { full_name: fullName },
            });
          }
        } else {
          setCommunity(communityData);
        }
        setLoading(false);

        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        if (user) {
          const { data: participantData, error: participantError } = await supabase
            .from("comm_participants")
            .select("id")
            .eq("user_id", user.id)
            .eq("comm_id", communityId)
            .single();

          if (participantError && participantError.code !== 'PGRST116') {
            console.error("Error checking participation:", participantError);
          } else if (participantData) {
            setIsParticipant(true);
          }


        }
        setCheckingStatus(false);
      };

      fetchCommunity();
    }
  }, [communityId]);

  const handleJoinCommunity = async () => {
    setIsJoining(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user && communityId) {
      const { error } = await supabase.from("comm_participants").insert([
        { user_id: user.id, comm_id: communityId },
      ]);
      if (error) {
        console.error("Error joining community:", error);
      } else {
        setIsParticipant(true);
        // Fetch user profile to get their name for the action message
        const { data: profileData, error: profileError } = await supabase
          .from("profile")
          .select("first_name, last_name")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error("Error fetching user profile:", profileError);
        } else if (profileData) {
          const userName = `${profileData.first_name} ${profileData.last_name}`;
          await saveActionMessage(
            communityId as string,
            user.id,
            `${userName} has joined the community.`,
            "community",
          );
        }
      }
    }
    setIsJoining(false);
  };

  if (loading) {
    return (
      <View style={Styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!community) {
    return (
      <View style={Styles.container}>
        <Text>Community not found.</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: community.name,
          headerRight: () => (
            <TouchableOpacity onPress={() => setIsModalVisible(true)}>
              <Image source={{ uri: community.icon }} style={styles.headerIcon} />
            </TouchableOpacity>
          ),
        }}
      />
      <View style={styles.container}>
        {checkingStatus ? (
          <ActivityIndicator size="large" color={Colors.primary} />
        ) : isParticipant ? (
          <Chat type="community" communityId={communityId as string} user={user} />
        ) : (
          <View style={styles.joinContainer}>
            <TouchableOpacity style={styles.joinButton} onPress={handleJoinCommunity} disabled={isJoining}>
              {isJoining ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.joinButtonText}>Join Community</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
      <CommunityInfoModal
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        community={community}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  joinContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  joinButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 20,
  },
  joinButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default CommunityDetails;
