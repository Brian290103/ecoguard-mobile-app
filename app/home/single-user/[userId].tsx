import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import React, { useEffect, useState } from "react";
import { Stack, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";
import Styles from "@/lib/styles";
import Colors from "@/lib/colors";
import Chat from '@/components/Chat';

const SingleUserChat = () => {
  const { userId } = useLocalSearchParams();
  const [receiverProfile, setReceiverProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchReceiverProfile = async () => {
      const { data: profileData, error: profileError } = await supabase
        .from("profile")
        .select("first_name, last_name")
        .eq("id", userId)
        .single();

      if (profileError) {
        console.error("Error fetching receiver profile:", profileError);
      } else {
        setReceiverProfile(profileData);
      }

      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    fetchReceiverProfile();
  }, [userId]);

  if (loading) {
    return (
      <View style={Styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!receiverProfile) {
    return (
      <View style={Styles.container}>
        <Text>User not found.</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: `${receiverProfile.first_name} ${receiverProfile.last_name}`,
        }}
      />
      <View style={styles.container}>
        <Chat type="single" receiverId={userId as string} user={user} />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});

export default SingleUserChat;
