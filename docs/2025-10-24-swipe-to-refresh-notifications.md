### Swipe Down to Refresh in Notifications Screen

This change introduces a swipe-down-to-refresh functionality to the notifications screen (`app/home/notifications.tsx`).

**What was changed:**
- Imported `RefreshControl` from `react-native`.
- Added a `refreshing` state variable to manage the refresh indicator.
- Modified `fetchUserAndNotifications` to accept an optional `isRefreshing` parameter to handle loading states correctly for both initial load and refresh.
- Implemented an `onRefresh` callback function that triggers `fetchUserAndNotifications` with `isRefreshing` set to `true`.
- Integrated `RefreshControl` into the `SectionList` component, binding it to the `refreshing` state and `onRefresh` callback.
- Updated the real-time `notificationChannel` subscription to call `fetchUserAndNotifications(true)` when a change is received, ensuring the UI updates correctly after real-time notifications.