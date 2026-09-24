export const AppAccess = {
  canManageCatalog: 'canManageCatalog', // create/update/delete packages, merchandise, prizes
  canBuyPackage: 'canBuyPackage',
  canManageWristbands: 'canManageWristbands', // CRUD wristbands
  canRedeemWristband: 'canRedeemWristband',
  canReadParticipants: 'canReadParticipants', // list/get participants
  canCheckInParticipant: 'canCheckInParticipant', // assign runner number at the event
  canCollectMerchandise: 'canCollectMerchandise', // record merchandise handed over
  canReadPayments: 'canReadPayments',
  canReadReports: 'canReadReports',
  canManageUsers: 'canManageUsers', // add admin users, list users
} as const;

export type AppAccessKey = (typeof AppAccess)[keyof typeof AppAccess];
