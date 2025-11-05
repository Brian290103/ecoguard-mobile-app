import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import Colors from "@/lib/colors";
import { Community } from "@/lib/types"; // Assuming you have a Community type defined
import CommunityInfo from "@/components/CommunityInfo";
import { useRouter } from "expo-router";
import { getAbbreviation } from "@/lib/utils";
import { saveActionMessage } from "@/utils/chatActions";

interface CommunityInfoModalProps {
  isVisible: boolean;
  onClose: () => void;
  community: Community | null;
}

const CommunityInfoModal = ({
  isVisible,
  onClose,
  community,
}: CommunityInfoModalProps) => {
  const router = useRouter();
  const [participants, setParticipants] = useState<any[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(true);
  const [leavingCommunity, setLeavingCommunity] = useState(false);

  const handleLeaveCommunity = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    Alert.alert(
      "Leave Community",
      "Are you sure you want to leave this community?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Leave",
          onPress: async () => {
            setLeavingCommunity(true);
            try {
              const { error } = await supabase
                .from("comm_participants")
                .delete()
                .eq("user_id", user.id)
                .eq("comm_id", community?.id);

              if (error) {
                throw error;
              }

              // Fetch user profile to get their name for the action message
              const { data: profileData, error: profileError } = await supabase
                .from("profile")
                .select("first_name, last_name,role")
                .eq("id", user.id)
                .single();

              if (profileError) {
                console.error("Error fetching user profile:", profileError);
              } else if (profileData) {
                const userName = `${profileData.first_name} ${profileData.last_name}`;
                community &&
                  (await saveActionMessage(
                    community.id,
                    user.id,
                    `${userName} has left the community.`,
                    "community",
                  ));
              }

              Toast.show({
                type: "success",
                text1: "Community Left",
                text2: "You have successfully left the community.",
              });
              onClose(); // Close the modal
              router.replace(
                profileData?.role
                  ? `/home/${profileData?.role}/community`
                  : `/home`,
              );
            } catch (error) {
              if (error instanceof Error) {
                Toast.show({
                  type: "error",
                  text1: "Error Leaving Community",
                  text2: error.message,
                });
              } else {
                Toast.show({
                  type: "error",
                  text1: "Error Leaving Community",
                  text2: "An unknown error occurred.",
                });
              }
            } finally {
              setLeavingCommunity(false);
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  useEffect(() => {
    if (community?.id) {
      const fetchParticipants = async () => {
        setLoadingParticipants(true);
        const { data: participantsData, error: participantsError } =
          await supabase
            .from("comm_participants")
            .select("user_id")
            .eq("comm_id", community.id);

        if (participantsError) {
          console.error("Error fetching participants:", participantsError);
          setLoadingParticipants(false);
          return;
        }

        const participantIds = participantsData.map((p) => p.user_id);

        const { data: profilesData, error: profilesError } = await supabase
          .from("profile")
          .select("id, first_name, last_name, avatar")
          .in("id", participantIds);

        if (profilesError) {
          console.error("Error fetching participant profiles:", profilesError);
        } else {
          setParticipants(profilesData);
        }
        setLoadingParticipants(false);
      };
      fetchParticipants();
    }
  }, [community?.id]);

  if (!community) {
    return null; // Or render a loading/error state
  }

  return (
    <Modal
      visible={isVisible}
      onRequestClose={onClose}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Community Information</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.gray[700]} />
          </TouchableOpacity>
        </View>
        <CommunityInfo
          community={community}
          style={styles.communityInfoContainer}
        />
        <Text style={styles.participantsTitle}>Participants</Text>
        {loadingParticipants ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : (
          <FlatList
            data={participants}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  onClose(); // Close the modal
                  router.push(`/home/single-user/${item.id}`);
                }}
              >
                <View style={styles.participantContainer}>
                  {item.avatar ? (
                    <Image
                      source={{ uri: item.avatar }}
                      style={styles.participantAvatar}
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarText}>
                        {getAbbreviation(item.first_name, item.last_name)}
                      </Text>
                    </View>
                  )}
                  <Text
                    style={styles.participantName}
                  >{`${item.first_name} ${item.last_name}`}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
        <View style={styles.leaveButtonContainer}>
          <TouchableOpacity
            style={styles.leaveButton}
            onPress={handleLeaveCommunity}
            disabled={leavingCommunity}
          >
            {leavingCommunity ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.leaveButtonText}>Leave Community</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingTop: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.lightGray,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.gray[800],
  },
  communityInfoContainer: {
    marginBottom: 20,
  },
  participantsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    color: Colors.gray[800],
  },
  participantContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.lightGray,
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  participantName: {
    fontSize: 16,
    color: Colors.gray[700],
  },
  closeButton: {
    padding: 5,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.primary,
    marginRight: 10,
  },
  avatarText: {
    color: Colors.primary,
    fontSize: 18,
    fontWeight: "bold",
  },
  leaveButtonContainer: {
    marginTop: 20,
    marginBottom: 10,
  },
  leaveButton: {
    backgroundColor: Colors.red,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  leaveButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default CommunityInfoModal;
