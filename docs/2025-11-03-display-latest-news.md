### Display Latest News on User Dashboard

**What:**
Implemented a new component `LatestNewsList.tsx` to display the top 5 latest news articles on the user dashboard (`app/home/user/(tabs)/index.tsx`).

**Why:**
The existing user dashboard was already rich with information, and adding news directly would clutter the interface. A separate component allows for better organization and reusability of the news display logic. Displaying the latest news provides users with up-to-date information directly on their main dashboard.

**How:**
1.  **Created `components/LatestNewsList.tsx`:** This component is responsible for:
    *   Fetching the latest 5 news articles from the `public.news` table in Supabase, ordered by `created_at` in descending order.
    *   Handling loading and error states during data fetching.
    *   Using the existing `NewsCard.tsx` component to render each individual news item.
    *   Subscribing to real-time updates from the `public.news` table to ensure the news list is always current.
2.  **Integrated `LatestNewsList` into `app/home/user/(tabs)/index.tsx`:**
    *   The `LatestNewsList` component was imported into the user dashboard file.
    *   It was rendered within the `ScrollView` of the `index.tsx` file, specifically placed below the "Latest Reports" section to maintain a logical flow of information.

This change ensures that users can quickly see important news updates upon logging in, without compromising the readability and organization of the dashboard.