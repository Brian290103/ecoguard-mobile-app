### Add Single Community Screen to Home Layout

**What:** Added a new `Stack.Screen` entry for `single-community` to the `app/home/_layout.tsx` file.

**Why:** This change is necessary to properly route and display the community details page within the application's navigation stack.

**How:** The `Stack.Screen` was added after the `single-event` screen, ensuring that the `single-community` route is recognized and handled by the home layout's navigation.