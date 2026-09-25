import { GetApi, PostApi, PutApi, DeleteApi } from '@rabstack/rab-api-spec';
import { MarathonApis } from '../utils/endpoints';
import {
  ServerHealth,
  SendOTPBody,
  SendOTPResponse,
  SignUpBody,
  LoginBody,
  AuthResponse,
  BaseMerchandise,
  CreateMerchandiseBody,
  UpdateMerchandiseBody,
  BaseAddOn,
  CreateAddOnBody,
  UpdateAddOnBody,
  ListAddOnsQuery,
  BasePackage,
  CreatePackageBody,
  UpdatePackageBody,
  BaseCoupon,
  CreateCouponBody,
  UpdateCouponBody,
  ValidateCouponBody,
  ValidateCouponResponse,
  BaseParticipant,
  BuyPackageBody,
  BuyPackageResponse,
  ClaimFreePackageBody,
  ClaimFreePackageResponse,
  CheckInParticipantBody,
  SetCollectedMerchandiseBody,
  SetCollectedMerchandiseResponse,
  ListParticipantsQuery,
  BasePayment,
  ListPaymentsQuery,
  VerifyPaymentBody,
  VerifyPaymentResponse,
  CollectionCallbackBody,
  CollectionCallbackResponse,
  BaseWristband,
  GenerateWristbandsBody,
  GenerateWristbandsResponse,
  UpdateWristbandBody,
  ListWristbandsQuery,
  RedeemWristbandBody,
  RedeemWristbandResponse,
  BaseUser,
  BootstrapAdminBody,
  AddAdminUserBody,
  ListUsersQuery,
  StatsResponse,
  StatsQuery,
  ReportsResponse,
  ReportQuery,
  MeResponse,
} from '../domain';

