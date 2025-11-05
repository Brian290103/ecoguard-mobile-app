import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import Styles from "@/lib/styles";
import { supabase } from "@/lib/supabase";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  AppState,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import Colors from "@/lib/colors";

AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

const FormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(1, { message: "Password is required." }),
});

type FormData = z.infer<typeof FormSchema>;

export default function Login() {
  const router = useRouter();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: "saitah+user@proton.me",
      password: "1Pass!@#$",
    },
  });
  const [loading, setLoading] = useState(false);

  async function signInWithEmail(data: FormData) {
    setLoading(true);

    const { error, data: user } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    console.log({ error });
    console.log({ user });

    if (error) {
      Toast.show({
        type: "error",
        text1: "Sign In Error",
        text2: error.message,
      });
    } else {
      router.replace("/home");
    }
    setLoading(false);
  }

  return (
    <View style={Styles.container}>
      <Stack.Screen
        options={{
          title: "Login",
        }}
      />

      <Text style={Styles.inputLabel}>Email</Text>
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={Styles.input}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            placeholder="email@address.com"
            autoCapitalize="none"
            keyboardType="email-address"
          />
        )}
      />
      {errors.email && (
        <Text style={Styles.inputError}>{errors.email.message}</Text>
      )}

      <Text style={Styles.inputLabel}>Password</Text>
      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={Styles.input}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            secureTextEntry
            placeholder="Password"
            autoCapitalize="none"
          />
        )}
      />
      {errors.password && (
        <Text style={Styles.inputError}>{errors.password.message}</Text>
      )}

      <View style={{ gap: 10, marginTop: 20 }}>
        <TouchableOpacity
          style={Styles.primaryButton}
          onPress={handleSubmit(signInWithEmail)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={"white"} />
          ) : (
            <Text style={Styles.primaryButtonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/auth/register")}>
          <Text style={{ textAlign: "center", color: Colors.primary }}>
            Don&apos;t have an account? Sign Up
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
