
# Real-time Community List

## WHAT

This change implements a real-time listener for the community page, ensuring that the list of communities automatically updates when changes occur in the database.

## WHY

Previously, the community list was only fetched once when the component mounted. To see new communities or updates, users had to manually refresh the page. This change provides a better user experience by keeping the community list in sync with the database in real-time.

## HOW

I utilized Supabase Channels to subscribe to changes in the `community` table. The `useEffect` hook in the `community.tsx` component was modified to establish this subscription. Now, whenever there is an insert, update, or delete event in the `community` table, the `fetchCommunities` function is automatically called to refresh the list.

This implementation mirrors the existing real-time functionality on the news page, ensuring consistency across the application.
