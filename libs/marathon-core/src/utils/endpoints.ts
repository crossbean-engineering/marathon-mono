export const MarathonApis = {
  healthCheck: '/health-check',

  // OTP + Auth
  sendOTP: '/otp/send',
  signUp: '/auth/signup',
  login: '/auth/login',

  // Me (authenticated user's own profile + participants)
  me: '/me',

  // Merchandise
  createMerchandise: '/merchandise',
  listMerchandise: '/merchandise',
  getMerchandise: '/merchandise/:id',
  updateMerchandise: '/merchandise/:id',
  deleteMerchandise: '/merchandise/:id',

  // Packages
  createPackage: '/packages',
  listPackages: '/packages',
  getPackage: '/packages/:id',
  updatePackage: '/packages/:id',
  deletePackage: '/packages/:id',
  deletePrize: '/packages/:packageId/prizes/:prizeId',

  // Coupons (admin CRUD + buyer-facing validate)
  createCoupon: '/coupons',
  listCoupons: '/coupons',
  getCoupon: '/coupons/:id',
  updateCoupon: '/coupons/:id',
  deleteCoupon: '/coupons/:id',
  validateCoupon: '/coupons/validate',

  // Participants + buy
  buyPackage: '/participants/buy',
  // Settle a registration with a 100%-off coupon — no charge, no OTP.
  claimFreePackage: '/participants/claim',
  listParticipants: '/participants',
  // Same filters as listParticipants, rendered as an .xlsx download.
  exportParticipants: '/participants/export',
  getParticipant: '/participants/:id',
  // Check-in at the event: assign a runner number + shirt size (admin/agent).
  checkInParticipant: '/participants/:id/checkin',
  // Set the merchandise a participant has collected (admin/agent).
  setCollectedMerchandise: '/participants/:id/merchandise',

  // Payments
  verifyPayment: '/payments/verify',
  collectionCallback: '/payments/callback/:trustId',
  listPayments: '/payments',

  // Wristbands
  generateWristbands: '/wristbands/generate',
  listWristbands: '/wristbands',
  getWristband: '/wristbands/:id',
  updateWristband: '/wristbands/:id',
  deleteWristband: '/wristbands/:id',
  redeemWristband: '/wristbands/redeem',

  // Admin + reports
  bootstrapAdmin: '/admin/bootstrap',
  addAdminUser: '/admin/users',
  listUsers: '/admin/users',
  stats: '/reports/stats',
  reports: '/reports',
} as const;
