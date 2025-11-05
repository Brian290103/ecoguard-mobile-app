import Colors from "@/lib/colors";
import { supabase } from "@/lib/supabase";
import { UserProfile } from "@/lib/types";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkSessionAndRedirect = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session || !session.user) {
        router.replace("/auth/login");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profile")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (error || !profile) {
        // This can happen if profile creation failed after sign up,
        // or if there's a network issue. Signing them out is a safe fallback.
        await supabase.auth.signOut();
        router.replace("/auth/login");
      } else {
        router.replace(`/home/${profile.role}`);
      }
    };

    checkSessionAndRedirect();
  }, [router]);

  // This component will only show a loading indicator while it determines where to redirect the user.
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}
