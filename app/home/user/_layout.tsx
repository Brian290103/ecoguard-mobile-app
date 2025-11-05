import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="[reportId]"
        options={{ headerTitle: "Report Details" }}
      />
    </Stack>
  );
}
