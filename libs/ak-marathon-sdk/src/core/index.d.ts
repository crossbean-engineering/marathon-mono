import { EndpointSpec } from '@rabstack/rab-api-spec';

export declare type AddAdminUserBody = {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    role: 'admin' | 'agent';
};

export declare type AuthResponse = {
    accessToken: string;
    user: BaseUser;
};

export declare type BaseCoupon = {
    id: string;
    code: string;
    percentOff: number;
    isActive: boolean;
    packages: PackageSummary[];
    createdAt: string;
};

export declare type BaseMerchandise = {
    id: string;
    name: string;
    description?: string | null;
    createdAt: string;
};

export declare type BasePackage = {
    id: string;
    name: string;
    price: number;
    benefits?: string | null;
    merchandise: BaseMerchandise[];
    prizes: BasePrize[];
    createdAt: string;
};

export declare type BaseParticipant = {
    id: string;
    name: string;
    code: string;
    ic?: string | null;
    shirtSize?: string | null;
    gender?: Gender | null;
    status: ParticipantStatus;
    runnerNumber?: string | null;
    checkinDate?: string | null;
    packageId: string;
    package?: PackageSummary | null;
    collectedMerchandise?: CollectedMerchandise[];
    userId: string;
    wristbandCode?: string | null;
    createdAt: string;
};

export declare type BasePayment = {
    id: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
    provider: string;
    gateway: string;
    orderId: string;
    transactionId: string;
    momoNumber: string | null;
    network: PaymentNetwork | null;
    paymentMethod: PaymentMethod;
    email?: string | null;
    reason?: string | null;
    requiresAttention: boolean;
    performedBy: string;
    confirmedAt?: string | null;
    createdAt: string;
};

export declare type BasePrize = {
    id: string;
    name: string;
    amount?: number | null;
    position?: number | null;
    description?: string | null;
};

export declare type BaseUser = {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string | null;
    idNumber?: string | null;
    location?: string | null;
    role: UserRole;
    status: UserStatus;
    createdAt: string;
};

export declare type BaseWristband = {
    id: string;
    code: string;
    status: WristbandStatus;
    isPrinted: boolean;
    participantId?: string | null;
    createdAt: string;
    updatedAt: string;
};

export declare type BootstrapAdminBody = {
    secret: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
};

export declare type BuyPackageBody = {
    packageId?: string;
    participant?: {
        name: string;
        ic?: string;
        shirtSize?: string;
        gender?: Gender;
    };
    participantId?: string;
    payment: {
        momoNumber: string;
        network: 'MTN' | 'VODAFONE' | 'AIRTELTIGO';
        email?: string;
    };
    otp?: string;
    otpSessionId?: string;
    sessionToken?: string;
    idempotencyKey?: string;
    couponCode?: string;
};

export declare type BuyPackageResponse = {
    participant: BaseParticipant;
    payment: {
        orderId: string;
        transactionId: string;
        status: 'pending';
        originalAmount?: number;
        discountAmount?: number;
    };
    sessionToken?: string;
};

export declare type CheckInParticipantBody = {
    runnerNumber: string;
    shirtSize?: string;
};

export declare type ClaimFreePackageBody = {
    packageId?: string;
    participant?: {
        name: string;
        ic?: string;
        shirtSize?: string;
        gender?: Gender;
    };
    participantId?: string;
    couponCode: string;
    idempotencyKey?: string;
};

export declare type ClaimFreePackageResponse = {
    participant: BaseParticipant;
    payment: {
        orderId: string;
        transactionId: string;
        status: 'completed';
        originalAmount: number;
        discountAmount: number;
    };
};

export declare type CollectedMerchandise = {
    merchandiseId: string;
    name: string;
    description?: string | null;
    collectedAt: string;
};

export declare type CollectionCallbackBody = {
    orderId: string;
};

export declare type CollectionCallbackResponse = {
    received: true;
};

export declare type CreateCouponBody = {
    percentOff: number;
    isActive?: boolean;
    packageIds: string[];
};

export declare type CreateMerchandiseBody = {
    name: string;
    description?: string;
};

export declare type CreatePackageBody = {
    name: string;
    price: number;
    benefits?: string;
    merchandiseIds?: string[];
    prizes?: PackagePrizeInput[];
};

