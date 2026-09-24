import { mapToPaymentStatus, mapToMandateStatus } from '../status';

describe('mapToPaymentStatus', () => {
  it.each([
    ['processing', 'pending'],
    ['succeeded', 'completed'],
    ['failed', 'failed'],
    // A checkout session that expired (past expires_at) or that the payer
    // backed out of via cancel_url — both terminal, neither ever settles, so
    // they must not read as 'pending' forever.
    ['cancelled', 'failed'],
    ['expired', 'failed'],
  ])('maps Omni %s to %s', (omni, expected) => {
    expect(mapToPaymentStatus(omni)).toBe(expected);
  });

  it.each([undefined, '', 'something_new'])(
    'falls back to pending for %p so an unknown status never reads as settled',
    (value) => {
      expect(mapToPaymentStatus(value)).toBe('pending');
    },
  );
});

describe('mapToMandateStatus', () => {
  it.each([
    ['processing', 'pending'],
    ['succeeded', 'approved'],
    ['cancelled', 'cancelled'],
    ['failed', 'rejected'],
  ])('maps Omni %s to %s', (omni, expected) => {
    expect(mapToMandateStatus(omni)).toBe(expected);
  });

  it.each([undefined, '', 'something_new'])('falls back to pending for %p', (value) => {
    expect(mapToMandateStatus(value)).toBe('pending');
  });
});
