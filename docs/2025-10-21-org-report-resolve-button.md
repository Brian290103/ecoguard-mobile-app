### Organization Report Resolve Button

**What:** Added a "Mark as Resolved" button to the `OrgReportActions` component.

**Why:** To allow organization representatives to mark assigned reports as resolved, providing a mechanism to close out reports they have addressed.

**How:** The `OrgReportActions.tsx` component was updated to include a `useState` hook for `showResolveForm`, and a `ResolveReportForm` component. A conditional `TouchableOpacity` button is rendered when the report status is "assigned", which, when pressed, displays the `ResolveReportForm`. This implementation mirrors the functionality found in `OfficerReportActions.tsx` for consistency.