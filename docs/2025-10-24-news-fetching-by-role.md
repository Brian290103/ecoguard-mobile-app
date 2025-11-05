### News Fetching by User Role

**What:** The news fetching logic in `app/home/news.tsx` has been updated to display news based on the authenticated user's role.

**Why:** This change implements role-based access control for news visibility. Users with the 'user' role can view all news posts, while 'officer' and 'org' roles are restricted to viewing only the news they have personally posted.

**How:**
1.  After successfully authenticating the user session, the user's profile is fetched from the `public.profile` table to retrieve their `role`.
2.  A conditional Supabase query is constructed:
    *   If the `profileData.role` is 'user', the query fetches all news (`supabase.from("news").select("*")`).
    *   If the `profileData.role` is 'officer' or 'org', the query is modified to include a filter for `user_id` matching the current session's user ID (`newsQuery.eq("user_id", session.user.id)`).
3.  The news data is then fetched using the constructed query and displayed accordingly.