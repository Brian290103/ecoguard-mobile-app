import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import Colors from "@/lib/colors";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { getAbbreviation } from "@/lib/utils";
import { saveActionMessage } from "@/utils/chatActions";

interface Community {
  id: string;
  name: string;
  about: string;
  icon: string;
  created_at: string;
  user_id: string;
}

interface OrganizationProfile {
  name: string;
  logo: string | null;
}

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  avatar: string | null;
  role: string;
}

interface CommunityCardProps {
  community: Community;
  isDetailed?: boolean;
}

export default function CommunityCard({ community, isDetailed = false }: CommunityCardProps) {
  const router = useRouter();
  const [organizationProfile, setOrganizationProfile] =
    useState<OrganizationProfile | null>(null);
  const [authorProfile, setAuthorProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const handlePress = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: participantData, error: participantError } = await supabase
      .from("comm_participants")
      .select("id")
      .eq("user_id", user.id)
      .eq("comm_id", community.id)
      .single();

    if (participantError && participantError.code !== 'PGRST116') {
      console.error("Error checking participation:", participantError);
      Alert.alert("Error", "Failed to check community participation.");
      return;
    }

    if (participantData) {
      // User is already a participant, navigate directly
      router.push(`/home/single-community/${community.id}`);
    } else {
      // User is not a participant, ask to join
      Alert.alert(
        "Join Community",
        "Do you want to join this community?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Join",
            onPress: async () => {
              const { error: joinError } = await supabase.from("comm_participants").insert([
                { user_id: user.id, comm_id: community.id },
              ]);
              if (joinError) {
                console.error("Error joining community:", joinError);
                Alert.alert("Error", "Failed to join community.");
              } else {
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
                    community.id,
                    user.id,
                    `${userName} has joined the community.`,
                    "community",
                  );
                }
                router.push(`/home/single-community/${community.id}`);
              }
            },
          },
        ],
      );
    }
  };

  useEffect(() => {
    const fetchAuthorDetails = async () => {
      if (!isDetailed || !community.user_id) {
        setLoading(false);
        return;
      }
      try {
        const { data: profileData, error: profileError } = await supabase
          .from("profile")
          .select("id, first_name, last_name, avatar, role")
          .eq("id", community.user_id)
          .single();

        if (profileError) {
          throw profileError;
        }

        if (profileData) {
          setAuthorProfile(profileData as UserProfile);

          if (profileData.role === "org") {
            const { data: orgData, error: orgError } = await supabase
              .from("org_reps")
              .select("organization:organizations (name, logo)")
              .eq("user_id", community.user_id)
              .limit(1);

            if (orgError) {
              throw orgError;
            }

            if (orgData && orgData.length > 0 && orgData[0].organization) {
              setOrganizationProfile(
                orgData[0].organization as OrganizationProfile,
              );
            }
          }
        }
      } catch (error) {
        console.error("Error fetching author details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAuthorDetails();
  }, [isDetailed, community.user_id]);

  const renderAuthor = () => {
    if (loading) {
      return <ActivityIndicator size="small" color={Colors.gray} />;
    }

    if (!authorProfile) {
      return <Text style={styles.authorName}>Author Unknown</Text>;
    }

    if (authorProfile.role === "org" && organizationProfile) {
      return (
        <View style={styles.authorContainer}>
          {organizationProfile.logo ? (
            <Image
              source={{ uri: organizationProfile.logo }}
              style={styles.authorAvatar}
            />
          ) : (
            <View style={styles.authorAvatarPlaceholder}>
              <Text style={styles.authorAvatarText}>
                {getAbbreviation(
                  organizationProfile.name.split(" ")[0],
                  organizationProfile.name.split(" ").slice(1).join(" "),
                )}
              </Text>
            </View>
          )}
          <Text style={styles.authorName}>{organizationProfile.name}</Text>
        </View>
      );
    }

    if (authorProfile.role === "officer" || authorProfile.role === "user") {
      return (
        <View style={styles.authorContainer}>
          {authorProfile.avatar ? (
            <Image
              source={{ uri: authorProfile.avatar }}
              style={styles.authorAvatar}
            />
          ) : (
            <View style={styles.authorAvatarPlaceholder}>
              <Text style={styles.authorAvatarText}>
                {getAbbreviation(
                  authorProfile.first_name,
                  authorProfile.last_name,
                )}
              </Text>
            </View>
          )}
          <Text style={styles.authorName}>
            {authorProfile.first_name} {authorProfile.last_name}
          </Text>
        </View>
      );
    }

    return <Text style={styles.authorName}>Author Unknown</Text>;
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.communityContainer}
    >
      <View style={styles.topView}>
        {community.icon && (
          <Image source={{ uri: community.icon }} style={styles.communityImage} />
        )}
        <View style={styles.centerView}>
          <Text style={styles.communityName}>{community.name}</Text>
          <Text style={styles.communityAbout}>
            {isDetailed ? community.about : community.about.substring(0, 100) + "..."}
          </Text>
        </View>
      </View>
      {isDetailed && (
        <View style={styles.bottomView}>
          <Text style={styles.descriptionText}>{community.about}</Text>
          <Text style={styles.dateText}>
            Created at: {new Date(community.created_at).toLocaleDateString()}
          </Text>
          {renderAuthor()}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  communityContainer: {
    backgroundColor: "#fff",
    borderRadius: 5,
    marginBottom: 15,
    elevation: 0.5,
    width: "100%",
  },
  topView: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
  },
  communityImage: {
    width: 60,
    height: 60,
    borderRadius: 30, // Make it fully rounded
    marginRight: 15,
    resizeMode: "cover",
  },
  centerView: {
    flex: 1,
  },
  communityName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  communityAbout: {
    fontSize: 14,
    color: Colors.gray,
  },
  bottomView: {
    paddingHorizontal: 15,
    paddingBottom: 15,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    marginTop: 10,
    paddingTop: 10,
  },
  descriptionText: {
    fontSize: 14,
    color: "#555",
    marginBottom: 10,
  },
  dateText: {
    fontSize: 12,
    color: "#666",
  },
  authorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  authorAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  authorAvatarPlaceholder: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.primary,
    marginRight: 10,
  },
  authorAvatarText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: "bold",
  },
  authorName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
});
