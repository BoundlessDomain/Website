# Changelog

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
