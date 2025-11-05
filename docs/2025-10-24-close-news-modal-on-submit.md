# Close News Modal on Submit

## What
This change ensures that the `CreateNewsModal` automatically closes after a news item is successfully submitted through the `NewsForm`.

## Why
Previously, after a user submitted news, the modal would remain open, requiring manual closure. This update improves the user experience by providing immediate feedback and streamlining the workflow.

## How
1.  **`NewsForm.tsx` Modification:**
    *   Added an `onNewsCreated` prop to the `NewsFormProps` interface. This prop is a function that will be called upon successful news submission.
    *   Destructured `onNewsCreated` from the component's props.
    *   Called `onNewsCreated()` after the `Toast.show` success message and `reset()` call within the `onSubmit` function.

2.  **`CreateNewsModal.tsx` Modification:**
    *   Passed the `onNewsCreated` prop to the `NewsForm` component. The value of this prop is an anonymous function `() => setIsFormVisible(false)`, which sets the modal's visibility state to `false`, thereby closing it.