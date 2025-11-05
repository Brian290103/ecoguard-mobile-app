import Toast from "react-native-toast-message";
export { updateReportStatusAndHistory } from "@/lib/reportActions";
import { supabase } from "@/lib/supabase";
import type { Report } from "@/lib/types";
import { getDistanceInKm } from "@/lib/location";
import { updateReportStatusAndHistory } from "./utils";

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(minutes / 60 / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(months / 12);

  if (years > 0) {
    return `${years} year${years > 1 ? "s" : ""} ago`;
  }
  if (months > 0) {
    return `${months} month${months > 1 ? "s" : ""} ago`;
  }
  if (days > 0) {
    if (days === 1) return "yesterday";
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  }
  if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  }
  return "today";
};

export const getRelativeDateGroup = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return "This Week";
  if (days < 30) return "This Month";
  if (days < 365) return "This Year";
  return "Older";
};

export const getAbbreviation = (
  param1: string | null,
  param2?: string | null,
): string => {
  if (param1 && param2) {
    // Handle two parameters (first name, last name)
    const firstInitial = param1[0];
    const lastInitial = param2[0];
    return `${firstInitial}${lastInitial}`.toUpperCase();
  } else if (param1) {
    // Handle one parameter (organization name)
    return param1.substring(0, 2).toUpperCase();
  }
  return "?"; // Fallback if no names are available
};

export const handleReportAction = async (
  report: Report,
  setLoading: (loading: boolean) => void,
  status: string,
  message: string,
) => {
  setLoading(true);
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "User not logged in.",
      });
      return;
    }

    await updateReportStatusAndHistory(report.id, user.id, status, message);
  } catch (error) {
    if (error instanceof Error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message,
      });
    } else {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "An unknown error occurred.",
      });
    }
  } finally {
    setLoading(false);
  }
};
