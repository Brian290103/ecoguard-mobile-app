import DashboardHeader from "@/components/DashboardHeader";
import NotificationButton from "@/components/NotificationButton";
import { Stack } from "expo-router";

export default function DashboardStackHeader() {
  return (
    <Stack.Screen
      options={{
        headerTitle: "",
        headerLeft: () => <DashboardHeader />,
        headerRight: () => <NotificationButton />,
      }}
    />
  );
}
