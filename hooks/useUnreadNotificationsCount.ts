
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export const useUnreadNotificationsCount = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [user, setUser] = useState<User | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", session.user.id)
        .eq("is_read", false);

      if (error) {
        console.error("Error fetching unread notifications count:", error);
        setUnreadCount(0);
      } else {
        setUnreadCount(count || 0);
      }
    } else {
      setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();

    if (user?.id) {
      const notificationChannel = supabase
        .channel("unread_notifications_count_channel")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            // Re-fetch count on any change to notifications for the user
            fetchUnreadCount();
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(notificationChannel);
      };
    }
  }, [fetchUnreadCount, user?.id]);

  return unreadCount;
};
