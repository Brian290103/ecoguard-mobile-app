### Record Assigned Reports

**What:** Modified `AssignToOrganizationModal.tsx` to record report assignments.

**Why:** To maintain a log of which reports are assigned to which organizations and by which user, enabling better tracking and accountability.

**How:** After a report's status is updated to 'assigned' and its history is logged, a new entry is now inserted into the `assigned_reports` table. This entry includes the `report_id`, `organization_id`, and the `user_id` of the officer performing the assignment. Error handling has been included to catch any issues during the insertion process.