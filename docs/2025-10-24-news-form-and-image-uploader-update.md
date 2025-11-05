### News Form and Image Uploader Update

**What:**
Created a new `NewsForm.tsx` component, `CreateNewsModal.tsx`, `NewsCard.tsx`, `app/home/single-news/[newsId].tsx`, updated the existing `ImageUploader.tsx` component, rendered `CreateNewsModal.tsx` in `app/home/news.tsx`, and added a news metric card to the dashboard in `app/home/org/(tabs)/index.tsx`. The `app/home/news.tsx` component was also updated to display news posted by the logged-in user with `isDetailed` prop set to `true` for `NewsCard`, and the news are now grouped by `created_at` dates using `SectionList`.

**Why:**
To facilitate the creation of news entries in the database, a dedicated form (`NewsForm.tsx`) was required. This form needed to support a single image upload for the news poster, which necessitated an enhancement to the `ImageUploader.tsx` component to handle both single and multiple image upload scenarios. Additionally, a modal component (`CreateNewsModal.tsx`) was needed to present the news creation form to the user in a clean and accessible way. The `CreateNewsModal.tsx` was rendered in the `app/home/news.tsx` component to make it accessible to the user. A news metric card was added to the organization dashboard to display the count of news articles created by the logged-in user. Finally, to allow users to view their posted news, a `NewsCard.tsx` component was created, and `app/home/news.tsx` was updated to fetch and display these news articles, with each card navigating to a dedicated `app/home/single-news/[newsId].tsx` page for detailed viewing. The `NewsCard.tsx` was updated to provide a more consistent detailed view with the `created_at` date, similar to the `ReportCard.tsx`, and the `isDetailed` prop was set to `true` in `app/home/news.tsx` to ensure the detailed view is always rendered. The `NewsCard.tsx` was further enhanced to display the author's name and avatar when in detailed view, providing more context about the news post. The display of news in `app/home/news.tsx` was further improved by grouping news articles by their creation date using a `SectionList`, providing a more organized and user-friendly interface.

**How:**
1.  **`ImageUploader.tsx` Modification:**
    *   Added an optional `type` prop (`'single'` or `'multiple'`, defaulting to `'multiple'`) to `ImageUploaderProps`.
    *   Modified the `uploadImage` function to either append to `imageUrls` (for `multiple` type) or replace `imageUrls` with the new URL (for `single` type).
    *   Adjusted the `removeImage` function to clear `imageUrls` for `single` type or remove a specific image for `multiple` type.
    *   Implemented conditional rendering for the "Add Image" button, hiding it when `type` is `'single'` and an image is already present.

2.  **`NewsForm.tsx` Creation:**
    *   Created `NewsForm.tsx` by adapting the structure and logic of `ReportForm.tsx`.
    *   Updated the `FormSchema` to include `title`, `description`, and `poster_url` (a single URL string).
    *   Removed report-specific fields and logic suchs as `latitude`, `longitude`, `report_number` generation, `videoUrls`, `generateEmbeddings`, `sendReportNotificationToOfficers`, and `report_history` insertion.
    *   Integrated the modified `ImageUploader` component with `type="single"` to handle the `poster_url`.
    *   Adjusted `onSubmit` logic to insert data into the `public.news` table.
    *   Updated success/error messages and navigation after submission.

3.  **`CreateNewsModal.tsx` Creation:**
    *   Created `CreateNewsModal.tsx` by adapting the structure and logic of `CreateOrganizationModal.tsx`.
    *   Removed location-related state and logic as news creation does not require location information.
    *   Adjusted the `useEffect` hook to solely focus on fetching the `userId`.
    *   Updated the modal trigger button and passed the `userId` to the `NewsForm` component.

4.  **`app/home/news.tsx` Update:**
    *   Renamed the `Events` component to `News`.
    *   Imported and rendered the `CreateNewsModal` component within the `News` component.
    *   Added logic to fetch news articles posted by the logged-in user.
    *   Implemented rendering of `NewsCard` components for each fetched news article, with `isDetailed` prop set to `true`.
    *   Integrated `SectionList` to group news articles by their `created_at` date, including a `groupNewsByDate` helper function and `renderSectionHeader` for date titles.

5.  **`app/home/org/(tabs)/index.tsx` Update:**
    *   Added a new state variable `newsCount`.
    *   Modified the `fetchData` function to fetch the count of news articles created by the logged-in user from the `news` table.
    *   Added a new metric card to the `metricCardsData` array to display the `newsCount` with an appropriate icon, title, color, and URL linking to the news page.

6.  **`NewsCard.tsx` Creation and Modification:**
    *   Created `NewsCard.tsx` based on `ReportCard.tsx` to display news article summaries.
    *   Adapted the component to display `news.poster_url`, `news.title`, and `news.created_at`.
    *   Configured `TouchableOpacity` to navigate to `/home/single-news/${news.id}`.
    *   Modified the `NewsCard.tsx` to render the `created_at` date in the `bottomView` when `isDetailed` is true, similar to `ReportCard.tsx`.
    *   Further modified `NewsCard.tsx` to fetch and display the author's `first_name`, `last_name`, and `avatar` from the `profile` table when `isDetailed` is true, replacing the duplicate `created_at` display in the `bottomView`.

7.  **`app/home/single-news/[newsId].tsx` Creation:**
    *   Created `app/home/single-news/[newsId].tsx` based on `app/home/single-report/[reportId].tsx` to display full news article details.
    *   Adapted the component to fetch and display `news.title`, `news.description`, `news.poster_url`, `news.created_at`, and `news.updated_at`.
    *   Removed report-specific elements like status, report number, tabs, and actions.
