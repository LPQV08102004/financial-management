# Change Log

## Date: 2026-04-09
- File: mobile-app/src/api/config.js
  - Changes:
    - Added centralized API base URL resolver with support for EXPO_PUBLIC_API_BASE_URL override.
    - Added automatic Expo host detection for physical devices.
    - Kept Android emulator fallback to 10.0.2.2.
  - Reason:
    - Fix network request failures on Expo physical devices while preserving emulator behavior.

- File: mobile-app/src/api/authApi.js
  - Changes:
    - Removed per-file platform/host URL logic.
    - Switched to shared API_BASE_URL from api config.
  - Reason:
    - Ensure login/register use the same, correct backend URL resolution.

- File: mobile-app/src/api/accountsApi.js
  - Changes:
    - Replaced local base URL logic with shared API_BASE_URL.
  - Reason:
    - Keep account endpoints consistent across emulator and physical devices.

- File: mobile-app/src/api/analyticsApi.js
  - Changes:
    - Replaced local base URL logic with shared API_BASE_URL export.
  - Reason:
    - Prevent duplicated URL logic and future drift.

- File: mobile-app/src/api/categoriesApi.js
  - Changes:
    - Replaced local base URL logic with shared API_BASE_URL.
  - Reason:
    - Keep category requests reachable on physical devices.

- File: mobile-app/src/api/transactionsApi.js
  - Changes:
    - Replaced local base URL logic with shared API_BASE_URL.
  - Reason:
    - Keep transaction requests reachable on physical devices.

- File: mobile-app/src/api/recurringApi.js
  - Changes:
    - Replaced EXPO_HOST/localhost logic with shared API_BASE_URL.
  - Reason:
    - Standardize recurring API URL behavior with other modules.

- File: mobile-app/src/api/savingsGoalsApi.js
  - Changes:
    - Replaced EXPO_HOST/localhost logic with shared API_BASE_URL.
  - Reason:
    - Standardize savings goals API URL behavior with other modules.

- File: mobile-app/src/api/chatApi.js
  - Changes:
    - Removed dependency on analyticsApi for BASE_URL.
    - Switched to shared API_BASE_URL.
  - Reason:
    - Avoid indirect URL coupling and keep chat requests consistent.

- File: mobile-app/.env.example
  - Changes:
    - Added sample Expo public environment variables for backend URL override.
    - Documented how to configure LAN IP based API endpoint for physical devices.
  - Reason:
    - Provide a reliable fallback setup when automatic host detection does not match the backend host.
