import { GetApi, PostApi, DeleteApi, PutApi } from '@rabstack/rab-api-spec';

const WinRegistryApis = {
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
    // Weekend Package add-ons (accommodation, transport)
    createAddOn: '/add-ons',
    listAddOns: '/add-ons',
    getAddOn: '/add-ons/:id',
    updateAddOn: '/add-ons/:id',
    deleteAddOn: '/add-ons/:id',
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
    reports: '/reports'
};

var ErrorCode;
(function(ErrorCode) {
    ErrorCode["INVALID_INPUT"] = "INVALID_INPUT";
    ErrorCode["INVALID_OTP"] = "INVALID_OTP";
    ErrorCode["OTP_SESSION_NOT_FOUND"] = "OTP_SESSION_NOT_FOUND";
    ErrorCode["PHONE_MISMATCH"] = "PHONE_MISMATCH";
    ErrorCode["USER_NOT_FOUND"] = "USER_NOT_FOUND";
    ErrorCode["USER_ALREADY_EXISTS"] = "USER_ALREADY_EXISTS";
    ErrorCode["USER_SUSPENDED"] = "USER_SUSPENDED";
    ErrorCode["PACKAGE_NOT_FOUND"] = "PACKAGE_NOT_FOUND";
    ErrorCode["COUPON_NOT_FOUND"] = "COUPON_NOT_FOUND";
    ErrorCode["COUPON_INACTIVE"] = "COUPON_INACTIVE";
    ErrorCode["COUPON_NOT_APPLICABLE"] = "COUPON_NOT_APPLICABLE";
    ErrorCode["MERCHANDISE_NOT_FOUND"] = "MERCHANDISE_NOT_FOUND";
    ErrorCode["MERCHANDISE_NOT_IN_PACKAGE"] = "MERCHANDISE_NOT_IN_PACKAGE";
    ErrorCode["ADD_ON_NOT_FOUND"] = "ADD_ON_NOT_FOUND";
    ErrorCode["ADD_ON_INACTIVE"] = "ADD_ON_INACTIVE";
    ErrorCode["ADD_ON_SOLD_OUT"] = "ADD_ON_SOLD_OUT";
    ErrorCode["ADD_ON_CONFLICT"] = "ADD_ON_CONFLICT";
    ErrorCode["ADD_ON_IN_USE"] = "ADD_ON_IN_USE";
    ErrorCode["PRIZE_NOT_FOUND"] = "PRIZE_NOT_FOUND";
    ErrorCode["PARTICIPANT_NOT_FOUND"] = "PARTICIPANT_NOT_FOUND";
    ErrorCode["PARTICIPANT_NAME_TAKEN"] = "PARTICIPANT_NAME_TAKEN";
    ErrorCode["PARTICIPANT_ALREADY_ACTIVE"] = "PARTICIPANT_ALREADY_ACTIVE";
    ErrorCode["PARTICIPANT_ALREADY_CHECKED_IN"] = "PARTICIPANT_ALREADY_CHECKED_IN";
    ErrorCode["RUNNER_NUMBER_TAKEN"] = "RUNNER_NUMBER_TAKEN";
    ErrorCode["PAYMENT_NOT_FOUND"] = "PAYMENT_NOT_FOUND";
    ErrorCode["OTP_REQUIRED"] = "OTP_REQUIRED";
    ErrorCode["SESSION_EXPIRED"] = "SESSION_EXPIRED";
    ErrorCode["WRISTBAND_NOT_FOUND"] = "WRISTBAND_NOT_FOUND";
    ErrorCode["WRISTBAND_DISABLED"] = "WRISTBAND_DISABLED";
    ErrorCode["WRISTBAND_ALREADY_LINKED"] = "WRISTBAND_ALREADY_LINKED";
    ErrorCode["FORBIDDEN"] = "FORBIDDEN";
    ErrorCode["UNAUTHORIZED"] = "UNAUTHORIZED";
})(ErrorCode || (ErrorCode = {}));

const WinRegistrySpecs = {
    healthCheck: GetApi(WinRegistryApis.healthCheck),
    sendOTP: PostApi(WinRegistryApis.sendOTP),
    signUp: PostApi(WinRegistryApis.signUp),
    login: PostApi(WinRegistryApis.login),
    me: GetApi(WinRegistryApis.me),
    createMerchandise: PostApi(WinRegistryApis.createMerchandise),
    listMerchandise: GetApi(WinRegistryApis.listMerchandise),
    getMerchandise: GetApi(WinRegistryApis.getMerchandise),
    updateMerchandise: PutApi(WinRegistryApis.updateMerchandise),
    deleteMerchandise: DeleteApi(WinRegistryApis.deleteMerchandise),
    createAddOn: PostApi(WinRegistryApis.createAddOn),
    listAddOns: GetApi(WinRegistryApis.listAddOns),
    getAddOn: GetApi(WinRegistryApis.getAddOn),
    updateAddOn: PutApi(WinRegistryApis.updateAddOn),
    deleteAddOn: DeleteApi(WinRegistryApis.deleteAddOn),
    createPackage: PostApi(WinRegistryApis.createPackage),
    listPackages: GetApi(WinRegistryApis.listPackages),
    getPackage: GetApi(WinRegistryApis.getPackage),
    updatePackage: PutApi(WinRegistryApis.updatePackage),
    deletePackage: DeleteApi(WinRegistryApis.deletePackage),
    deletePrize: DeleteApi(WinRegistryApis.deletePrize),
    createCoupon: PostApi(WinRegistryApis.createCoupon),
    listCoupons: GetApi(WinRegistryApis.listCoupons),
    getCoupon: GetApi(WinRegistryApis.getCoupon),
    updateCoupon: PutApi(WinRegistryApis.updateCoupon),
    deleteCoupon: DeleteApi(WinRegistryApis.deleteCoupon),
    validateCoupon: PostApi(WinRegistryApis.validateCoupon),
    buyPackage: PostApi(WinRegistryApis.buyPackage),
    claimFreePackage: PostApi(WinRegistryApis.claimFreePackage),
    listParticipants: GetApi(WinRegistryApis.listParticipants),
    // Returns an .xlsx attachment, not JSON.
    exportParticipants: GetApi(WinRegistryApis.exportParticipants),
    getParticipant: GetApi(WinRegistryApis.getParticipant),
    checkInParticipant: PostApi(WinRegistryApis.checkInParticipant),
    setCollectedMerchandise: PutApi(WinRegistryApis.setCollectedMerchandise),
    verifyPayment: PostApi(WinRegistryApis.verifyPayment),
    collectionCallback: PostApi(WinRegistryApis.collectionCallback),
    listPayments: GetApi(WinRegistryApis.listPayments),
    generateWristbands: PostApi(WinRegistryApis.generateWristbands),
    listWristbands: GetApi(WinRegistryApis.listWristbands),
    getWristband: GetApi(WinRegistryApis.getWristband),
    updateWristband: PutApi(WinRegistryApis.updateWristband),
    deleteWristband: DeleteApi(WinRegistryApis.deleteWristband),
    redeemWristband: PostApi(WinRegistryApis.redeemWristband),
    bootstrapAdmin: PostApi(WinRegistryApis.bootstrapAdmin),
    addAdminUser: PostApi(WinRegistryApis.addAdminUser),
    listUsers: GetApi(WinRegistryApis.listUsers),
    stats: GetApi(WinRegistryApis.stats),
    reports: GetApi(WinRegistryApis.reports)
};

export { ErrorCode, WinRegistryApis, WinRegistrySpecs };
