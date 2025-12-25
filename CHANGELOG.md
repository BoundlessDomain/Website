# Changelog

## V3.5.2 - Annual Christmas Update
- **Feature:** Added **Christmas Theme** presets (snowy background, festive robot).
- **Feature:** Implemented **Seasonal Theme Logic**:
  - Automatically defaults to `christmas` theme for new visitors between Dec 1st - Dec 25th.
  - Adds a notification badge to Settings/Themes during the holiday season if not yet seen.
- **Enhancement:** Updated Robot aesthetics:
  - Added a **Santa Hat** with correct orientation (cylinder trim) for the festive theme.
  - Brightened the robot's mouth with emissive material for better visibility in low light.

## V3.5.1 - Gallery Fixes
- **Fix:** Resolved image display issues and API path handling for gallery images.

## V3.5.0 - Article Management & Security Improvements
- **Feature:** Enhanced Article Management
  - Implemented secure delete functionality with name confirmation.
  - Removed legacy rating system for a cleaner interface.
- **Fix:** Photo Upload Authorization
  - Resolved 403 Forbidden errors for admin uploads.
  - Standardized server-side `is_admin` checks to rely on database state rather than hardcoded emails.

## V3.4.0 - Gallery & Layout Enhancements
- **Feature:** Improved **Album Display** with masonry-like dynamic height scaling to prevent cropping.
- **Feature:** Updated **Gallery UI** with 4-column grid and dynamic section spacing.
- **Feature:** Added dates to featured highlight photos.
- **Fix:** Fixed layout gaps between highlights and albums.
- **Fix:** Adjusted homepage layouts for better responsiveness (green Matrix theme, robot positioning).

## V3.3.0 - Homepage UI & Mobile Grid
- **Feature:** Implemented **Mobile Grid Layout** for navigation buttons on small screens (<768px).
- **Feature:** Added **Matrix Theme** Green background update.
- **Fix:** Resolved "pitch black" background issue on homepage by replacing opaque floor mesh with contact shadows.
- **Fix:** Improved Desktop Resizing logic ("Narrow" mode) to prevent button/robot overlap.
- **Fix:** Updated Robot Arm logic for mobile to track touch interactions in the top half of the screen.

## [V3.2.1] - 2025-12-21
### Fixed
- **Authentication**: Resolved issue where owner verification failed after login.
  - Implemented client-side email verification for immediate feedback.
  - Configured case-insensitive email matching.
  - Restored missing `verify-owner` API route as a fallback.
  - Updated default owner email configuration.

## [V3.2.0] - 2025-12-21
### Added
- **Poems Page**: Redesigned with a balanced masonry layout and strict Oldest -> Newest sorting.
- **Reactive Visibility**: Hidden poems now instantly disappear upon logout without page refresh.
- **Owner Controls**: Owners can now Add, Edit, and Hide poems via a refined modal interface.

### Fixed
- **Stability**: Reverted unstable dynamic homepage navigation to restore core site functionality.

## [V3.1.0] - 2025-12-18
### Added
- **Dynamic Page Titles**: The browser tab now updates its title based on the environment:
  - `dev.bobbyyu.me` -> "{Dev} Bobby's Site"
  - `bobbyyu.me` -> "Bobby's Site"
- **Dev Workflow**: Standardized workflow for `dev` branch preview deployments on Vercel.

### Fixed
- **DNS Resolution**: Resolved `ERR_CONNECTION_REFUSED` by updating CNAME records to `cname.vercel-dns.com`.
- **Loading Issues**: Fixed "LOADING 3D SCENE..." infinite load caused by DNS timeouts.
- **Login Redirects**: Fixed authentication redirects failing by:
  - Correcting root domain A record.
  - Adding `https://*.bobbyyu.me/**` wildcard to Supabase.

## [V3.0.0] - 2025-12-18
### Changed
- **Major Release**: Initial migration to Vercel and production deployment.
