### News Notification to Users with Caption and NewsCard/Single News Update

**What:** Implemented a feature to send push notifications to all users with the role "user" when a new news item is created, utilizing a new `caption` field for the notification body. The `NewsCard.tsx` component has been updated to display the `caption` below the news title and reposition the `created_at` date. Additionally, `app/home/single-news/[newsId].tsx` has been updated to display the `caption` below the title.

**Why:** To provide a concise summary for notifications, as the full `description` can be lengthy, improving readability and user experience for push notifications. The UI reordering in `NewsCard.tsx` and the addition of `caption` in `single-news/[newsId].tsx` improve the logical flow of information display across the application.

**How:**
1.  **Modified `components/NewsForm.tsx`:**
    *   Added a `caption` field to the `FormSchema` with validation (min length 1, max length 250).
    *   Included a new `TextInput` for the `caption` in the form's UI, placed *before* the `description` input.
    *   Added `caption` to the `defaultValues` in `useForm`.
    *   Included `caption` in the `newNewsData` object when submitting to Supabase.
    *   Updated the call to `sendNewsNotificationToUsers` to pass `newNewsData.caption` instead of `newNewsData.description`.
    *   Updated `useEffect` to set a default value for `caption` from `dummyNews`.
2.  **Modified `data/news.ts`:**
    *   Added a `caption` field with a short summary to each `dummyNews` object.
3.  **Modified `utils/newsNotifications.ts`:**
    *   Updated the `sendNewsNotificationToUsers` function signature to accept `caption` (string) instead of `body` (string).
    *   Ensured that the `caption` parameter is used as the `body` of the push notification payload.
4.  **Modified `components/NewsCard.tsx`:**
    *   Updated the `News` interface to include the `caption` field.
    *   Modified the `centerView` to display `news.caption` below `news.title`.
    *   Moved the `created_at` date display to appear below the `descriptionText` within the `isDetailed` block.
    *   Added a new style `captionText` for the news caption.
5.  **Modified `app/home/single-news/[newsId].tsx`:**
    *   Updated the `News` interface to include the `caption` field.
    *   Displayed `news.caption` below `news.title`.
    *   Added a new style `newsCaption` for the news caption.

**Query Strategy for Notifications:**
*   First, it fetches all user `id`s from the `profile` table where the `role` is "user".
*   Then, it uses these `user_id`s to query the `expo_push_tokens` table and retrieve the corresponding push tokens.
*   Finally, for each fetched user's push token, a `PushNotificationPayload` is constructed, and the `sendMobilePushNotification` function (from `utils/sendMobilePushNotification.ts`) is called to dispatch the notification.