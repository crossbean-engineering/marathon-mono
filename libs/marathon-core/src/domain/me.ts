import { BaseUser } from './user';
import { BaseParticipant } from './participant';

// Same user payload as SessionFactory returns (BaseUser), minus the accessToken,
// plus the participants created by that user.
export type MeResponse = {
  user: BaseUser;
  participants: BaseParticipant[];
};
