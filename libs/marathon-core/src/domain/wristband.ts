export type WristbandStatus = 'available' | 'redeemed' | 'disabled';

export type BaseWristband = {
  id: string;
  code: string;
  status: WristbandStatus;
  isPrinted: boolean;
  participantId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GenerateWristbandsBody = {
  count?: number;
};

export type GenerateWristbandsResponse = {
  generated: number;
  wristbands: BaseWristband[];
};

export type UpdateWristbandBody = {
  status?: WristbandStatus;
  isPrinted?: boolean;
};

export type ListWristbandsQuery = {
  status?: WristbandStatus;
};

export type RedeemWristbandBody = {
  wristbandCode: string;
  participantCode: string;
};

export type RedeemWristbandResponse = {
  wristband: BaseWristband;
};
