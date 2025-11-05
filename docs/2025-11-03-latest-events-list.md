## 2025-11-03-latest-events-list.md

### What
This change introduces a new component `LatestEventsList.tsx` to display the most recent events in a horizontal scrollable list, similar to the existing `LatestNewsList.tsx`. It also modifies the `EventCard.tsx` component to support a compact view when `isDetailed` prop is set to `false`, showing only the event poster, title, and price. Finally, the `LatestEventsList` component is integrated into the user's home dashboard (`app/home/user/(tabs)/index.tsx`).

### Why
The purpose of these changes is to enhance the user dashboard by providing quick access and visibility to the latest events, mirroring the functionality already present for news. The compact `EventCard` view ensures that multiple event cards can be displayed efficiently within a horizontal scroll, improving the user experience without cluttering the interface.

### How
1.  **`EventCard.tsx` Modification:**
    *   The `EventCard` component was updated to conditionally render its content based on the `isDetailed` prop. When `isDetailed` is `false`, it now displays a smaller, horizontal layout showing only the `poster_url`, `title`, and `event_fees`.
    *   New styles (`eventContainerHorizontal`, `eventImageHorizontal`, `centerViewHorizontal`, `eventTitleHorizontal`, `eventPriceHorizontal`) were added to `StyleSheet.create` to support the compact view.

2.  **`LatestEventsList.tsx` Creation:**
    *   A new component `LatestEventsList.tsx` was created in the `components` directory.
    *   Its structure and logic were adapted from `LatestNewsList.tsx`.
    *   It fetches the 5 most recent events from the `events` table in Supabase, ordered by `created_at`.
    *   It uses the modified `EventCard` component to render each event, passing `isDetailed={false}` to ensure the compact view.
    *   It includes loading, error, and no-events-found states.
    *   A Supabase real-time channel (`latest-events-channel`) was set up to automatically refresh the list upon changes to the `events` table.
    *   A `ListHeader` component is used to provide a title and a "View All" link that navigates to `/home/events`.

3.  **`app/home/user/(tabs)/index.tsx` Integration:**
    *   The `LatestEventsList` component was imported into `app/home/user/(tabs)/index.tsx`.
    *   It was rendered within the main `ScrollView` of the user dashboard, positioned directly below the `LatestNewsList` component.