## 2025-10-24-dashboard-metric-card-url.md

### What

This change introduces the ability to navigate to a specified URL when a `DashboardMetricCard` is clicked. It also refactors the display of these cards in `app/home/org/(tabs)/index.tsx` by introducing a new component, `DashboardMetricCardList`.

### Why

The user requested that the dashboard metric cards should be clickable and navigate to a relevant page, specifically the reports page for the report-related cards. To achieve this, a `url` prop was added to the `DashboardMetricCard` component. Additionally, to improve code organization and reusability, a new component `DashboardMetricCardList` was created to handle the rendering of multiple `DashboardMetricCard` instances, replacing the repetitive individual card declarations in `app/home/org/(tabs)/index.tsx`.

### How

1.  **`components/DashboardMetricCard.tsx`**: 
    *   The `DashboardMetricCardProps` interface was updated to include an optional `url` property of type `string`.
    *   The component was wrapped in a `TouchableOpacity`.
    *   The `useRouter` hook from `expo-router` was imported and used to implement navigation to the `url` when the card is pressed.
    *   A `touchableContainer` style was added to ensure the `TouchableOpacity` behaves correctly.

2.  **`components/DashboardMetricCardList.tsx` (New File)**:
    *   A new component `DashboardMetricCardList` was created.
    *   It accepts a `cards` prop, which is an array of objects conforming to the `DashboardMetricCardData` interface (similar to `DashboardMetricCardProps`).
    *   It iterates over the `cards` array and renders a `DashboardMetricCard` for each item, passing all relevant props.
    *   It includes styling for `metricCardsContainer` and `cardWrapper` to manage the layout of the cards.

3.  **`app/home/org/(tabs)/index.tsx`**: 
    *   The `DashboardMetricCardList` component was imported.
    *   An array named `metricCardsData` was created within the component, containing the data for each metric card, including the new `url` property set to `/home/org/(tabs)/reports` for all report-related cards.
    *   The individual `DashboardMetricCard` components were replaced with a single `DashboardMetricCardList` component, passing the `metricCardsData` array.
    *   The `metricCardsContainer` and `cardWrapper` styles were removed from this file as they are now handled by `DashboardMetricCardList.tsx`.