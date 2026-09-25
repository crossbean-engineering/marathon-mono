// Gates the buyPackage/claimFreePackage purchase flows only; login and staff
// tooling (check-in, participant lists, admin) are unaffected. Open by default —
// build with VITE_PACKAGE_SALES_OPEN=false to close sales without a code change.
export const PACKAGE_SALES_OPEN =
  import.meta.env.VITE_PACKAGE_SALES_OPEN !== 'false';

export const PACKAGE_SALES_CLOSED_TITLE = 'Registration Closed';
export const PACKAGE_SALES_CLOSED_MESSAGE =
  "We're no longer accepting new registrations. If you already have a pass, log in to view it.";
