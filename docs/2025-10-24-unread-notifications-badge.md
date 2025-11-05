## 2025-10-24-unread-notifications-badge.md

### What
Implemented a feature to display the number of unread notifications as a badge on the `NotificationButton` component.

### Why
To provide users with a visual indicator of pending notifications, improving the user experience by making it easier to track new alerts.

### How
1.  **Created `useUnreadNotificationsCount` hook:** A new custom hook (`hooks/useUnreadNotificationsCount.ts`) was created to encapsulate the logic for fetching the unread notification count for the logged-in user. This hook also includes a Supabase real-time subscription to update the count dynamically when new notifications arrive or existing ones are marked as read.
2.  **Integrated hook into `NotificationButton.tsx`:** The `NotificationButton` component was modified to use the `useUnreadNotificationsCount` hook. The returned `unreadCount` is then conditionally rendered as a badge (a `View` component with styling) on top of the notification icon.
3.  **Added Styling:** Basic styling was added to the `NotificationButton.tsx` file to position and style the notification badge.