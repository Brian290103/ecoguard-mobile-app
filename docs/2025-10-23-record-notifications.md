# Record Notifications in Database

**Date:** 2025-10-23

## Summary

This change introduces a mechanism to record all push notifications sent to users in a new `notifications` table in the database. This provides a history of notifications for auditing and user-facing notification centers.

## Changes

-   **`utils/sendMobilePushNotification.ts`**: The `sendMobilePushNotification` function was updated to accept a `user_id` in the payload. It now first records the notification details (`title`, `message`, `user_id`) in the `notifications` table and then sends the push notification via Expo's API.

-   **`utils/reportNotifications.ts`**: The `sendReportNotificationToOfficers` function was modified to include the `user_id` of each officer when constructing the notification payload.

-   **`lib/reportActions.ts`**: The `updateReportStatusAndHistory` function was updated to include the `user_id` in notification payloads for both organization representatives and the original report creator.

## Impact

-   All push notifications are now recorded in the database.
-   The `PushNotificationPayload` type now requires a `user_id`.
-   This enables future development of a notification center where users can view their past notifications.
