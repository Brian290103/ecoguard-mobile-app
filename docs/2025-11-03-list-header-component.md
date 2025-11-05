### ListHeader Component

**What:** Created a reusable `ListHeader` component.

**Why:** To abstract the common pattern of a section header with a title and a "View All" link, improving reusability and maintainability.

**How:**
1.  A new file `components/ListHeader.tsx` was created.
2.  The header `View` logic from `LatestNewsList.tsx` was moved into this new component.
3.  `ListHeader` accepts `title`, `linkText`, and `onPressLink` as props.
4.  `LatestNewsList.tsx` was updated to use the new `ListHeader` component, passing the appropriate props, and unused imports were removed.