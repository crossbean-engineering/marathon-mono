import { Rab } from 'rab-access';
import { AppAccess } from './AppAccess';
import { AppRoles } from '../role';

export const AppGeneralPermissionSchema = Rab.schema({
  [AppAccess.canManageCatalog]: [Rab.grant(AppRoles.admin)],
  [AppAccess.canBuyPackage]: [
    Rab.grant(AppRoles.user),
  ],
  [AppAccess.canManageWristbands]: [Rab.grant(AppRoles.admin)],
  [AppAccess.canRedeemWristband]: [
    Rab.grant(AppRoles.admin),
    Rab.grant(AppRoles.agent),
  ],
  [AppAccess.canReadParticipants]: [
    Rab.grant(AppRoles.admin),
    Rab.grant(AppRoles.agent),
  ],
  [AppAccess.canCheckInParticipant]: [
    Rab.grant(AppRoles.admin),
    Rab.grant(AppRoles.agent),
  ],
  [AppAccess.canCollectMerchandise]: [
    Rab.grant(AppRoles.admin),
    Rab.grant(AppRoles.agent),
  ],
  [AppAccess.canReadPayments]: [Rab.grant(AppRoles.admin)],
  [AppAccess.canReadReports]: [Rab.grant(AppRoles.admin)],
  [AppAccess.canManageUsers]: [Rab.grant(AppRoles.admin)],
});
