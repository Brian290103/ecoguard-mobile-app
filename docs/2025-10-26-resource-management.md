### Feature: Resource Management

**Date:** 2025-10-26

**Changes:**

- **`ResourceForm.tsx` component:** A new form for creating and submitting educational resources, including fields for title, caption, type, resource URL, and a poster image.
- **`resourceNotifications.ts` utility:** A utility to send push notifications to users when a new resource is published.
- **`CreateResourceModal.tsx` component:** A modal that hosts the `ResourceForm` for a streamlined user experience.
- **`CreateResourceFloatingButton.tsx` component:** A floating action button that opens the `CreateResourceModal`.
- **`app/home/resources.tsx` screen:** Updated to include the `CreateResourceFloatingButton`, allowing authorized users to add new resources.

**Purpose:**

This feature allows administrators or authorized users to publish educational resources such as articles, videos, and guides to the app. When a new resource is added, all users receive a push notification, ensuring they are aware of the new content. This enhances user engagement and provides valuable information related to environmental conservation.
