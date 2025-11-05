### Fix Community Details Page

**What:** Modified `app/home/single-community/[communityId].tsx` to correctly fetch community and profile data.

**Why:** The previous implementation attempted to join `community` and `profiles` directly using Supabase's `select` with nested relationships, which resulted in an error because a direct foreign key relationship between `community` and `profiles` was not found in the schema cache. Although `community.user_id` and `profile.id` both reference `auth.users.id`, Supabase did not infer this relationship for a direct join.

**How:**
1.  The `fetchCommunity` function was updated to first fetch the `community` data using `supabase.from("community").select("*")`.
2.  After successfully fetching the community data, a separate Supabase call is made to fetch the associated `profile` data using `communityData.user_id` and `supabase.from("profile").select("first_name, last_name").eq("id", communityData.user_id).single()`.
3.  The `full_name` is constructed from the fetched `first_name` and `last_name`.
4.  The `community` data is then combined with the `full_name` of the creator before being set in the component's state, ensuring that the `Created by:` field displays the correct name.