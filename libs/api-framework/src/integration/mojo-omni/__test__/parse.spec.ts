import { optionalString, nullableString } from '../parse';

describe('optionalString', () => {
  it('passes a string through', () => {
    expect(optionalString('abc')).toBe('abc');
    expect(optionalString('')).toBe('');
  });

  it.each([null, undefined, 42, {}, []])('returns undefined for %p', (value) => {
    expect(optionalString(value)).toBeUndefined();
  });
});

describe('nullableString', () => {
  it('passes a string through', () => {
    expect(nullableString('abc')).toBe('abc');
  });

  it('preserves an explicit null, which the API uses to mean "not yet chosen"', () => {
    expect(nullableString(null)).toBeNull();
  });

  it.each([undefined, 42, {}])('returns undefined for %p', (value) => {
    expect(nullableString(value)).toBeUndefined();
  });
});
