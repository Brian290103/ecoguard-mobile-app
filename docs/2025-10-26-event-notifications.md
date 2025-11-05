# Event Notifications

This document describes the changes made to implement event notifications in the EcoGuard mobile app.

## What was changed

-   Added a new color for events in `lib/referenceTableColors.ts`.
-   Updated the `app/home/notifications.tsx` component to handle notifications with a `reference_table` of `events`.

## Why this change was made

This change was made to add support for event notifications. Users will now receive notifications for new events and be able to navigate to the event details screen from the notification.

## How this change was implemented

1.  **Color Definition**: A new color for events was added to the `referenceTableColors.ts` file. This ensures that event-related items are styled consistently throughout the app.

2.  **Notification Handling**: The `notifications.tsx` file was updated to:
    -   Recognize `events` as a valid `reference_table` type.
    -   Make event notifications clickable.
    -   Navigate to the single event screen when an event notification is pressed.
    -   Display a unique icon and color for event notifications to distinguish them from other notification types.
