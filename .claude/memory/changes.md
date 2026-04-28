Date: 2026-04-07
File: finance-backend-api/app/main.py
Changes:
- Added analytics router imports from app.modules.analytics.router.
- Registered analytics dashboard and reports routers with API v1 prefix.
Reason:
- Analytics endpoints were not mounted, causing /analytics/* requests to return 404 and breaking HomeScreen data loading.

Date: 2026-04-07
File: mobile-app/src/screens/HomeScreen.js
Changes:
- Replaced Promise.all with Promise.allSettled in fetchAll.
- Applied independent state updates for balance, category stats, and recent transactions based on each request result.
Reason:
- Prevent a single failed request from hiding all HomeScreen data; keep available data visible and improve resilience.

Date: 2026-04-08
File: mobile-app/src/api/transactionsApi.js
Changes:
- Added updateTransaction(txnId, payload) for PATCH /transactions/:id.
Reason:
- Enable editing existing transactions from the mobile transaction list.

Date: 2026-04-08
File: mobile-app/src/screens/Transaction.js
Changes:
- Added tap-to-edit flow with modal (amount + note) and save action calling updateTransaction.
- Added handling for reconciled transactions to block editing with clear message.
- Updated list item rendering to show category/title and note on separate lines.
Reason:
- Fix missing note visibility and allow users to edit transactions directly in the transaction screen.

Date: 2026-04-08
File: mobile-app/src/screens/HomeScreen.js
Changes:
- Updated recent transaction item UI to render note on a dedicated line under date.
Reason:
- Ensure transaction notes are visible on the home recent-transactions section.

Date: 2026-04-08
File: mobile-app/App.js
Changes:
- Switched root navigation to auth-state-driven rendering using AuthContext state.userToken.
- Added loading fallback while restoring token at app startup.
- Included ChangePassword screen in authenticated stack.
Reason:
- Ensure logout/login transitions are controlled centrally and reliably reflect authentication state.

Date: 2026-04-08
File: mobile-app/src/context/AuthContext.js
Changes:
- Updated signOut to dispatch SIGN_OUT before awaiting API logout.
Reason:
- Prevent stale authenticated UI and make logout responsive even when network/API revoke is slow.

Date: 2026-04-08
File: mobile-app/src/api/authApi.js
Changes:
- Updated logout flow to clear local tokens first, then call /auth/logout as best-effort with timeout.
Reason:
- Avoid logout being blocked by slow/unavailable backend while still trying to revoke refresh token server-side.

Date: 2026-04-08
File: mobile-app/src/screens/LoginScreen.js
Changes:
- Removed manual navigation.replace('Home') after successful sign-in/sign-up.
Reason:
- Navigation now follows auth state from App root; manual redirect is no longer needed and can cause race issues.

Date: 2026-04-08
File: mobile-app/src/screens/Profile.js
Changes:
- Replaced manual navigation.reset on logout with signOut result handling.
Reason:
- Let root navigator handle post-logout route switching consistently from auth state.

Date: 2026-04-08
File: mobile-app/src/screens/ChangePasswordScreen.js
Changes:
- Replaced manual navigation.reset after signOut with signOut result handling.
Reason:
- Keep logout transition consistent with centralized auth-state-based navigation.

Date: 2026-04-08
File: mobile-app/App.js
Changes:
- Added keyed NavigationContainer and Stack.Group navigationKey for guest/user flows.
Reason:
- Force React Navigation to reset auth stack on token changes so logout always transitions to Login immediately.

Date: 2026-04-08
File: mobile-app/src/components/SidebarDrawer.js
Changes:
- Removed debug log "Profile click detected" from profile navigation tap.
- Added sidebar logout action with confirmation dialog calling AuthContext signOut.
Reason:
- Eliminate confusing logs and provide a direct, reliable sign-out path from the side menu.

Date: 2026-04-08
File: mobile-app/src/components/SidebarDrawer.js
Changes:
- Removed sidebar logout action and related styles/imports.
Reason:
- Keep logout behavior focused on the dedicated logout button inside Profile screen per user preference.

Date: 2026-04-08
File: mobile-app/src/screens/Profile.js
Changes:
- Centralized logout execution in performLogout() with in-progress guard.
- Updated confirm action to trigger performLogout via non-blocking callback.
- Added disabled/loading state for logout button while request is running.
Reason:
- Make profile logout event handling more robust and avoid repeated taps/race conditions.

Date: 2026-04-08
File: mobile-app/src/screens/Profile.js
Changes:
- Replaced logout confirmation Alert with a custom React Native Modal.
- Added modal actions for cancel/confirm and integrated existing logout loading state.
Reason:
- Improve confirmation dialog reliability on Android emulator where native Alert can appear delayed.

Date: 2026-04-08
File: mobile-app/src/screens/Profile.js
Changes:
- Sequenced logout flow to close Modal first, then run signOut via InteractionManager.runAfterInteractions.
- Removed direct modal state update from performLogout to avoid modal/stack race.
Reason:
- Prevent lingering overlay/touch-block issues after logout that can make Login inputs appear unresponsive on Android.
