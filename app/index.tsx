import { useNotification } from "@/context/NotificationContext";
import Colors from "@/lib/colors";
import Styles from "@/lib/styles";
import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";
import { Image } from "expo-image";
import { Redirect, useNavigation, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  const { notification, expoPushToken, error } = useNotification();

  const navigation = useNavigation();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  useEffect(() => {
    const fetchSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    fetchSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return null; // You might want to render a loading spinner or splash screen here
  }

  if (session) {
    console.log({ session });
    // If a session exists, redirect to the authenticated home page
    return <Redirect href="/home" />;
  }

  if (error) {
    return <Text>Error: {error.message}</Text>;
  }

  console.log(
    "EXPO",
    JSON.stringify(notification?.request.content.data, null, 2),
  );
  return (
    <SafeAreaView
      style={{
        flex: 1,
        justifyContent: "flex-end",
        alignItems: "center",
        backgroundColor: Colors.background,
      }}
    >
      <View
        style={{
          padding: 20,
          backgroundColor: "white",
          borderTopStartRadius: 40,
          borderTopEndRadius: 40,
          width: "100%",
        }}
      >
        <Image
          source={require("@/assets/images/logo.png")}
          style={{ width: 80, height: 80, marginBottom: 10 }}
        />
        <Text
          style={{
            fontSize: 24,
            fontWeight: 600,
            color: Colors.primary,
            marginBottom: 10,
          }}
        >
          EcoGuard
        </Text>
        <Text style={{ marginBottom: 10 }}>
          Empowering citizens to protect the environment, one report at a time.
        </Text>

        <View style={{ gap: 10, marginTop: 20 }}>
          <TouchableOpacity
            onPress={() => router.push("/auth/login")}
            style={Styles.primaryButton}
          >
            <Text style={Styles.primaryButtonText}>Continue</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/auth/register")}
            style={Styles.outlineButton}
          >
            <Text style={Styles.outlineButtonText}>Create an Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
