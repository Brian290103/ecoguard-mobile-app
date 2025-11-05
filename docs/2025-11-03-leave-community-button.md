## 2025-11-03-leave-community-button.md

### Implemented Leave Community Button in CommunityInfoModal

**What:** A "Leave Community" button has been added to the `CommunityInfoModal.tsx` component, and an action message is now sent to the chat when a user leaves a community.

**Why:** This feature allows users to voluntarily leave a community they have joined, providing more control over their community participation. The action message ensures that other community members are informed when someone leaves.

**How:**
1.  **`handleLeaveCommunity` Function:** A new asynchronous function `handleLeaveCommunity` was created within `CommunityInfoModal.tsx`.
    *   It first checks if a user is authenticated. If not, it redirects to the login page.
    *   An `Alert.alert` confirmation box is displayed to the user, asking for confirmation before leaving the community.
    *   Upon confirmation, it calls Supabase to delete the corresponding entry from the `comm_participants` table, effectively removing the user from the community.
    *   **Action Message:** After successfully leaving the community, the user's profile is fetched to get their `first_name` and `last_name`. This information is then used to construct an action message (e.g., "[User Name] has left the community."), which is sent to the chat using the `saveActionMessage` utility function.
    *   `Toast` messages are used to provide feedback on the success or failure of the operation.
    *   After successfully leaving, the modal closes, and the user is routed to the `/home` screen.
2.  **Button Integration:** A `TouchableOpacity` component, styled similarly to the `LogoutButton.tsx` (red background, white text), was added to the `CommunityInfoModal.tsx`.
    *   It displays an `ActivityIndicator` while the leaving process is in progress.
3.  **Styling:** New styles (`leaveButtonContainer`, `leaveButton`, `leaveButtonText`) were added to `CommunityInfoModal.tsx` to ensure the button is visually consistent and clearly identifiable.