export declare enum ErrorCode {
    INVALID_INPUT = "INVALID_INPUT",
    INVALID_OTP = "INVALID_OTP",
    OTP_SESSION_NOT_FOUND = "OTP_SESSION_NOT_FOUND",
    PHONE_MISMATCH = "PHONE_MISMATCH",
    USER_NOT_FOUND = "USER_NOT_FOUND",
    USER_ALREADY_EXISTS = "USER_ALREADY_EXISTS",
    USER_SUSPENDED = "USER_SUSPENDED",
    PACKAGE_NOT_FOUND = "PACKAGE_NOT_FOUND",
    COUPON_NOT_FOUND = "COUPON_NOT_FOUND",
    COUPON_INACTIVE = "COUPON_INACTIVE",
    COUPON_NOT_APPLICABLE = "COUPON_NOT_APPLICABLE",
    MERCHANDISE_NOT_FOUND = "MERCHANDISE_NOT_FOUND",
    MERCHANDISE_NOT_IN_PACKAGE = "MERCHANDISE_NOT_IN_PACKAGE",
    PRIZE_NOT_FOUND = "PRIZE_NOT_FOUND",
    PARTICIPANT_NOT_FOUND = "PARTICIPANT_NOT_FOUND",
    PARTICIPANT_NAME_TAKEN = "PARTICIPANT_NAME_TAKEN",
    PARTICIPANT_ALREADY_ACTIVE = "PARTICIPANT_ALREADY_ACTIVE",
    PARTICIPANT_ALREADY_CHECKED_IN = "PARTICIPANT_ALREADY_CHECKED_IN",
    RUNNER_NUMBER_TAKEN = "RUNNER_NUMBER_TAKEN",
    PAYMENT_NOT_FOUND = "PAYMENT_NOT_FOUND",
    OTP_REQUIRED = "OTP_REQUIRED",
    SESSION_EXPIRED = "SESSION_EXPIRED",
    WRISTBAND_NOT_FOUND = "WRISTBAND_NOT_FOUND",
    WRISTBAND_DISABLED = "WRISTBAND_DISABLED",
    WRISTBAND_ALREADY_LINKED = "WRISTBAND_ALREADY_LINKED",
    FORBIDDEN = "FORBIDDEN",
    UNAUTHORIZED = "UNAUTHORIZED"
}

export declare type FinancialStats = {
    totalRevenuePesewas: number;
    completedPayments: number;
    pendingPayments: number;
    failedPayments: number;
};

export declare type Gender = 'male' | 'female';

export declare type GenderDistribution = {
    male: number;
    female: number;
    unspecified: number;
};

export declare type GenerateWristbandsBody = {
    count?: number;
};

export declare type GenerateWristbandsResponse = {
    generated: number;
    wristbands: BaseWristband[];
};

export declare type ListParticipantsQuery = {
    packageId?: string;
    status?: ParticipantStatus;
    code?: string;
    userId?: string;
    wristbandCode?: string;
    gender?: Gender;
    shirtSize?: string;
};

export declare type ListPaymentsQuery = {
    method?: PaymentMethod;
    status?: PaymentStatus;
};

export declare type ListUsersQuery = {
    role?: UserRole;
};

export declare type ListWristbandsQuery = {
    status?: WristbandStatus;
};

export declare type LoginBody = {
    phone: string;
    otp: string;
    otpSessionId: string;
};

export declare type MeResponse = {
    user: BaseUser;
    participants: BaseParticipant[];
};

export declare type OTPProvider = 'sms';

export declare type PackagePerformanceRow = {
    packageId: string;
    name: string;
    participants: number;
    revenuePesewas: number;
};

export declare type PackagePrizeInput = {
    id?: string;
    name: string;
    amount?: number;
    position?: number;
    description?: string;
};

export declare type PackageSummary = Pick<BasePackage, 'id' | 'name' | 'price' | 'benefits'>;

export declare type PaginationQuery = {
    page?: number;
    pageSize?: number;
};

export declare type ParticipantStats = {
    total: number;
    pending: number;
    active: number;
    suspended: number;
    genderDistribution: GenderDistribution;
    shirtSizeDistribution: ShirtSizeDistribution;
};

export declare type ParticipantStatus = 'pending' | 'active' | 'suspended';

export declare type PaymentMethod = 'card' | 'momo' | 'cash' | 'waived';

export declare type PaymentNetwork = 'MTN' | 'VODAFONE' | 'AIRTELTIGO';

export declare type PaymentStatus = 'pending' | 'completed' | 'failed';

export declare type RedeemWristbandBody = {
    wristbandCode: string;
    participantCode: string;
};

export declare type RedeemWristbandResponse = {
    wristband: BaseWristband;
};

export declare type ReportQuery = {
    reportType: ReportType;
};

export declare type ReportsResponse = {
    reportType: ReportType;
    rows: PackagePerformanceRow[];
};

export declare type ReportType = 'package_performance';

export declare type SendOTPBody = {
    identifier: string;
    provider: OTPProvider;
};

export declare type SendOTPResponse = {
    sessionId: string;
    expiresAt: string;
    provider: OTPProvider;
};

export declare type ServerHealth = {
    message: string;
    environment: string;
    version: string;
    commitSha: string;
    appVersion: string;
};

