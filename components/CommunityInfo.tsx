import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { Community } from "@/lib/types";
import Colors from "@/lib/colors";

interface CommunityInfoProps {
  community: Community;
}

const CommunityInfo = ({ community }: CommunityInfoProps) => {
  return (
    <View style={styles.infoContainer}>
      <Image source={{ uri: community.icon }} style={styles.icon} />
      <Text style={styles.communityName}>{community.name}</Text>
      <Text style={styles.communityAbout}>{community.about}</Text>
      {community.profiles?.full_name && (
        <Text style={styles.communityAuthor}>
          Created by {community.profiles.full_name}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  infoContainer: {
    marginTop: 10,
    alignItems: "center",
  },
  communityName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    color: Colors.gray[800],
  },
  communityAbout: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: "center",
    color: Colors.gray[700],
  },
  communityAuthor: {
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
    color: Colors.gray[600],
  },
  icon: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    alignSelf: "center",
    marginBottom: 20,
  },
});

export default CommunityInfo;