export const MarathonSpecs = {
  healthCheck: GetApi<ServerHealth>(MarathonApis.healthCheck),
  sendOTP: PostApi<SendOTPResponse, SendOTPBody>(MarathonApis.sendOTP),
  signUp: PostApi<AuthResponse, SignUpBody>(MarathonApis.signUp),
  login: PostApi<AuthResponse, LoginBody>(MarathonApis.login),

  me: GetApi<MeResponse>(MarathonApis.me),

  createMerchandise: PostApi<BaseMerchandise, CreateMerchandiseBody>(
    MarathonApis.createMerchandise,
  ),
  listMerchandise: GetApi<BaseMerchandise[]>(MarathonApis.listMerchandise),
  getMerchandise: GetApi<BaseMerchandise, unknown, { id: string }>(
    MarathonApis.getMerchandise,
  ),
  updateMerchandise: PutApi<
    BaseMerchandise,
    UpdateMerchandiseBody,
    { id: string }
  >(MarathonApis.updateMerchandise),
  deleteMerchandise: DeleteApi<{ success: true }, { id: string }>(
    MarathonApis.deleteMerchandise,
  ),

  createAddOn: PostApi<BaseAddOn, CreateAddOnBody>(MarathonApis.createAddOn),
  listAddOns: GetApi<BaseAddOn[], ListAddOnsQuery>(MarathonApis.listAddOns),
  getAddOn: GetApi<BaseAddOn, unknown, { id: string }>(MarathonApis.getAddOn),
  updateAddOn: PutApi<BaseAddOn, UpdateAddOnBody, { id: string }>(
    MarathonApis.updateAddOn,
  ),
  deleteAddOn: DeleteApi<{ success: true }, { id: string }>(
    MarathonApis.deleteAddOn,
  ),

  createPackage: PostApi<BasePackage, CreatePackageBody>(
    MarathonApis.createPackage,
  ),
  listPackages: GetApi<BasePackage[]>(MarathonApis.listPackages),
  getPackage: GetApi<BasePackage, unknown, { id: string }>(
    MarathonApis.getPackage,
  ),
  updatePackage: PutApi<BasePackage, UpdatePackageBody, { id: string }>(
    MarathonApis.updatePackage,
  ),
  deletePackage: DeleteApi<{ success: true }, { id: string }>(
    MarathonApis.deletePackage,
  ),
  deletePrize: DeleteApi<
    { success: true },
    { packageId: string; prizeId: string }
  >(MarathonApis.deletePrize),

  createCoupon: PostApi<BaseCoupon, CreateCouponBody>(
    MarathonApis.createCoupon,
  ),
  listCoupons: GetApi<BaseCoupon[]>(MarathonApis.listCoupons),
  getCoupon: GetApi<BaseCoupon, unknown, { id: string }>(
    MarathonApis.getCoupon,
  ),
  updateCoupon: PutApi<BaseCoupon, UpdateCouponBody, { id: string }>(
    MarathonApis.updateCoupon,
  ),
  deleteCoupon: DeleteApi<{ success: true }, { id: string }>(
    MarathonApis.deleteCoupon,
  ),
  validateCoupon: PostApi<ValidateCouponResponse, ValidateCouponBody>(
    MarathonApis.validateCoupon,
  ),

  buyPackage: PostApi<BuyPackageResponse, BuyPackageBody>(
    MarathonApis.buyPackage,
  ),
  claimFreePackage: PostApi<ClaimFreePackageResponse, ClaimFreePackageBody>(
    MarathonApis.claimFreePackage,
  ),
  listParticipants: GetApi<BaseParticipant[], ListParticipantsQuery>(
    MarathonApis.listParticipants,
  ),
  // Returns an .xlsx attachment, not JSON.
  exportParticipants: GetApi<string, ListParticipantsQuery>(
    MarathonApis.exportParticipants,
  ),
  getParticipant: GetApi<BaseParticipant, unknown, { id: string }>(
    MarathonApis.getParticipant,
  ),
  checkInParticipant: PostApi<
    BaseParticipant,
    CheckInParticipantBody,
    { id: string }
  >(MarathonApis.checkInParticipant),
  setCollectedMerchandise: PutApi<
    SetCollectedMerchandiseResponse,
    SetCollectedMerchandiseBody,
    { id: string }
  >(MarathonApis.setCollectedMerchandise),

  verifyPayment: PostApi<VerifyPaymentResponse, VerifyPaymentBody>(
    MarathonApis.verifyPayment,
  ),
  collectionCallback: PostApi<
    CollectionCallbackResponse,
    CollectionCallbackBody,
    { trustId: string }
  >(MarathonApis.collectionCallback),
  listPayments: GetApi<BasePayment[], ListPaymentsQuery>(
    MarathonApis.listPayments,
  ),

  generateWristbands: PostApi<GenerateWristbandsResponse, GenerateWristbandsBody>(
    MarathonApis.generateWristbands,
  ),
  listWristbands: GetApi<BaseWristband[], ListWristbandsQuery>(
    MarathonApis.listWristbands,
  ),
  getWristband: GetApi<BaseWristband, unknown, { id: string }>(
    MarathonApis.getWristband,
  ),
  updateWristband: PutApi<BaseWristband, UpdateWristbandBody, { id: string }>(
    MarathonApis.updateWristband,
  ),
  deleteWristband: DeleteApi<{ success: true }, { id: string }>(
    MarathonApis.deleteWristband,
  ),
  redeemWristband: PostApi<RedeemWristbandResponse, RedeemWristbandBody>(
    MarathonApis.redeemWristband,
  ),

  bootstrapAdmin: PostApi<BaseUser, BootstrapAdminBody>(
    MarathonApis.bootstrapAdmin,
  ),
  addAdminUser: PostApi<BaseUser, AddAdminUserBody>(
    MarathonApis.addAdminUser,
  ),
  listUsers: GetApi<BaseUser[], ListUsersQuery>(MarathonApis.listUsers),

  stats: GetApi<StatsResponse, StatsQuery>(MarathonApis.stats),
  reports: GetApi<ReportsResponse, ReportQuery>(MarathonApis.reports),
  // feature specs appended in later tasks
};

export type MarathonApiSpecT = typeof MarathonSpecs;
