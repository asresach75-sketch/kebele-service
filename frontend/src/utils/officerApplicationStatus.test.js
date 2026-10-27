import { getOfficerApplicationStatusGroup } from './officerApplicationStatus';

describe('officer application status groups', () => {
  test.each(['PENDING_OFFICER', 'Pending', 'pending'])('%s is pending review', (status) => {
    expect(getOfficerApplicationStatusGroup(status)).toBe('pending');
  });

  test.each(['APPROVED_BY_OFFICER', 'PAID_PENDING_FINANCE', 'APPROVED_BY_FINANCE', 'COMPLETED', 'Approved'])('%s remains visible in approved applications', (status) => {
    expect(getOfficerApplicationStatusGroup(status)).toBe('approved');
  });

  test('keeps correction and rejected applications in their own groups', () => {
    expect(getOfficerApplicationStatusGroup('NEEDS_CORRECTION')).toBe('correction');
    expect(getOfficerApplicationStatusGroup('Rejected')).toBe('rejected');
  });
});
