# 2025-10-21 - Organization Assigned Reports

## What
This change modifies the `app/home/org/(tabs)/index.tsx` component to ensure that organization representatives only see reports that have been explicitly assigned to their organization.

## Why
Previously, the organization view displayed all reports, which is incorrect for an organization representative. The requirement is for organizations to only manage and view reports that are relevant to them, i.e., those assigned to their specific organization. This change implements a crucial access control and data filtering mechanism.

## How
1.  **Retrieve Organization ID:** The `fetchData` function was updated to first fetch the `org_id` of the authenticated organization representative from the `org_reps` table.
2.  **Fetch Assigned Report IDs:** Using the retrieved `org_id`, the system now queries the `public.assigned_reports` table to obtain a list of `report_id`s associated with that organization.
3.  **Filter Reports:** The main report fetching logic in `fetchData` was modified to use these `assigned_report_id`s to filter the `public.reports` table. This ensures that only reports linked to the organization are retrieved and displayed.
4.  **Update Metrics:** The `totalReports`, `resolvedReportsCount`, and `rejectedReportsCount` metrics are now calculated based solely on the reports assigned to the organization.
5.  **Update Search Functionality:** The `handleSearch` function was also updated to incorporate the same filtering logic. Search queries now only return results from the reports assigned to the organization.
6.  **State Management:** A new state variable `organizationId` was introduced to store the organization's ID, making it accessible across different functions within the component.
7.  **Effect Dependencies:** The `useEffect` hook's dependency array was updated to include `organizationId`. This ensures that the data fetching and filtering logic re-runs correctly once the `organizationId` is available, preventing race conditions and ensuring data consistency.