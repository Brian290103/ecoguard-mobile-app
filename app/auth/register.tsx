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
import { Dropdown } from "react-native-element-dropdown";
import Toast from "react-native-toast-message";

AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

const FormSchema = z
  .object({
    firstName: z.string().min(1, { message: "First name is required." }),
    lastName: z.string().min(1, { message: "Last name is required." }),
    email: z.string().email({ message: "Please enter a valid email." }),
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters." }),
    confirmPassword: z
      .string()
      .min(6, { message: "Please confirm your password." }),
    role: z.string().min(1, { message: "Role is required." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof FormSchema>;

const roleData = [
  { label: "Citizen", value: "user" },
  { label: "County Officer", value: "officer" },
  { label: "Organization Representative", value: "org" },
  // { label: "National Agency Representative", value: "nat" },
];

export default function Register() {
  const router = useRouter();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      firstName: "Saitah",
      lastName: "Passiany",
      email: "saitah+user@proton.me",
      password: "1Pass!@#$",
      confirmPassword: "1Pass!@#$",
      role: "user",
    },
  });
  const [loading, setLoading] = useState(false);

  async function signUpWithEmail(data: FormData) {
    setLoading(true);

    // Check if a profile with this email already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from("profile")
      .select("id")
      .eq("email", data.email)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is PostgREST's code for "No rows found"
      Toast.show({
        type: "error",
        text1: "Sign Up Error",
        text2: checkError.message,
      });
      setLoading(false);
      return;
    }

    if (existingProfile) {
      Toast.show({
        type: "error",
        text1: "Sign Up Error",
        text2: "A user with this email address already exists.",
      });
      setLoading(false);
      return;
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    console.log({ user });
    console.log({ authError });
    if (authError) {
      Toast.show({
        type: "error",
        text1: "Sign Up Error",
        text2: authError.message,
      });
      setLoading(false);
      return;
    }

    if (!user) {
      Toast.show({
        type: "error",
        text1: "Sign Up Error",
        text2: "An unexpected error occurred during sign up.",
      });
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase.from("profile").insert({
      id: user.id,
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      role: data.role,
    });

    console.log({ profileError });

    if (profileError) {
      Toast.show({
        type: "error",
        text1: "Sign Up Error",
        text2: profileError.message,
      });
    } else {
      // On success, navigate to the home screen for the user's role.
      router.replace(`/home/${data.role}`);
    }
    setLoading(false);
  }

  return (
    <View style={Styles.container}>
      <Stack.Screen
        options={{
          title: "Create an Account",
        }}
      />

      <Text style={Styles.inputLabel}>First Name</Text>
      <Controller
        control={control}
        name="firstName"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={Styles.input}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            placeholder="John"
            autoCapitalize="words"
          />
        )}
      />
      {errors.firstName && (
        <Text style={Styles.inputError}>{errors.firstName.message}</Text>
      )}

      <Text style={Styles.inputLabel}>Last Name</Text>
      <Controller
        control={control}
        name="lastName"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={Styles.input}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            placeholder="Doe"
            autoCapitalize="words"
          />
        )}
      />
      {errors.lastName && (
        <Text style={Styles.inputError}>{errors.lastName.message}</Text>
      )}

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

      <Text style={Styles.inputLabel}>Confirm Password</Text>
      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={Styles.input}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            secureTextEntry
            placeholder="Confirm Password"
            autoCapitalize="none"
          />
        )}
      />
      {errors.confirmPassword && (
        <Text style={Styles.inputError}>{errors.confirmPassword.message}</Text>
      )}

      <Text style={Styles.inputLabel}>Role</Text>
      <Controller
        control={control}
        name="role"
        render={({ field: { onChange, onBlur, value } }) => (
          <Dropdown
            style={Styles.input}
            data={roleData}
            labelField="label"
            valueField="value"
            placeholder="Select a role"
            value={value}
            onBlur={onBlur}
            onChange={(item) => onChange(item.value)}
          />
        )}
      />
      {errors.role && (
        <Text style={Styles.inputError}>{errors.role.message}</Text>
      )}

      <View style={{ gap: 10, marginTop: 20 }}>
        <TouchableOpacity
          style={Styles.primaryButton}
          onPress={handleSubmit(signUpWithEmail)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={"white"} />
          ) : (
            <Text style={Styles.primaryButtonText}>Sign up</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
