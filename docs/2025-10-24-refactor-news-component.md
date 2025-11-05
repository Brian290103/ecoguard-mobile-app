### Refactor News Component

**What:** The `News` component in `app/home/news.tsx` was refactored to extract the news display logic into a new `NewsList` component.

**Why:** This change improves modularity and reusability. The `News` component is now primarily responsible for fetching news data, while the `NewsList` component focuses solely on rendering the news.

**How:**
1.  A new component file, `components/NewsList.tsx`, was created.
2.  The `News` and `NewsSection` interfaces, the `groupNewsByDate` function, and the `SectionList` rendering logic along with its associated styles were moved from `app/home/news.tsx` to `components/NewsList.tsx`.
3.  The `NewsList` component now accepts `news`, `loading`, and `error` as props.
4.  The `app/home/news.tsx` file was updated to import and use the `NewsList` component, passing the necessary props.