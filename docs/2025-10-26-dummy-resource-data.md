### Feature: Dummy Data for Resources

**Date:** 2025-10-26

**Changes:**

- **`dummyResources.ts`:** A new file containing an array of dummy resource objects with titles, captions, types, URLs, and poster images.
- **`ResourceForm.tsx`:** Updated to import `dummyResources` and use a `useEffect` hook to pre-populate the resource creation form with random dummy data on component mount.
- **`EventsForm.tsx`:** Reverted changes to restore the previous functionality of pre-populating the event creation form with dummy data.

**Purpose:**

This feature enhances the development and testing workflow by providing realistic placeholder content for the resource management module. Pre-populating the form with dummy data makes it easier to test the submission functionality and review the visual presentation of resources without needing to manually enter data each time. The restoration of dummy data to the events form ensures consistency in the testing approach across different modules.