export declare type SetCollectedMerchandiseBody = {
    merchandiseIds: string[];
};

export declare type SetCollectedMerchandiseResponse = {
    participantId: string;
    collected: CollectedMerchandise[];
    added: string[];
    removed: string[];
    unchanged: string[];
};

export declare type ShirtSizeDistribution = Record<string, number>;

export declare type SignUpBody = {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    idNumber?: string;
    location?: string;
    otp: string;
    otpSessionId: string;
};

export declare type StatsQuery = {
    type: StatsType;
};

export declare type StatsResponse = UserStats | ParticipantStats | WristbandStats | FinancialStats;

export declare type StatsType = 'user_stats' | 'participant_stats' | 'wristband_stats' | 'financial_stats';

export declare type UpdateCouponBody = {
    percentOff?: number;
    isActive?: boolean;
    packageIds?: string[];
};

export declare type UpdateMerchandiseBody = Partial<CreateMerchandiseBody>;

export declare type UpdatePackageBody = {
    name?: string;
    price?: number;
    benefits?: string;
    merchandiseIds?: string[];
    prizes?: PackagePrizeInput[];
};

export declare type UpdateWristbandBody = {
    status?: WristbandStatus;
    isPrinted?: boolean;
};

export declare type UserRole = 'user' | 'agent' | 'admin';

export declare type UserStats = {
    totalUsers: number;
};

export declare type UserStatus = 'active' | 'suspended';

export declare type ValidateCouponBody = {
    code: string;
    packageId: string;
};

export declare type ValidateCouponResponse = {
    code: string;
    percentOff: number;
    originalAmount: number;
    discountAmount: number;
    netAmount: number;
};

export declare type VerifyOTPBody = {
    sessionId: string;
    otp: string;
    identifier: string;
};

export declare type VerifyOTPResponse = {
    valid: boolean;
    provider: OTPProvider;
};

export declare type VerifyPaymentBody = {
    transactionId: string;
};

export declare type VerifyPaymentResponse = {
    status: PaymentStatus;
};

export declare const WinRegistryApis: {
    readonly healthCheck: "/health-check";
    readonly sendOTP: "/otp/send";
    readonly signUp: "/auth/signup";
    readonly login: "/auth/login";
    readonly me: "/me";
    readonly createMerchandise: "/merchandise";
    readonly listMerchandise: "/merchandise";
    readonly getMerchandise: "/merchandise/:id";
    readonly updateMerchandise: "/merchandise/:id";
    readonly deleteMerchandise: "/merchandise/:id";
    readonly createPackage: "/packages";
    readonly listPackages: "/packages";
    readonly getPackage: "/packages/:id";
    readonly updatePackage: "/packages/:id";
    readonly deletePackage: "/packages/:id";
    readonly deletePrize: "/packages/:packageId/prizes/:prizeId";
    readonly createCoupon: "/coupons";
    readonly listCoupons: "/coupons";
    readonly getCoupon: "/coupons/:id";
    readonly updateCoupon: "/coupons/:id";
    readonly deleteCoupon: "/coupons/:id";
    readonly validateCoupon: "/coupons/validate";
    readonly buyPackage: "/participants/buy";
    readonly claimFreePackage: "/participants/claim";
    readonly listParticipants: "/participants";
    readonly exportParticipants: "/participants/export";
    readonly getParticipant: "/participants/:id";
    readonly checkInParticipant: "/participants/:id/checkin";
    readonly setCollectedMerchandise: "/participants/:id/merchandise";
    readonly verifyPayment: "/payments/verify";
    readonly collectionCallback: "/payments/callback/:trustId";
    readonly listPayments: "/payments";
    readonly generateWristbands: "/wristbands/generate";
    readonly listWristbands: "/wristbands";
    readonly getWristband: "/wristbands/:id";
    readonly updateWristband: "/wristbands/:id";
    readonly deleteWristband: "/wristbands/:id";
    readonly redeemWristband: "/wristbands/redeem";
    readonly bootstrapAdmin: "/admin/bootstrap";
    readonly addAdminUser: "/admin/users";
    readonly listUsers: "/admin/users";
    readonly stats: "/reports/stats";
    readonly reports: "/reports";
};

export declare type WinRegistryApiSpecT = typeof WinRegistrySpecs;

