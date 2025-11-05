### Community Information Modal

**What:** Implemented a modal to display detailed community information instead of rendering it directly on the `single-community/[communityId].tsx` screen.

**Why:** To improve the user experience by providing a cleaner initial view of the community page and allowing users to access detailed information on demand via a modal.

**How:**
1.  **Created `CommunityInfoModal.tsx`:** A new modal component was created in `components/modal/` to encapsulate the display of community details (icon, name, about, created by). The labels for these fields were removed, and the text is now centered with adjusted font sizes and weights for better readability.
2.  **Updated `lib/types.d.ts`:** Added the `Community` interface to ensure type safety for community data.
3.  **Modified `app/home/single-community/[communityId].tsx`:**
    *   Imported `CommunityInfoModal` and `Ionicons`.
    *   Introduced a `isModalVisible` state variable to control the visibility of the modal.
    *   Added a `headerRight` option to `Stack.Screen` which displays the community's icon (`Image source={{ uri: community.icon }}`).
    *   Tapping this icon sets `isModalVisible` to `true`, opening the `CommunityInfoModal`.
    *   The `CommunityInfoModal` is rendered at the bottom of the component, receiving the `community` data and a function to close itself.
    *   The detailed display of `about` and `author` information was removed from the main `ScrollView` in `single-community/[communityId].tsx`, now only showing the community icon and name on the main screen.