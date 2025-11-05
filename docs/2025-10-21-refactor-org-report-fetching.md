# 2025-10-21 - Refactor Organization Report Fetching Logic

## What
This change refactors the report fetching and searching logic for organization representatives in `app/home/org/(tabs)/index.tsx` by extracting the core data access functions into a new utility file: `lib/orgReports.ts`.

## Why
To improve code organization, reusability, and maintainability. Centralizing data fetching logic for assigned reports makes the `index.tsx` component cleaner and easier to understand, while also allowing these functions to be potentially reused elsewhere if needed.

## How
1.  **New Utility File:** A new file, `lib/orgReports.ts`, was created to house the following functions:
    *   `getOrganizationId(userId: string)`: Fetches the organization ID for a given user.
    *   `getAssignedReports(organizationId: string, todayStart: string, todayEnd: string)`: Retrieves reports assigned to a specific organization within a given date range.
    *   `getAssignedReportsMetrics(organizationId: string, assignedReportIds: string[])`: Calculates total, resolved, and rejected report counts for assigned reports.
    *   `searchAssignedReports(organizationId: string, query: string)`: Performs a search operation specifically on reports assigned to an organization.
2.  **Import and Replace:** The `app/home/org/(tabs)/index.tsx` component was updated to import these new functions.
3.  **Refactor `fetchData`:** The `fetchData` function in `index.tsx` was refactored to call `getOrganizationId`, `getAssignedReports`, and `getAssignedReportsMetrics` instead of directly interacting with Supabase for these operations.
4.  **Refactor `handleSearch`:** Similarly, the `handleSearch` function was updated to use `searchAssignedReports` for its search logic.