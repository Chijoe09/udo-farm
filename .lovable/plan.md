# Seller totals and unpaid-order lifecycle

## Build
- Show paid order earnings (including delivered/shipped states) with precision that preserves small Pi amounts such as 0.001; apply the same formatting to seller order totals.
- Add a seller dashboard action to delete that seller's pending-payment orders older than 24 hours, protected by server-side identity/ownership checks.
- Reserve inventory atomically when an order is created, release it when the buyer cancels or an order expires, and prevent expired orders from being approved/completed.
- Run one database cleanup schedule every minute to cancel reservations past the 10-minute deadline. This may use up to 1,440 database checks per day, with roughly one minute maximum expiry delay.
- Keep Pi SDK configuration in the existing sandbox/testnet mode. @chijoe09 already has farmer and buyer roles; the admin role has now been added.

## Technical details
- Add database routines for atomic reservation, cancellation/expiry, and safe old-order cleanup; integrate checkout and Pi approval/completion with the new expiry timestamp.
- Restrict privileged deletion/cleanup to the seller's own products or an authenticated admin; do not delete orders that have payment records.
- Verify current schema behavior, database migration, build diagnostics, and visible price/earnings output.