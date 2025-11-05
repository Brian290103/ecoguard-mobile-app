### Feature: Display Resources

**Date:** 2025-10-26

**Changes:**

- **`[resourceId].tsx` screen:** A new screen to display the full details of a single resource, including the poster, title, caption, author, type, and a link to the resource itself.
- **`ResourceCard.tsx` component:** A new component to display a resource in a card format, showing the poster, title, and type.
- **`ResourceList.tsx` component:** A new component to display a list of `ResourceCard` components, with support for loading, error, and pull-to-refresh functionality.
- **`app/home/resources.tsx` screen:** Updated to fetch all resources from the Supabase database and display them using the `ResourceList` component.

**Purpose:**

This feature provides a user-friendly interface for browsing and viewing educational resources. Users can now see a list of all available resources, pull to refresh the list, and tap on a resource to view its full details. This enhances the user experience by making it easy to discover and access valuable content related to environmental conservation.
