// Event closed down — flip to true to reopen package sales. Only gates the
// buyPackage/claimFreePackage purchase flows; login and staff tooling
// (check-in, participant lists, admin) are unaffected.
export const PACKAGE_SALES_OPEN = false;

export const PACKAGE_SALES_CLOSED_TITLE = 'Registration Closed';
export const PACKAGE_SALES_CLOSED_MESSAGE =
  "We're no longer accepting new package purchases. If you already have a pass, log in to view it.";
