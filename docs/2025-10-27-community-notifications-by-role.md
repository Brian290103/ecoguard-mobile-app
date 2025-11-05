### Community Notifications by Role

**What:** Modified `sendCommunityNotificationToUsers` function in `utils/communityNotifications.ts`.

**Why:** Previously, community notifications were sent to all users regardless of their role. This change aligns the community notification logic with news notifications, ensuring that only users with the role 'user' receive these notifications.

**How:**
1.  Added `.eq("role", "user")` to the `supabase.from("profile").select("id")` query to filter profiles by role.
2.  Updated the console log message to reflect the change in filtering: "No users with role 'user' found."