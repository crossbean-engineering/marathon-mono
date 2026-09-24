const mockSet = jest.fn();

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    set: mockSet,
  }));
});

import { RedisService } from '../RedisService';

describe('RedisService.acquireLock', () => {
  let service: RedisService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RedisService({ host: 'localhost', port: 6379 });
  });

  it('calls SET with EX/NX, not a separate exists()-then-set()', async () => {
    mockSet.mockResolvedValue('OK');

    await service.acquireLock('broadcast:cooldown:system', 300);

    expect(mockSet).toHaveBeenCalledWith(
      'broadcast:cooldown:system',
      '1',
      'EX',
      300,
      'NX',
    );
    expect(mockSet).toHaveBeenCalledTimes(1);
  });

  it('returns true when the SET reports OK (lock acquired)', async () => {
    mockSet.mockResolvedValue('OK');
    await expect(service.acquireLock('key', 60)).resolves.toBe(true);
  });

  it('returns false when the SET reports null (key already held, NX blocked it)', async () => {
    mockSet.mockResolvedValue(null);
    await expect(service.acquireLock('key', 60)).resolves.toBe(false);
  });
});
