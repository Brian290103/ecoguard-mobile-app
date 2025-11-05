### Dynamic News Screen Title

**What:** The title of the "news" screen in `app/home/_layout.tsx` now dynamically changes based on the logged-in user's role.

**Why:** This enhancement provides a more intuitive user experience by clearly indicating the content displayed on the news screen. Users with the 'user' role will see "All News", while 'officer' and 'org' roles will see "My Posted News", aligning with the role-based news fetching implemented previously.

**How:**
1.  A `userRole` state variable was introduced using `useState` to store the user's role.
2.  A `useEffect` hook was added to fetch the current user's session and then their profile from the `public.profile` table to retrieve the `role`.
3.  Once the `userRole` is determined, the `options` prop for the `Stack.Screen` named "news" is updated. The `title` property is set conditionally: `userRole === "user" ? "All News" : "My Posted News"`.