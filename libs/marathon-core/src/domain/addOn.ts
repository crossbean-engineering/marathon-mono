// Weekend Package extras bought alongside a race package: accommodation and
// return transport. Prices are per person, in pesewas. A participant books at
// most one add-on of each type.
export type AddOnType = 'accommodation' | 'transport';

export type BaseAddOn = {
  id: string;
  type: AddOnType;
  name: string;
  provider?: string | null; // e.g. the hotel / apartment name
  description?: string | null;
  occupancy?: number | null; // accommodation only: people sharing the room
  price: number;
  capacity?: number | null; // null = unlimited
  // Bookings held by pending or active participants, and what's left of
  // capacity (null when unlimited).
  booked: number;
  remaining: number | null;
  isActive: boolean;
  createdAt: string;
};

// An add-on as booked on a participant. `price` is what was charged for it.
export type ParticipantAddOnSummary = {
  addOnId: string;
  type: AddOnType;
  name: string;
  provider?: string | null;
  occupancy?: number | null;
  price: number;
};

export type CreateAddOnBody = {
  type: AddOnType;
  name: string;
  provider?: string;
  description?: string;
  occupancy?: number;
  price: number;
  capacity?: number;
  isActive?: boolean;
};

// `type` is fixed once created. Send null to clear an optional field.
export type UpdateAddOnBody = {
  name?: string;
  provider?: string | null;
  description?: string | null;
  occupancy?: number | null;
  price?: number;
  capacity?: number | null;
  isActive?: boolean;
};

export type ListAddOnsQuery = {
  type?: AddOnType;
  // Public callers only need what can be booked; admin passes false.
  activeOnly?: boolean;
};