export declare const WinRegistrySpecs: {
    healthCheck: EndpointSpec<ServerHealth, unknown, unknown, unknown>;
    sendOTP: EndpointSpec<SendOTPResponse, SendOTPBody, unknown, unknown>;
    signUp: EndpointSpec<AuthResponse, SignUpBody, unknown, unknown>;
    login: EndpointSpec<AuthResponse, LoginBody, unknown, unknown>;
    me: EndpointSpec<MeResponse, unknown, unknown, unknown>;
    createMerchandise: EndpointSpec<BaseMerchandise, CreateMerchandiseBody, unknown, unknown>;
    listMerchandise: EndpointSpec<BaseMerchandise[], unknown, unknown, unknown>;
    getMerchandise: EndpointSpec<BaseMerchandise, unknown, unknown, {
    id: string;
    }>;
    updateMerchandise: EndpointSpec<BaseMerchandise, Partial<CreateMerchandiseBody>, unknown, {
    id: string;
    }>;
    deleteMerchandise: EndpointSpec<    {
    success: true;
    }, unknown, unknown, {
    id: string;
    }>;
    createPackage: EndpointSpec<BasePackage, CreatePackageBody, unknown, unknown>;
    listPackages: EndpointSpec<BasePackage[], unknown, unknown, unknown>;
    getPackage: EndpointSpec<BasePackage, unknown, unknown, {
    id: string;
    }>;
    updatePackage: EndpointSpec<BasePackage, UpdatePackageBody, unknown, {
    id: string;
    }>;
    deletePackage: EndpointSpec<    {
    success: true;
    }, unknown, unknown, {
    id: string;
    }>;
    deletePrize: EndpointSpec<    {
    success: true;
    }, unknown, unknown, {
    packageId: string;
    prizeId: string;
    }>;
    createCoupon: EndpointSpec<BaseCoupon, CreateCouponBody, unknown, unknown>;
    listCoupons: EndpointSpec<BaseCoupon[], unknown, unknown, unknown>;
    getCoupon: EndpointSpec<BaseCoupon, unknown, unknown, {
    id: string;
    }>;
    updateCoupon: EndpointSpec<BaseCoupon, UpdateCouponBody, unknown, {
    id: string;
    }>;
    deleteCoupon: EndpointSpec<    {
    success: true;
    }, unknown, unknown, {
    id: string;
    }>;
    validateCoupon: EndpointSpec<ValidateCouponResponse, ValidateCouponBody, unknown, unknown>;
    buyPackage: EndpointSpec<BuyPackageResponse, BuyPackageBody, unknown, unknown>;
    claimFreePackage: EndpointSpec<ClaimFreePackageResponse, ClaimFreePackageBody, unknown, unknown>;
    listParticipants: EndpointSpec<BaseParticipant[], unknown, ListParticipantsQuery, unknown>;
    exportParticipants: EndpointSpec<string, unknown, ListParticipantsQuery, unknown>;
    getParticipant: EndpointSpec<BaseParticipant, unknown, unknown, {
    id: string;
    }>;
    checkInParticipant: EndpointSpec<BaseParticipant, CheckInParticipantBody, unknown, {
    id: string;
    }>;
    setCollectedMerchandise: EndpointSpec<SetCollectedMerchandiseResponse, SetCollectedMerchandiseBody, unknown, {
    id: string;
    }>;
    verifyPayment: EndpointSpec<VerifyPaymentResponse, VerifyPaymentBody, unknown, unknown>;
    collectionCallback: EndpointSpec<CollectionCallbackResponse, CollectionCallbackBody, unknown, {
    trustId: string;
    }>;
    listPayments: EndpointSpec<BasePayment[], unknown, ListPaymentsQuery, unknown>;
    generateWristbands: EndpointSpec<GenerateWristbandsResponse, GenerateWristbandsBody, unknown, unknown>;
    listWristbands: EndpointSpec<BaseWristband[], unknown, ListWristbandsQuery, unknown>;
    getWristband: EndpointSpec<BaseWristband, unknown, unknown, {
    id: string;
    }>;
    updateWristband: EndpointSpec<BaseWristband, UpdateWristbandBody, unknown, {
    id: string;
    }>;
    deleteWristband: EndpointSpec<    {
    success: true;
    }, unknown, unknown, {
    id: string;
    }>;
    redeemWristband: EndpointSpec<RedeemWristbandResponse, RedeemWristbandBody, unknown, unknown>;
    bootstrapAdmin: EndpointSpec<BaseUser, BootstrapAdminBody, unknown, unknown>;
    addAdminUser: EndpointSpec<BaseUser, AddAdminUserBody, unknown, unknown>;
    listUsers: EndpointSpec<BaseUser[], unknown, ListUsersQuery, unknown>;
    stats: EndpointSpec<StatsResponse, unknown, StatsQuery, unknown>;
    reports: EndpointSpec<ReportsResponse, unknown, ReportQuery, unknown>;
};

export declare type WristbandStats = {
    total: number;
    available: number;
    redeemed: number;
    disabled: number;
    assigned: number;
};

export declare type WristbandStatus = 'available' | 'redeemed' | 'disabled';

export { }
