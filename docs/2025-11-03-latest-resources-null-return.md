## 2025-11-03-latest-resources-null-return.md

### Return Null for Empty Latest Resources List

**What:** The `LatestResourcesList` component now returns `null` if there are no latest resources available.

**Why:** Previously, the component would render a `View` with a message "No latest resources available." when no resources were found. Returning `null` instead allows for more flexible conditional rendering in parent components, preventing unnecessary UI elements from being displayed when there's no content.

**How:** The `if (resources.length === 0)` block in `LatestResourcesList.tsx` was modified to `return null;` instead of a `View` containing a text message.