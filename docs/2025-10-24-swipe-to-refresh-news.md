### Implemented Swipe Down to Refresh for News Feed

**What:** Implemented a pull-to-refresh mechanism on the news feed screen.

**Why:** To allow users to manually refresh the news list and fetch the latest updates without navigating away from the screen.

**How:**
1.  Modified `app/home/news.tsx` to introduce a `refreshing` state and an `handleRefresh` function. The `handleRefresh` function calls `fetchUserNews` and updates the `refreshing` state accordingly.
2.  Passed the `refreshing` state and `handleRefresh` function as props to the `NewsList` component.
3.  Modified `components/NewsList.tsx` to accept `refreshing` and `onRefresh` props.
4.  Integrated `RefreshControl` into the `SectionList` component within `NewsList.tsx`, binding its `refreshing` and `onRefresh` props to the ones received from the parent component.