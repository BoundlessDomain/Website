# Changelog

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
