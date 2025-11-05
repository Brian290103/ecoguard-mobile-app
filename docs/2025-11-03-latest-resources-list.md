## 2025-11-03-latest-resources-list.md

### What
This change introduces a new component `LatestResourcesList.tsx` to display the most recent resources in a horizontal scrollable list, similar to the existing `LatestNewsList.tsx` and `LatestEventsList.tsx`. It also modifies the `ResourceCard.tsx` component to support a compact view when `isDetailed` prop is set to `false`, showing only the resource poster, title, and type. Finally, the `LatestResourcesList` component is integrated into the user's home dashboard (`app/home/user/(tabs)/index.tsx`).

### Why
The purpose of these changes is to further enhance the user dashboard by providing quick access and visibility to the latest resources, mirroring the functionality already present for news and events. The compact `ResourceCard` view ensures that multiple resource cards can be displayed efficiently within a horizontal scroll, improving the user experience without cluttering the interface.

### How
1.  **`ResourceCard.tsx` Modification:**
    *   The `ResourceCard` component was updated to conditionally render its content based on the `isDetailed` prop. When `isDetailed` is `false`, it now displays a smaller, horizontal layout showing only the `poster_url`, `title`, and `type`.
    *   New styles (`resourceContainerHorizontal`, `resourceImageHorizontal`, `centerViewHorizontal`, `resourceTitleHorizontal`, `resourceTypeHorizontal`) were added to `StyleSheet.create` to support the compact view.

2.  **`LatestResourcesList.tsx` Creation:**
    *   A new component `LatestResourcesList.tsx` was created in the `components` directory.
    *   Its structure and logic were adapted from `LatestNewsList.tsx` and `LatestEventsList.tsx`.
    *   It fetches the 5 most recent resources from the `resources` table in Supabase, ordered by `created_at`.
    *   It uses the modified `ResourceCard` component to render each resource, passing `isDetailed={false}` to ensure the compact view.
    *   It includes loading, error, and no-resources-found states.
    *   A Supabase real-time channel (`latest-resources-channel`) was set up to automatically refresh the list upon changes to the `resources` table.
    *   A `ListHeader` component is used to provide a title and a "View All" link that navigates to `/home/resources`.

3.  **`app/home/user/(tabs)/index.tsx` Integration:**
    *   The `LatestResourcesList` component was imported into `app/home/user/(tabs)/index.tsx`.
    *   It was rendered within the main `ScrollView` of the user dashboard, positioned directly below the `LatestEventsList` component.