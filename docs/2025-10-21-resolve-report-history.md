### Resolve Report History Integration

**What:** The `ResolveReportForm` component has been updated to utilize the `updateReportStatusAndHistory` function when a report is marked as resolved.

**Why:** This change ensures that all report status updates, including resolution, are consistently recorded in the `report_history` table. This provides a comprehensive audit trail for each report's lifecycle.

**How:**
1.  The `updateReportStatusAndHistory` function was imported from `@/lib/reportActions` into `components/ResolveReportForm.tsx`.
2.  Within the `handleResolveReport` function, the direct `supabase` call to update the report's status to 'resolved' was replaced with a call to `updateReportStatusAndHistory`.
3.  The `notes` parameter for `updateReportStatusAndHistory` is now constructed using the resolution `title` and `description` provided in the form, ensuring detailed historical records.