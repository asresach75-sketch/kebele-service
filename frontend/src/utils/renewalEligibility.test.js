import { getRenewalExpiryIssue } from './renewalEligibility';

describe('renewal expiry eligibility', () => {
  const today = new Date('2026-10-26T12:00:00.000Z');

  it('requires a valid expiry date', () => {
    expect(getRenewalExpiryIssue('', today)).toBe('missing');
    expect(getRenewalExpiryIssue('2027-02-30', today)).toBe('invalid');
  });

  it('allows cards expired for no more than one year and cards expiring within six calendar months', () => {
    expect(getRenewalExpiryIssue('2025-10-26', today)).toBe('');
    expect(getRenewalExpiryIssue('2027-04-26', today)).toBe('');
  });

  it('blocks cards expired for more than one year', () => {
    expect(getRenewalExpiryIssue('2025-10-25', today)).toBe('too_late');
  });

  it('blocks cards with more than six months remaining', () => {
    expect(getRenewalExpiryIssue('2027-04-27', today)).toBe('too_early');
  });
});
