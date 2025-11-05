### Feature: Resources Metric Card

**Date:** 2025-10-26

**Changes:**

- **`lib/colors.ts`:** Added a new `teal` color to the color palette.
- **`app/home/org/(tabs)/index.tsx`:**
  - Added a new state variable, `resourcesCount`, to store the total number of resources.
  - Updated the `fetchData` function to fetch the count of resources created by the logged-in user.
  - Added a new metric card to the `metricCardsData` array to display the total number of resources. The card is styled with the new `teal` color and links to the resources page.

**Purpose:**

This feature provides organization representatives with a quick overview of the number of educational resources they have published. The new "Resources" metric card on the organization dashboard displays the total count and allows for easy navigation to the main resources page. This enhancement improves the dashboard's utility by centralizing key metrics in one accessible location.
