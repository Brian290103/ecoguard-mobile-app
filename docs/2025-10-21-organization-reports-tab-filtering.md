# 2025-10-21 - Organization Reports Tab Filtering

## What
This change modifies the `app/home/org/(tabs)/reports.tsx` component to display only reports that have been assigned to the authenticated organization. The reports are still grouped by relative date, maintaining the existing UI structure.

## Why
To align the functionality of the organization's reports tab with the new requirement that organizations should only view and manage reports specifically assigned to them. This ensures data relevance and proper access control for organization representatives.

## How
1.  **Import Helper Functions:** The `getOrganizationId` and `getAssignedReports` functions were imported from `lib/orgReports.ts`.
2.  **Refactor `fetchReports`:** The `fetchReports` function was updated to:
    *   First, retrieve the `organizationId` of the authenticated user using `getOrganizationId`.
    *   If no `organizationId` is found (e.g., user not authenticated or organization not approved), an error is set, and the loading state is updated.
    *   Then, it calls `getAssignedReports` with the `organizationId` and date range parameters to fetch only the reports relevant to the organization.
    *   The fetched reports are then grouped by date using `groupReportsByDate` and set to the component's state.
3.  **Dependency Management:** The `fetchReports` function, being wrapped in `useCallback`, is correctly used as a dependency in the `useEffect` hook and the `onRefresh` callback, ensuring that data fetching is triggered appropriately upon component mount and refresh actions.